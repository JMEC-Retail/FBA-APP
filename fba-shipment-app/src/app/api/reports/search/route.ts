import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { reportGenerator, ReportFormat } from '@/lib/reports'
// import { logAuditInfo } from "@/lib/audit"
import { promises as fs } from 'fs'
import { z } from 'zod'

// Role-based access control
const ALLOWED_ROLES = ['ADMIN', 'SHIPPER', 'PACKER'] as const

// Validation schema for search parameters
const searchSchema = z.object({
  query: z.string().optional(),
  shipmentId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  format: z.nativeEnum(ReportFormat).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['generatedAt', 'fileName', 'fileSize', 'recordCount']).optional().default('generatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
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

// GET /api/reports/search - Search reports by various criteria
export async function GET(request: NextRequest) {
  try {
    const { allowed, session } = await checkPermissions()
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized. Only ADMIN, SHIPPER, and PACKER roles can search reports.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams)
    const validated = searchSchema.parse(params)
    
    // TODO: Re-enable audit logging after migration
    // logAuditInfo('REPORT_SEARCH', {
    //   'User performed advanced search on reports',
    //   {
    //     userId: session!.user.id,
    //     userEmail: session!.user.email
    //   },
    //   `Search criteria: ${JSON.stringify(validated)}`
    // })
    
    // Get all files for searching
    const allFiles = await reportGenerator.listExistingReports(1000)
    const reports = []
    
    for (const filename of allFiles) {
      const metadata = parseReportMetadata(filename)
      if (!metadata) continue
      
      // Apply text-based search filters
      if (validated.query) {
        const query = validated.query.toLowerCase()
        const searchFields = [
          filename.toLowerCase(),
          metadata.shipmentId.toLowerCase(),
          metadata.boxId?.toLowerCase() || '',
          metadata.format.toLowerCase()
        ].join(' ')
        
        if (!searchFields.includes(query)) continue
      }
      
      // Apply specific filters
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
    
    // Sort results
    reports.sort((a, b) => {
      let aValue: unknown = a[validated.sortBy as keyof typeof a]
      let bValue: unknown = b[validated.sortBy as keyof typeof b]
      
      // Handle date sorting
      if (validated.sortBy === 'generatedAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }
      
      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return validated.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      // Handle string comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (validated.sortOrder === 'asc') {
        return aStr > bStr ? 1 : -1
      } else {
        return aStr < bStr ? 1 : -1
      }
    })
    
    // Apply pagination
    const total = reports.length
    const startIndex = (validated.page - 1) * validated.limit
    const endIndex = startIndex + validated.limit
    const paginatedReports = reports.slice(startIndex, endIndex)
    
    // Generate search summary
    const summary = {
      totalFiles: allFiles.length,
      filteredFiles: total,
      criteria: {
        query: validated.query,
        shipmentId: validated.shipmentId,
        dateFrom: validated.dateFrom,
        dateTo: validated.dateTo,
        format: validated.format
      }
    }
    
    return NextResponse.json({
      reports: paginatedReports,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit),
        hasNext: endIndex < total,
        hasPrev: validated.page > 1
      },
      search: {
        ...summary,
        sortBy: validated.sortBy,
        sortOrder: validated.sortOrder
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error searching reports:', error)
    return NextResponse.json(
      { error: 'Failed to search reports' },
      { status: 500 }
    )
  }
}