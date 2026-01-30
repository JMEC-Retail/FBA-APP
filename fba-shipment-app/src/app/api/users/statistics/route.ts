import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserStatistics } from '@/lib/users'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statistics = await getUserStatistics()
    
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}