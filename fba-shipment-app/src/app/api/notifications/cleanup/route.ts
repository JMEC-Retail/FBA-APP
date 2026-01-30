import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationSystem } from '@/lib/notifications'

export async function cleanupOldNotifications() {
  console.log('Starting notification cleanup job...')
  
  try {
    await notificationSystem.cleanupOldNotifications(30) // Keep notifications for 30 days
    console.log('Notification cleanup completed successfully')
  } catch (error) {
    console.error('Notification cleanup failed:', error)
  }
}

// This can be called from a cron job or scheduled task
export async function GET() {
  await cleanupOldNotifications()
  return NextResponse.json({ message: 'Cleanup completed' })
}

// DELETE /api/notifications/cleanup - Delete old notifications
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    await notificationSystem.cleanupOldNotifications(30)
    return NextResponse.json({ message: 'Old notifications deleted successfully' })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}