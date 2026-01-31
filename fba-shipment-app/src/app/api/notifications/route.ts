import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { notificationSystem } from '@/lib/notifications'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const dateFilter = searchParams.get('dateFilter')

    // For now, we'll use the existing getUserNotifications method
    // In a production environment, you'd want to enhance this with proper filtering
    const notifications = await notificationSystem.getUserNotifications(
      session.user.id,
      unreadOnly,
      limit
    )

    // Apply client-side filtering (this should be moved to the database layer in production)
    let filteredNotifications = notifications
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) || 
        n.message.toLowerCase().includes(searchLower)
      )
    }
    
    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.type === type)
    }
    
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      filteredNotifications = filteredNotifications.filter(n => {
        const notificationDate = new Date(n.createdAt)
        const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case 'today':
            return diffDays === 0
          case 'week':
            return diffDays <= 7
          case 'month':
            return diffDays <= 30
          default:
            return true
        }
      })
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

    return NextResponse.json({ 
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      page,
      totalPages: Math.ceil(filteredNotifications.length / limit)
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userIds, type, title, message, method, metadata, isBatch } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (isBatch && userIds && Array.isArray(userIds)) {
      await notificationSystem.createBatchNotifications({
        userIds,
        type,
        title,
        message,
        method,
        metadata
      })
    } else if (body.userId) {
      await notificationSystem.createNotification({
        userId: body.userId,
        type,
        title,
        message,
        method,
        metadata
      })
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Notification created successfully' })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}