import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: shipmentId } = await params

    // Get existing shipment to check permissions
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        items: true,
        boxes: true,
        pickerLinks: true
      }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check delete permissions
    const canDelete = session.user.role === 'ADMIN' || 
                     (session.user.role === 'SHIPPER' && existingShipment.shipperId === session.user.id)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this shipment' },
        { status: 403 }
      )
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete box items
      await tx.boxItem.deleteMany({
        where: {
          box: {
            shipmentId: shipmentId
          }
        }
      })

      // Delete boxes
      await tx.box.deleteMany({
        where: { shipmentId: shipmentId }
      })

      // Delete items
      await tx.item.deleteMany({
        where: { shipmentId: shipmentId }
      })

      // Delete picker links
      await tx.pickerLink.deleteMany({
        where: { shipmentId: shipmentId }
      })

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { shipmentId: shipmentId }
      })

      // Finally delete the shipment
      await tx.shipment.delete({
        where: { id: shipmentId }
      })
    })

    return NextResponse.json({
      message: 'Shipment deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete shipment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: shipmentId } = await params

    // Get shipment with role-based access
    const whereClause = { id: shipmentId }

    if (session.user.role === 'SHIPPER') {
      whereClause.id = shipmentId
      const existingShipment = await prisma.shipment.findUnique({
        where: { id: shipmentId, shipperId: session.user.id }
      })
      
      if (!existingShipment) {
        return NextResponse.json(
          { error: 'Shipment not found or access denied' },
          { status: 404 }
        )
      }
    } else if (session.user.role === 'PACKER') {
      // Packers can only see shipments assigned to them
      const assignedShipmentIds = await prisma.pickerLink.findMany({
        where: { packerId: session.user.id, isActive: true },
        select: { shipmentId: true }
      })
      
      if (!assignedShipmentIds.some(link => link.shipmentId === shipmentId)) {
        return NextResponse.json(
          { error: 'Shipment not found or access denied' },
          { status: 404 }
        )
      }
    }

    const shipment = await prisma.shipment.findFirst({
      where: whereClause,
      include: {
        shipper: {
          select: { name: true, email: true }
        },
        items: true,
        boxes: {
          include: {
            boxItems: {
              include: {
                item: true
              }
            }
          }
        },
        pickerLinks: {
          include: {
            packer: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            items: true,
            boxes: true,
            pickerLinks: true
          }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ shipment })

  } catch (error) {
    console.error('Failed to fetch shipment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}