import { NextResponse } from 'next/server'
import { getServerSession } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session found' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PACKER') {
      return NextResponse.json(
        { error: 'Forbidden: Packer access required' },
        { status: 403 }
      )
    }

    const [
      assignedShipments,
      totalBoxesPacked,
      recentBoxes
    ] = await Promise.all([
      prisma.pickerLink.findMany({
        where: { packerId: session.user.id, isActive: true },
        include: {
          shipment: {
            include: {
              boxes: {
                where: { status: "OPEN" },
                include: {
                  boxItems: {
                    include: {
                      item: true
                    }
                  }
                }
              },
              items: true
            }
          }
        }
      }),
      prisma.box.count({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId: session.user.id }
            }
          }
        }
      }),
      prisma.box.findMany({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId: session.user.id }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          shipment: {
            select: { name: true }
          }
        }
      })
    ])

    return NextResponse.json({
      assignedShipments,
      totalBoxesPacked,
      recentBoxes
    })

  } catch (error) {
    console.error('Error fetching packer dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}