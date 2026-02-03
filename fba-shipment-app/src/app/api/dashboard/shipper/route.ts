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

    if (session.user.role !== 'SHIPPER') {
      return NextResponse.json(
        { error: 'Forbidden: Shipper access required' },
        { status: 403 }
      )
    }

    const [
      shipments,
      totalBoxes,
      openBoxes,
      pickerLinks
    ] = await Promise.all([
      prisma.shipment.findMany({
        where: { shipperId: session.user.id },
        include: {
          boxes: true,
          items: true,
          _count: {
            select: {
              items: true,
              boxes: true,
              pickerLinks: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.box.count({
        where: {
          shipment: { shipperId: session.user.id }
        }
      }),
      prisma.box.count({
        where: {
          shipment: { shipperId: session.user.id },
          status: "OPEN"
        }
      }),
      prisma.pickerLink.count({
        where: {
          shipment: { shipperId: session.user.id },
          isActive: true
        }
      })
    ])

    return NextResponse.json({
      shipments,
      totalBoxes,
      openBoxes,
      pickerLinks
    })

  } catch (error) {
    console.error('Error fetching shipper dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}