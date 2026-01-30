import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notifyBoxConcluded, notifyShipmentCompleted } from '@/lib/notifications'
import { logAuditInfo } from '@/lib/audit'

interface Params {
  params: Promise<{ boxId: string }>
}

// POST /api/boxes/[boxId]/conclude - Conclude a box
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { boxId } = await params
    const session = await auth()

    if (!boxId) {
      return NextResponse.json({ error: 'Box ID is required' }, { status: 400 })
    }

    // Verify the box exists and is open
    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: {
        shipment: {
          include: {
            items: true
          }
        },
        boxItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    if (box.status !== 'OPEN') {
      return NextResponse.json({ error: 'Box is already concluded' }, { status: 400 })
    }

    // Check if all items in the box match the required quantities
    const boxItemQuantities: Record<string, number> = {}
    box.boxItems.forEach(boxItem => {
      boxItemQuantities[boxItem.itemId] = (boxItemQuantities[boxItem.itemId] || 0) + boxItem.quantity
    })

    // Verify that box contents don't exceed shipment requirements
    const validationErrors: string[] = []
    for (const [itemId, boxQuantity] of Object.entries(boxItemQuantities)) {
      const item = box.shipment.items.find(item => item.id === itemId)
      if (item && boxQuantity > item.quantity) {
        validationErrors.push(`Item ${item.sku}: Box contains ${boxQuantity} units but only ${item.quantity} required`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Box validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Conclude the box
    const concludedBox = await prisma.box.update({
      where: { id: boxId },
      data: {
        status: 'CONCLUDED',
        concludedAt: new Date()
      },
      include: {
        boxItems: {
          include: {
            item: {
              select: {
                id: true,
                sku: true,
                fnSku: true,
                quantity: true,
                pickedQty: true
              }
            }
          }
        }
      }
    })

    // Check if all boxes in the shipment are concluded
    const remainingOpenBoxes = await prisma.box.count({
      where: {
        shipmentId: box.shipmentId,
        status: 'OPEN'
      }
    })

    // If all boxes are concluded, update shipment status to COMPLETED
    if (remainingOpenBoxes === 0) {
      await prisma.shipment.update({
        where: { id: box.shipmentId },
        data: { status: 'COMPLETED' }
      })
      
      // Notify packers that shipment is completed
      await notifyShipmentCompleted(box.shipmentId)
    }
    
    // Notify packers that box was concluded
    await notifyBoxConcluded(boxId, box.shipmentId)

    // Generate CSV report
    const csvRows = ['[SKU],[QTY],seller,seller format']
    
    concludedBox.boxItems.forEach(boxItem => {
      csvRows.push(`${boxItem.item.sku},${boxItem.quantity},,`)
    })

    const csvContent = csvRows.join('\n')
    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    // Log the action
    const userId = session?.user?.id || 'anonymous'
    await logAuditInfo('CONCLUDE_BOX', { userId, shipmentId: box.shipmentId }, `Concluded box ${box.name} with ${concludedBox.boxItems.length} items`)

    // Return both JSON response and CSV file
    const response = NextResponse.json({
      message: 'Box concluded successfully',
      box: concludedBox,
      allBoxesConcluded: remainingOpenBoxes === 0
    })

    // Add CSV as attachment if requested
    const { searchParams } = new URL(request.url)
    if (searchParams.get('download') === 'csv') {
      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="box_${box.name}_${Date.now()}.csv"`,
          'Content-Length': csvBuffer.length.toString()
        }
      })
    }

    return response

  } catch (error) {
    console.error('Error concluding box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}