import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from "@/auth"
import { notifyPickerAssigned } from '@/lib/notifications'
// import { logAuditInfo } from "@/lib/audit"

interface Params {
  params: Promise<{ uuid: string }>
}

// GET /api/picker-links/[uuid] - Access shipment via UUID (no auth required)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { uuid } = await params

    if (!uuid) {
      return NextResponse.json({ error: 'UUID is required' }, { status: 400 })
    }

    // Find the picker link by UUID (no authentication required)
    const pickerLink = await prisma.pickerLink.findUnique({
      where: { 
        uuid,
        isActive: true // Only active links
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
            items: {
              include: {
                boxItems: {
                  include: {
                    box: {
                      select: {
                        id: true,
                        name: true,
                        status: true
                      }
                    }
                  }
                }
              }
            },
            boxes: {
              include: {
                boxItems: {
                  include: {
                    item: {
                      select: {
                        id: true,
                        sku: true,
                        fnSku: true,
                        quantity: true,
                        pickedQty: true,
                        identifier: true
                      }
                    }
                  }
                }
              }
            }
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
      return NextResponse.json({ error: 'Invalid or inactive picker link' }, { status: 404 })
    }

    // Check if shipment is active
    if (pickerLink.shipment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Shipment is not active' }, { status: 410 })
    }

    // Try to get session for logging purposes (but don't require it)
    let userId = null
    try {
      const session = await auth()
      if (session?.user) {
        userId = session.user.id
      }
    } catch (error) {
      // Ignore auth errors for this endpoint
    }

    // Log access attempt (with or without user)
    // TODO: Re-enable audit logging after migration
    // logAuditInfo('ACCESSED_PICKER_LINK', {
    //   userId: userId || 'anonymous',
    //   shipmentId: pickerLink.shipmentId
    // }, `Accessed picker link with UUID ${uuid} for shipment ${pickerLink.shipmentId}`)

    // Format response for picker interface
    const response = {
      pickerLink: {
        id: pickerLink.id,
        uuid: pickerLink.uuid,
        isActive: pickerLink.isActive,
        createdAt: pickerLink.createdAt
      },
      shipment: {
        id: pickerLink.shipment.id,
        name: pickerLink.shipment.name,
        status: pickerLink.shipment.status,
        shipper: pickerLink.shipment.shipper,
        createdAt: pickerLink.shipment.createdAt,
        items: pickerLink.shipment.items.map(item => ({
          id: item.id,
          sku: item.sku,
          fnSku: item.fnSku,
          quantity: item.quantity,
          pickedQty: item.pickedQty,
          identifier: item.identifier,
          remainingQty: item.quantity - item.pickedQty
        })),
        boxes: pickerLink.shipment.boxes.map(box => ({
          id: box.id,
          name: box.name,
          status: box.status,
          concludedAt: box.concludedAt,
          createdAt: box.createdAt,
          items: box.boxItems.map(boxItem => boxItem.item)
        }))
      },
      packer: pickerLink.packer
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error accessing picker link by UUID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/picker-links/[uuid] - Update picker link (assign packer, etc.)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { uuid } = await params
    const session = await auth()

    if (!uuid) {
      return NextResponse.json({ error: 'UUID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    // Find the picker link
    const pickerLink = await prisma.pickerLink.findUnique({
      where: { 
        uuid,
        isActive: true
      },
      include: {
        shipment: true
      }
    })

    if (!pickerLink) {
      return NextResponse.json({ error: 'Invalid or inactive picker link' }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case 'assign_packer':
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Authentication required for this action' }, { status: 401 })
        }

        // Assign current user as packer
        const updatedPickerLink = await prisma.pickerLink.update({
          where: { id: pickerLink.id },
          data: { 
            packerId: session.user.id 
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
                }
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
        // TODO: Re-enable audit logging after migration
        // logAuditInfo('ASSIGNED_PACKER_TO_PICKER_LINK', {
        //   userId: session.user.id,
        //   shipmentId: pickerLink.shipmentId
        // }, `Assigned user ${session.user.id} as packer to picker link ${pickerLink.id}`)

        // Send notification to packer
        await notifyPickerAssigned(pickerLink.uuid, session.user.id)

        return NextResponse.json(updatedPickerLink)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating picker link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}