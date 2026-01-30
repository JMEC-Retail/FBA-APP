import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationSystem } from '@/lib/notifications'

interface Params {
  params: Promise<{ notificationId: string }>
}

// PATCH /api/notifications/[notificationId] - Mark notification as read
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await params
    const body = await request.json()
    const { markAsRead } = body

    if (markAsRead) {
      await notificationSystem.markNotificationAsRead(notificationId)
      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifications/[notificationId] - Delete notification
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Note: Currently the notification system doesn't have a delete method
    // This could be implemented if needed
    
    return NextResponse.json({ message: 'Notification deletion not implemented' }, { status: 501 })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}