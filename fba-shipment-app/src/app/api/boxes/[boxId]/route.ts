import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditInfo } from '@/lib/audit'

interface Params {
  params: Promise<{ boxId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { boxId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: {
        shipment: {
          include: {
            shipper: {
              select: { id: true, name: true, email: true }
            }
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

    // Log action
    await logAuditInfo('VIEW_BOX', {
      userId: session.user.id,
      shipmentId: box.shipmentId
    }, `Viewed box ${box.name} (${boxId})`)

    return NextResponse.json(box)
  } catch (error) {
    console.error('Error fetching box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { boxId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, quantity } = await request.json()

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid item ID or quantity' }, { status: 400 })
    }

    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: { shipment: true }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    if (box.status !== 'OPEN') {
      return NextResponse.json({ error: 'Cannot add items to concluded box' }, { status: 400 })
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.shipmentId !== box.shipmentId) {
      return NextResponse.json({ error: 'Item does not belong to this shipment' }, { status: 400 })
    }

    const existingBoxItem = await prisma.boxItem.findUnique({
      where: {
        boxId_itemId: {
          boxId: boxId,
          itemId: itemId
        }
      }
    })

    if (existingBoxItem) {
      const newQuantity = existingBoxItem.quantity + quantity
      const totalPicked = await prisma.boxItem.aggregate({
        where: { itemId },
        _sum: { quantity: true }
      })

      const availableQuantity = item.quantity - (totalPicked._sum.quantity || 0) + existingBoxItem.quantity

      if (newQuantity > availableQuantity) {
        return NextResponse.json({ 
          error: `Insufficient quantity. Available: ${availableQuantity}, Requested: ${newQuantity}` 
        }, { status: 400 })
      }

      await prisma.boxItem.update({
        where: { id: existingBoxItem.id },
        data: { quantity: newQuantity }
      })
    } else {
      const totalPicked = await prisma.boxItem.aggregate({
        where: { itemId },
        _sum: { quantity: true }
      })

      const availableQuantity = item.quantity - (totalPicked._sum.quantity || 0)

      if (quantity > availableQuantity) {
        return NextResponse.json({ 
          error: `Insufficient quantity. Available: ${availableQuantity}, Requested: ${quantity}` 
        }, { status: 400 })
      }

      await prisma.boxItem.create({
        data: {
          boxId: boxId,
          itemId: itemId,
          quantity: quantity
        }
      })
    }

    await prisma.item.update({
      where: { id: itemId },
      data: {
        pickedQty: {
          increment: quantity
        }
      }
    })

    await logAuditInfo('ADD_ITEM_TO_BOX', {
      userId: session.user.id,
      shipmentId: box.shipmentId
    }, `Added ${quantity} units of item ${item.sku} to box ${box.name}`)

    return NextResponse.json({ message: 'Item added successfully' })
  } catch (error) {
    console.error('Error adding item to box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { boxId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, comments } = await request.json()

    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: { shipment: true }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    if (box.status !== 'OPEN') {
      return NextResponse.json({ error: 'Cannot update concluded box' }, { status: 400 })
    }

    const updatedBox = await prisma.box.update({
      where: { id: boxId },
      data: {
        ...(name && { name }),
        ...(comments !== undefined && { comments })
      }
    })

    await logAuditInfo('UPDATE_BOX', {
      userId: session.user.id,
      shipmentId: box.shipmentId
    }, `Updated box ${name || box.name}${comments ? ' with comments' : ''}`)

    return NextResponse.json(updatedBox)
  } catch (error) {
    console.error('Error updating box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { boxId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const box = await prisma.box.findUnique({
      where: { id: boxId },
      include: { shipment: true }
    })

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 })
    }

    if (box.status !== 'OPEN') {
      return NextResponse.json({ error: 'Cannot remove items from concluded box' }, { status: 400 })
    }

    const boxItem = await prisma.boxItem.findUnique({
      where: {
        boxId_itemId: {
          boxId: boxId,
          itemId: itemId
        }
      },
      include: { item: true }
    })

    if (!boxItem) {
      return NextResponse.json({ error: 'Item not found in box' }, { status: 404 })
    }

    await prisma.item.update({
      where: { id: itemId },
      data: {
        pickedQty: {
          decrement: boxItem.quantity
        }
      }
    })

    await prisma.boxItem.delete({
      where: { id: boxItem.id }
    })

    await logAuditInfo('REMOVE_ITEM_FROM_BOX', {
      userId: session.user.id,
      shipmentId: box.shipmentId
    }, `Removed ${boxItem.quantity} units of item ${boxItem.item.sku} from box ${box.name}`)

    return NextResponse.json({ message: 'Item removed successfully' })
  } catch (error) {
    console.error('Error removing item from box:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}