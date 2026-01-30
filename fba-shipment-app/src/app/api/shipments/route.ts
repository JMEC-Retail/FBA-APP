import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause based on user role and filters
    const whereClause: Record<string, unknown> = {}

    // Role-based access control
    if (session.user.role === 'SHIPPER') {
      whereClause.shipperId = session.user.id
    } else if (session.user.role === 'PACKER') {
      // Packers can only see shipments assigned to them via picker links
      const assignedShipmentIds = await prisma.pickerLink.findMany({
        where: { packerId: session.user.id, isActive: true },
        select: { shipmentId: true }
      })
      
      whereClause.id = {
        in: assignedShipmentIds.map(link => link.shipmentId)
      }
    }

    // Apply filters
    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    // Build order clause
    const orderClause: Record<string, 'asc' | 'desc'> = {}
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'name') {
      orderClause[sortBy] = sortOrder as 'asc' | 'desc'
    }

    // Execute query with pagination
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where: whereClause,
        include: {
          shipper: {
            select: { name: true, email: true }
          },
          _count: {
            select: {
              items: true,
              boxes: true,
              pickerLinks: true
            }
          }
        },
        orderBy: orderClause,
        skip,
        take: limit
      }),
      prisma.shipment.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      totalPages // for backward compatibility
    })

  } catch (error) {
    console.error('Failed to fetch shipments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SHIPPER') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only ADMIN or SHIPPER roles allowed.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Shipment name is required' },
        { status: 400 }
      )
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        name: name.trim(),
        shipperId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        shipper: {
          select: { name: true, email: true }
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

    return NextResponse.json({
      message: 'Shipment created successfully',
      shipment
    })

  } catch (error) {
    console.error('Failed to create shipment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Get existing shipment to check permissions
    const existingShipment = await prisma.shipment.findUnique({
      where: { id }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check edit permissions
    const canEdit = session.user.role === 'ADMIN' || 
                   (session.user.role === 'SHIPPER' && existingShipment.shipperId === session.user.id)

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this shipment' },
        { status: 403 }
      )
    }

    // Update shipment
    const updateData: Record<string, unknown> = {}
    if (name && name.trim()) {
      updateData.name = name.trim()
    }
    if (status && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      updateData.status = status
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        shipper: {
          select: { name: true, email: true }
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

    return NextResponse.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    })

  } catch (error) {
    console.error('Failed to update shipment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Get existing shipment to check permissions
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
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
            shipmentId: id
          }
        }
      })

      // Delete boxes
      await tx.box.deleteMany({
        where: { shipmentId: id }
      })

      // Delete items
      await tx.item.deleteMany({
        where: { shipmentId: id }
      })

      // Delete picker links
      await tx.pickerLink.deleteMany({
        where: { shipmentId: id }
      })

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { shipmentId: id }
      })

      // Finally delete the shipment
      await tx.shipment.delete({
        where: { id }
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