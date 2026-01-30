import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reportGenerator, ReportFormat } from '@/lib/reports'
import { logAuditInfo } from '@/lib/audit'
import { promises as fs } from 'fs'
import { z } from 'zod'

// Role-based access control
const ALLOWED_ROLES = ['ADMIN', 'SHIPPER', 'PACKER'] as const

// Validation schemas
const generateReportSchema = z.object({
  type: z.enum(['box', 'shipment']),
  id: z.string().min(1),
  format: z.nativeEnum(ReportFormat).optional().default(ReportFormat.CUSTOM)
})

const searchReportsSchema = z.object({
  shipmentId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
})

// Helper function to check user permissions
async function checkPermissions() {
  const session = await auth()
  
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as 'ADMIN' | 'SHIPPER' | 'PACKER')) {
    return { allowed: false, session: null }
  }
  
  return { allowed: true, session }
}

// Helper function to parse report metadata from filename
function parseReportMetadata(filename: string) {
  const parts = filename.replace('.csv', '').split('_')
  
  if (parts.length < 4) return null
  
  const format = parts[parts.length - 1] as ReportFormat
  const timeStr = parts[parts.length - 2]
  const dateStr = parts[parts.length - 3]
  
  let shipmentId: string
  let boxId: string | undefined
  
  if (parts.includes('summary')) {
    const summaryIndex = parts.indexOf('summary')
    shipmentId = parts.slice(0, summaryIndex).join('_')
  } else {
    // Box report format: shipmentId_boxId_date_time_format
    shipmentId = parts.slice(0, -3).join('_')
    boxId = parts[parts.length - 4]
  }
  
  const timestampStr = `${dateStr}T${timeStr.replace(/-/g, ':')}`
  const generatedAt = new Date(timestampStr)
  
  return {
    shipmentId,
    boxId,
    format,
    generatedAt: generatedAt.toString() === 'Invalid Date' ? new Date() : generatedAt
  }
}

// Helper function to get file stats
async function getFileStats(filename: string) {
  try {
    const filePath = await reportGenerator.getReportFilePath(filename)
    const stats = await fs.stat(filePath)
    return {
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    }
  } catch {
    return null
  }
}

// Helper function to count records in CSV file
async function countCSVRecords(filename: string): Promise<number> {
  try {
    const filePath = await reportGenerator.getReportFilePath(filename)
    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    return Math.max(0, lines.length - 1) // Subtract header row
  } catch {
    return 0
  }
}

// GET /api/reports - List available reports with metadata
export async function GET(request: NextRequest) {
  try {
    const { allowed, session } = await checkPermissions()
    if (!allowed || (session!.user.role === 'PACKER')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only ADMIN and SHIPPER roles can generate reports.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Check if this is a search request
    if (searchParams.has('search') || 
        searchParams.has('shipmentId') || 
        searchParams.has('dateFrom') || 
        searchParams.has('dateTo') || 
        searchParams.has('format')) {
      
      // Handle search functionality
      const validated = searchReportsSchema.parse(Object.fromEntries(searchParams))
      
      await logAuditInfo(
        'User searched reports',
        {
          userId: session!.user.id,
          userEmail: session!.user.email
        },
        `Search params: ${JSON.stringify(validated)}`
      )
      
      const allFiles = await reportGenerator.listExistingReports(1000) // Get more files for filtering
      const reports = []
      
      for (const filename of allFiles) {
        const metadata = parseReportMetadata(filename)
        if (!metadata) continue
        
        // Apply filters
        if (validated.shipmentId && !metadata.shipmentId.includes(validated.shipmentId)) continue
        if (validated.format && metadata.format !== validated.format) continue
        if (validated.dateFrom && metadata.generatedAt < new Date(validated.dateFrom)) continue
        if (validated.dateTo && metadata.generatedAt > new Date(validated.dateTo)) continue
        
        const stats = await getFileStats(filename)
        if (!stats) continue
        
        const recordCount = await countCSVRecords(filename)
        
        reports.push({
          filename,
          shipmentId: metadata.shipmentId,
          boxId: metadata.boxId,
          format: metadata.format,
          generatedAt: metadata.generatedAt,
          fileSize: stats.fileSize,
          recordCount,
          createdAt: stats.createdAt
        })
      }
      
      // Sort by generatedAt descending
      reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      
      // Apply pagination
      const total = reports.length
      const startIndex = (validated.page - 1) * validated.limit
      const endIndex = startIndex + validated.limit
      const paginatedReports = reports.slice(startIndex, endIndex)
      
      return NextResponse.json({
        reports: paginatedReports,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages: Math.ceil(total / validated.limit),
          hasNext: endIndex < total,
          hasPrev: validated.page > 1
        }
      })
    }
    
    // Default: List recent reports with pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const allFiles = await reportGenerator.listExistingReports(1000)
    const reports = []
    
    for (const filename of allFiles) {
      const metadata = parseReportMetadata(filename)
      if (!metadata) continue
      
      const stats = await getFileStats(filename)
      if (!stats) continue
      
      const recordCount = await countCSVRecords(filename)
      
      reports.push({
        filename,
        shipmentId: metadata.shipmentId,
        boxId: metadata.boxId,
        format: metadata.format,
        generatedAt: metadata.generatedAt,
        fileSize: stats.fileSize,
        recordCount,
        createdAt: stats.createdAt
      })
    }
    
    // Sort by generatedAt descending
    reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    
    // Apply pagination
    const total = reports.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedReports = reports.slice(startIndex, endIndex)
    
    await logAuditInfo(
      'User accessed reports list',
      {
        userId: session!.user.id,
        userEmail: session!.user.email
      },
      `Page: ${page}, Limit: ${limit}, Total: ${total}`
    )
    
    return NextResponse.json({
      reports: paginatedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports/generate - Generate new report
export async function POST(request: NextRequest) {
  try {
    const { allowed, session } = await checkPermissions()
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized. Only ADMIN and SHIPPER roles can generate reports. PACKER role can only view reports.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Check if this is a generate request
    if (searchParams.get('action') === 'generate') {
      const body = await request.json()
      const validated = generateReportSchema.parse(body)
      
      let result
      
      if (validated.type === 'box') {
        result = await reportGenerator.generateBoxReport(
          validated.id,
          validated.format,
          {
            userId: session!.user.id,
            userEmail: session!.user.email
          }
        )
      } else if (validated.type === 'shipment') {
        result = await reportGenerator.generateShipmentSummaryReport(
          validated.id,
          validated.format,
          {
            userId: session!.user.id,
            userEmail: session!.user.email
          }
        )
      }
      
      return NextResponse.json({
        success: true,
        report: {
          fileName: result!.fileName,
          filePath: result!.filePath,
          recordCount: result!.recordCount,
          format: result!.format,
          metadata: result!.metadata
        }
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use ?action=generate' },
      { status: 400 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}