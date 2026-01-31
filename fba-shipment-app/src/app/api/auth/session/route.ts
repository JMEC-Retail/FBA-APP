import { NextResponse } from 'next/server'
import { getServerSession } from '@/auth'

// API endpoint for hybrid session checking
// Allows client components to check server-side NextAuth sessions
export async function GET() {
  try {
    const serverSession = await getServerSession()
    return NextResponse.json({ session: serverSession })
  } catch (error) {
    console.error('Error fetching server session:', error)
    return NextResponse.json({ session: null }, { status: 401 })
  }
}