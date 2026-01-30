import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditInfo } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (session.user.role === 'SHIPPER') {
      // Shippers can only see boxes from their shipments
      where.shipment = {
        shipperId: session.user.id
      }
    } else if (session.user.role === 'PACKER') {
      // Packers can only see boxes from active shipments
      where.shipment = {
        status: 'ACTIVE'
      }
    }

    if (status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shipment: { name: { contains: search } } }
      ]
    }

    // Build order clause
    const order: Record<string, 'asc' | 'desc'> = {}
    order[sortBy] = sortOrder as 'asc' | 'desc'

    const boxes = await prisma.box.findMany({
      where,
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
            item: {
              select: { id: true, sku: true, fnSku: true, quantity: true, pickedQty: true }
            }
          }
        },
        _count: {
          select: {
            boxItems: true
          }
        }
      },
      orderBy: order,
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.box.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Log action
    await logAuditInfo('VIEW_BOXES', {
      userId: session.user.id
    }, `Viewed boxes page ${page}`)

    return NextResponse.json({
      boxes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching boxes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}