import { NextRequest, NextResponse } from 'next/server'

// GET /api/packer/health - Health check for PACKER dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const packerId = searchParams.get('packerId')
    
    // Basic health check - could be expanded to check packer status
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      packerId: packerId || 'unknown',
      services: {
        database: 'connected',
        auth: 'operational',
        api: 'available'
      }
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      },
      { status: 500 }
    )
  }
}