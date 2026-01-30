import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAuditInfo } from '@/lib/audit'

interface Params {
  params: Promise<{ boxId: string }>
}

// POST /api/boxes/[boxId]/items - Add item to box
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { boxId } = await params
    const session = await auth()
    const body = await request.json()
    const { itemId, quantity } = body

    if (!boxId || !itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Box ID, Item ID, and positive quantity are required' }, { status: 400 })
    }

    // Verify the box exists and is open
    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: {
        shipment: {
          include: {
            items: true
          }
        }
      }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    if (box.status !== 'OPEN') {
      return NextResponse.json({ error: 'Box is not open for picking' }, { status: 400 })
    }

    // Verify the item belongs to this shipment
    const item = box.shipment.items.find(item => item.id === itemId)
    if (!item) {
      return NextResponse.json({ error: 'Item not found in this shipment' }, { status: 404 })
    }

    // Check if we have enough remaining items to pick
    const totalPickedInBox = await prisma.boxItem.aggregate({
      where: { boxId, itemId },
      _sum: { quantity: true }
    })

    const currentBoxQuantity = totalPickedInBox._sum.quantity || 0
    const totalPickedInShipment = item.pickedQty + quantity

    if (totalPickedInShipment > item.quantity) {
      return NextResponse.json({ 
        error: `Cannot pick ${quantity} more units. Only ${item.quantity - item.pickedQty} remaining` 
      }, { status: 400 })
    }

    // Add item to box (create or update BoxItem)
    const boxItem = await prisma.boxItem.upsert({
      where: {
        boxId_itemId: { boxId, itemId }
      },
      update: {
        quantity: currentBoxQuantity + quantity
      },
      create: {
        boxId,
        itemId,
        quantity
      },
      include: {
        item: true
      }
    })

    // Update the item's picked quantity
    await prisma.item.update({
      where: { id: itemId },
      data: {
        pickedQty: totalPickedInShipment
      }
    })

    // Log the action (with or without user session)
    const userId = session?.user?.id || 'anonymous'
    await logAuditInfo('ADD_ITEM_TO_BOX', {
      userId,
      shipmentId: box.shipmentId
    }, `Added ${quantity} units of item ${itemId} to box ${boxId}`)

    return NextResponse.json({ 
      message: 'Item added to box successfully',
      boxItem: {
        ...boxItem,
        itemPickedQty: totalPickedInShipment,
        itemRemainingQty: item.quantity - totalPickedInShipment
      }
    })

  } catch (error) {
    console.error('Error adding item to box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}