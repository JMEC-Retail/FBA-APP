import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logAuditInfo } from '@/lib/audit'

// GET /api/picker-links - List all picker links for authenticated user or get specific picker link by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // If id is provided, get specific picker link
    if (id) {
      const session = await auth()
      
      if (!session?.user || !['SHIPPER', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Find the picker link
      const pickerLink = await prisma.pickerLink.findUnique({
        where: { id },
        include: {
          shipment: {
            include: {
              shipper: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              items: true,
              boxes: true
            }
          },
          packer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!pickerLink) {
        return NextResponse.json({ error: 'Picker link not found' }, { status: 404 })
      }

      // Check permissions
      if (session.user.role === 'SHIPPER' && pickerLink.shipment.shipperId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Log audit action
      await logAuditInfo('VIEW_PICKER_LINK', {
        userId: session.user.id,
        shipmentId: pickerLink.shipmentId
      }, `Viewed picker link ${id} for shipment ${pickerLink.shipmentId}`)

      return NextResponse.json(pickerLink)
    }

    // Otherwise, list all picker links with pagination
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let whereClause = {}

    // SHIPPER can only see their own picker links
    if (session.user.role === 'SHIPPER') {
      const userShipments = await prisma.shipment.findMany({
        where: { shipperId: session.user.id },
        select: { id: true }
      })
      whereClause = {
        shipmentId: {
          in: userShipments.map(s => s.id)
        }
      }
    }

    const [pickerLinks, total] = await Promise.all([
      prisma.pickerLink.findMany({
        where: whereClause,
        include: {
          shipment: {
            include: {
              shipper: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              items: true,
              boxes: true
            }
          },
          packer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.pickerLink.count({ where: whereClause })
    ])

    // Log audit action
    await logAuditInfo('LIST_PICKER_LINKS', {
      userId: session.user.id
    }, `Page ${page}, Limit ${limit}`)

    return NextResponse.json({
      data: pickerLinks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching picker links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/picker-links - Create new picker link for shipment or handle other actions
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { action } = body

    // Handle DELETE action via POST (workaround for Next.js routing)
    if (action === 'delete') {
      if (!session?.user || !['SHIPPER', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = body
      if (!id) {
        return NextResponse.json({ error: 'Picker link ID is required' }, { status: 400 })
      }

      // Find the picker link
      const pickerLink = await prisma.pickerLink.findUnique({
        where: { id },
        include: {
          shipment: true
        }
      })

      if (!pickerLink) {
        return NextResponse.json({ error: 'Picker link not found' }, { status: 404 })
      }

      // Check permissions
      if (session.user.role === 'SHIPPER' && pickerLink.shipment.shipperId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Deactivate the picker link
      const updatedPickerLink = await prisma.pickerLink.update({
        where: { id },
        data: { isActive: false },
        include: {
          shipment: {
            include: {
              shipper: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              items: true,
              boxes: true
            }
          },
          packer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Log audit action
      await logAuditInfo('DEACTIVATE_PICKER_LINK', {
        userId: session.user.id,
        shipmentId: pickerLink.shipmentId
      }, `Deactivated picker link ${id} for shipment ${pickerLink.shipmentId}`)

      return NextResponse.json(updatedPickerLink)
    }

    // Create new picker link (default action)
    if (!session?.user || !['SHIPPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shipmentId } = body

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 })
    }

    // Verify shipment exists and user has permission
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    if (session.user.role === 'SHIPPER' && shipment.shipperId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate secure UUID
    const uuid = randomUUID()

    // Create picker link
    const pickerLink = await prisma.pickerLink.create({
      data: {
        uuid,
        shipmentId
      },
      include: {
        shipment: {
          include: {
            shipper: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: true,
            boxes: true
          }
        }
      }
    })

    // Log audit action
    await logAuditInfo('CREATE_PICKER_LINK', {
      userId: session.user.id,
      shipmentId
    }, `Created picker link for shipment ${shipmentId} with UUID ${uuid}`)

    return NextResponse.json(pickerLink, { status: 201 })
  } catch (error) {
    console.error('Error processing picker link request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/picker-links - Delete picker link by query parameter
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['SHIPPER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Picker link ID is required' }, { status: 400 })
    }

    // Find the picker link
    const pickerLink = await prisma.pickerLink.findUnique({
      where: { id },
      include: {
        shipment: true
      }
    })

    if (!pickerLink) {
      return NextResponse.json({ error: 'Picker link not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'SHIPPER' && pickerLink.shipment.shipperId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Deactivate the picker link
    const updatedPickerLink = await prisma.pickerLink.update({
      where: { id },
      data: { isActive: false },
      include: {
        shipment: {
          include: {
            shipper: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: true,
            boxes: true
          }
        },
        packer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log audit action
    await logAuditInfo('DEACTIVATE_PICKER_LINK', {
      userId: session.user.id,
      shipmentId: pickerLink.shipmentId
    }, `Deactivated picker link ${id} for shipment ${pickerLink.shipmentId}`)

    return NextResponse.json(updatedPickerLink)
  } catch (error) {
    console.error('Error deactivating picker link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}