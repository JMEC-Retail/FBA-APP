import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reportGenerator } from '@/lib/reports'
import { logAuditInfo } from '@/lib/audit'
import { promises as fs } from 'fs'

// Role-based access control
const ALLOWED_ROLES = ['ADMIN', 'SHIPPER', 'PACKER'] as const

// Helper function to check user permissions
async function checkPermissions() {
  const session = await auth()
  
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as 'ADMIN' | 'SHIPPER' | 'PACKER')) {
    return { allowed: false, session: null }
  }
  
  return { allowed: true, session }
}

// Helper function to validate file access
async function validateFileAccess(filename: string) {
  try {
    // Sanitize filename to prevent path traversal
    const sanitized = filename.replace(/[^a-zA-Z0-9_.-]/g, '')
    if (sanitized !== filename || !filename.endsWith('.csv')) {
      return null
    }
    
    const filePath = await reportGenerator.getReportFilePath(sanitized)
    await fs.access(filePath) // Check if file exists
    
    return { sanitized, filePath }
  } catch {
    return null
  }
}

// GET /api/reports/[filename] - Download or view a specific report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { allowed, session } = await checkPermissions()
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized. Only ADMIN, SHIPPER, and PACKER roles can access reports.' },
        { status: 401 }
      )
    }

    const { filename } = await params
    const fileValidation = await validateFileAccess(filename)
    
    if (!fileValidation) {
      return NextResponse.json(
        { error: 'Report file not found or invalid filename' },
        { status: 404 }
      )
    }

    const { sanitized, filePath } = fileValidation
    
    // Get file stats
    const stats = await fs.stat(filePath)
    
    // Determine response type based on query parameter
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') === 'true'
    
    if (view) {
      // Return file content as JSON for viewing
      const content = await fs.readFile(filePath, 'utf8')
      const lines = content.split('\n').filter(line => line.trim())
      
      const headers = lines[0] ? lines[0].split(',') : []
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      
      await logAuditInfo(
        'User viewed report file',
        {
          userId: session!.user.id,
          userEmail: session!.user.email
        },
        `File: ${sanitized}, Records: ${data.length}`
      )
      
      return NextResponse.json({
        filename: sanitized,
        headers,
        data,
        metadata: {
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          recordCount: data.length
        }
      })
    } else {
      // Return file for download
      const fileBuffer = await fs.readFile(filePath)
      
      await logAuditInfo(
        'User downloaded report file',
        {
          userId: session!.user.id,
          userEmail: session!.user.email
        },
        `File: ${sanitized}, Size: ${stats.size} bytes`
      )
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${sanitized}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache'
        }
      })
    }
    
  } catch (error) {
    console.error('Error accessing report file:', error)
    return NextResponse.json(
      { error: 'Failed to access report file' },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/[filename] - Delete a specific report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { allowed, session } = await checkPermissions()
    if (!allowed || (session!.user.role === 'PACKER')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only ADMIN and SHIPPER roles can delete reports.' },
        { status: 401 }
      )
    }

    const { filename } = await params
    const fileValidation = await validateFileAccess(filename)
    
    if (!fileValidation) {
      return NextResponse.json(
        { error: 'Report file not found or invalid filename' },
        { status: 404 }
      )
    }

    const { sanitized } = fileValidation
    
    await reportGenerator.deleteReport(sanitized, {
      userId: session!.user.id,
      userEmail: session!.user.email
    })
    
    return NextResponse.json({
      success: true,
      message: `Report ${sanitized} deleted successfully`
    })
    
  } catch (error) {
    console.error('Error deleting report file:', error)
    return NextResponse.json(
      { error: 'Failed to delete report file' },
      { status: 500 }
    )
  }
}