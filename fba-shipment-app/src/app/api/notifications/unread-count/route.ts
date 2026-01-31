import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { notificationSystem } from '@/lib/notifications'

// GET /api/notifications/unread-count - Get unread notification count
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await notificationSystem.getUnreadCount(session.user.id)
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await notificationSystem.markAllNotificationsAsRead(session.user.id)
    return NextResponse.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}