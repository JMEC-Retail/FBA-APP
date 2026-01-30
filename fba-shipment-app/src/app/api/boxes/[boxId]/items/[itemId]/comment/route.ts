import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditInfo } from '@/lib/audit'

interface Params {
  params: Promise<{ boxId: string; itemId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { boxId, itemId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { comment } = await request.json()

    if (!comment || typeof comment !== 'string') {
      return NextResponse.json({ error: 'Comment is required and must be a string' }, { status: 400 })
    }

    // Verify the box exists
    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: {
        shipment: true,
        boxItems: {
          where: { itemId },
          include: { item: true }
        }
      }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    // Check if item exists in box
    const boxItem = box.boxItems[0]
    if (!boxItem) {
      return NextResponse.json({ error: 'Item not found in box' }, { status: 404 })
    }

    // For this implementation, we'll store comments in the audit log
    // In a real-world scenario, you might want to add a comment field to BoxItem model
    await logAuditInfo('ADD_ITEM_COMMENT', {
      userId: session.user.id,
      shipmentId: box.shipmentId
    }, `Comment on item ${boxItem.item.sku} in box ${box.name}: "${comment}"`)

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment: {
        itemId,
        boxId,
        comment,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error adding comment to item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}