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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const [
      totalUsers,
      totalShipments,
      totalBoxes,
      activeShipments,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.shipment.count(),
      prisma.box.count(),
      prisma.shipment.count({ where: { status: "ACTIVE" } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalShipments,
      totalBoxes,
      activeShipments,
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}