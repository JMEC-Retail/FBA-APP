import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { notificationSystem } from '@/lib/notifications'

// GET /api/notifications/settings - Get notification settings
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await notificationSystem.getNotificationSettings(session.user.id)
    
    // Transform settings into a more usable format for the frontend
    const transformedSettings = settings.reduce((acc, setting) => {
      acc[setting.type] = {
        enabled: setting.enabled,
        emailEnabled: setting.emailEnabled,
        realTimeEnabled: setting.realTimeEnabled,
        batchEnabled: setting.batchEnabled,
        batchWindowMinutes: setting.batchWindowMinutes
      }
      return acc
    }, {} as Record<string, unknown>)

    return NextResponse.json({ settings: transformedSettings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/settings - Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, settings } = body

    if (!type || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await notificationSystem.updateNotificationSettings(
      session.user.id,
      type as 'BOX_CONCLUDED' | 'SHIPMENT_COMPLETED' | 'SHIPMENT_CANCELLED' | 'PICKER_ASSIGNED' | 'SYSTEM_ANNOUNCEMENT',
      settings
    )

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}