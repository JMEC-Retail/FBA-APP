import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditInfo } from '@/lib/audit'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify shipment exists and user has access
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        shipper: true,
        items: {
          include: {
            boxItems: true
          }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'SHIPPER' && shipment.shipperId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (session.user.role === 'PACKER' && shipment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Shipment is not active' }, { status: 400 })
    }

    // Calculate available quantities for each item
    const itemsWithAvailability = shipment.items.map(item => {
      const totalPicked = item.boxItems.reduce((sum, boxItem) => sum + boxItem.quantity, 0)
      const availableQuantity = item.quantity - totalPicked
      
      return {
        ...item,
        availableQuantity,
        isFullyPicked: availableQuantity <= 0
      }
    })

    // Log action
    await logAuditInfo('VIEW_SHIPMENT_ITEMS', {
      userId: session.user.id,
      shipmentId: id
    }, `Viewed items for shipment ${shipment.name}`)

    return NextResponse.json(itemsWithAvailability)
  } catch (error) {
    console.error('Error fetching shipment items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}