import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/packer/stats - Get PACKER performance statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const packerId = searchParams.get('packerId')
    
    if (!packerId) {
      return NextResponse.json({ error: 'PACKER ID is required' }, { status: 400 })
    }

    // Get current date ranges
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Calculate various metrics
    const [
      totalBoxesPacked,
      todayBoxesPacked,
      weekBoxesPacked,
      monthBoxesPacked,
      activeAssignments,
      recentBoxes,
      averagePackingTime
    ] = await Promise.all([
      // Total boxes packed by this packer
      prisma.box.count({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          },
          status: 'CONCLUDED'
        }
      }),

      // Today's boxes packed
      prisma.box.count({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          },
          status: 'CONCLUDED',
          createdAt: {
            gte: todayStart
          }
        }
      }),

      // Week's boxes packed
      prisma.box.count({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          },
          status: 'CONCLUDED',
          createdAt: {
            gte: weekStart
          }
        }
      }),

      // Month's boxes packed
      prisma.box.count({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          },
          status: 'CONCLUDED',
          createdAt: {
            gte: monthStart
          }
        }
      }),

      // Active assignments
      prisma.pickerLink.count({
        where: {
          packerId,
          isActive: true
        }
      }),

      // Recent boxes for activity tracking
      prisma.box.findMany({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          }
        },
        include: {
          shipment: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Average packing time (mock calculation - would need real time tracking)
      prisma.box.findMany({
        where: {
          shipment: {
            pickerLinks: {
              some: { packerId }
            }
          },
          status: 'CONCLUDED',
          createdAt: {
            gte: weekStart
          }
        },
        select: {
          createdAt: true,
          concludedAt: true
        }
      })
    ])

    // Calculate average packing time in minutes
    const avgTimeMs = averagePackingTime.reduce((acc, box) => {
      const timeSpent = (box.concludedAt?.getTime() || new Date().getTime()) - box.createdAt.getTime()
      return acc + timeSpent
    }, 0) / (averagePackingTime.length || 1)
    const avgTimeMinutes = Math.round(avgTimeMs / (1000 * 60))

    const stats = {
      totalBoxesPacked,
      todayBoxesPacked,
      weekBoxesPacked,
      monthBoxesPacked,
      activeAssignments,
      averagePackingTimeMinutes: avgTimeMinutes > 0 ? avgTimeMinutes : 45, // fallback to 45 if no data
      recentActivity: recentBoxes.map(box => ({
        id: box.id,
        name: box.name,
        status: box.status,
        shipmentName: box.shipment.name,
        createdAt: box.createdAt
      })),
      performanceTrend: {
        today: todayBoxesPacked,
        weekAverage: Math.round(weekBoxesPacked / 7),
        monthlyAverage: Math.round(monthBoxesPacked / 30)
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching PACKER stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PACKER statistics' },
      { status: 500 }
    )
  }
}