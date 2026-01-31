import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import csv from 'csv-parser'
import { Readable } from 'stream'
import { z } from 'zod'
import { logAuditInfo, logAuditError } from "../../../../../lib/audit"

// Schema for validating CSV row data
const CsvRowSchema = z.object({
  QTY: z.string().transform(val => {
    const num = parseInt(val.trim())
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid quantity')
    }
    return num
  }),
  SKU: z.string().min(1, 'SKU is required'),
  FNSKU: z.string().min(1, 'FNSKU is required'),
  ID: z.string().min(0, 'ID is required')
})

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// PACKER authentication helper function
const getPackerSession = async (request: NextRequest): Promise<{ user: { id: string, name: string, role: string, stationId: string } } | null> => {
  try {
    // For PACKER users, we need to authenticate differently since they use sessionStorage
    // We'll use custom headers for PACKER authentication
    const packerId = request.headers.get('x-packer-id')
    const stationId = request.headers.get('x-station-id')
    
    if (!packerId || !stationId) {
      return null
    }

    // Validate packer session - in production, this would validate against a database
    // For now, we'll check if it matches expected format
    if (!packerId.startsWith('packer-') || !stationId.startsWith('PACKER')) {
      return null
    }

    return {
      user: {
        id: packerId,
        name: `Packer ${stationId}`,
        role: 'PACKER',
        stationId: stationId
      }
    }
  } catch (error) {
    console.error("Error validating PACKER session:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check PACKER authentication
    const session = await getPackerSession(request)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'PACKER authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PACKER') {
      return NextResponse.json(
        { error: 'Only PACKER users allowed for this endpoint' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Parse CSV data
    const csvData: any[] = []
    const errors: string[] = []

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(fileBuffer.toString('utf-8'))
        .pipe(csv())
        .on('data', (row) => {
          csvData.push(row)
        })
        .on('end', () => {
          resolve()
        })
        .on('error', (error) => {
          reject(error)
        })
    })

    // Validate CSV has data
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }

    // Validate required columns exist
    const firstRow = csvData[0]
    const requiredColumns = ['QTY', 'SKU', 'FNSKU', 'ID']
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          requiredColumns 
        },
        { status: 400 }
      )
    }

    // Validate and transform each row
    const validatedItems: Array<{
      quantity: number
      sku: string
      fnSku: string
      identifier: string
    }> = []

    csvData.forEach((row, index) => {
      try {
        const validated = CsvRowSchema.parse(row)
        validatedItems.push({
          quantity: validated.QTY,
          sku: validated.SKU.trim(),
          fnSku: validated.FNSKU.trim(),
          identifier: validated.ID.trim()
        })
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errors.slice(0, 10) // Limit to first 10 errors
        },
        { status: 400 }
      )
    }

    // For PACKER users, we need to find an active assignment or create a special shipment
    // PACKER users typically don't create shipments, they work on assigned ones
    // This endpoint allows PACKER users to import data into their active assignment
    
    // Find active picker link for this PACKER
    const activePickerLink = await prisma.pickerLink.findFirst({
      where: {
        packerId: session.user.id,
        isActive: true
      },
      include: {
        shipment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!activePickerLink) {
      return NextResponse.json(
        { 
          error: 'No active assignment found. Please contact your supervisor to get assigned to a shipment before importing data.' 
        },
        { status: 403 }
      )
    }

    // Create items in the assigned shipment
    const result = await prisma.$transaction(async (tx) => {
      // Create items in the existing shipment
      const items = await Promise.all(
        validatedItems.map(item =>
          tx.item.create({
            data: {
              shipmentId: activePickerLink.shipmentId,
              sku: item.sku,
              fnSku: item.fnSku,
              quantity: item.quantity,
              pickedQty: 0,
              identifier: item.identifier
            }
          })
        )
      )

      // Log audit action
      try {
        await logAuditInfo('PACKER_IMPORTED_SHIPMENT_DATA', {
          userId: session.user.id,
          shipmentId: activePickerLink.shipmentId
        }, `PACKER ${session.user.name} imported ${items.length} items into shipment ${activePickerLink.shipment.name} from CSV file: ${file.name}`)
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError)
      }

      return { shipment: activePickerLink.shipment, items }
    })

    return NextResponse.json({
      success: true,
      shipmentId: result.shipment.id,
      shipmentName: result.shipment.name,
      itemsCount: result.items.length,
      message: `Successfully imported ${result.items.length} items into assigned shipment ${result.shipment.name}`
    })

  } catch (error) {
    console.error('PACKER CSV import error:', error)
    
    // Log error to audit if possible
    try {
      const session = await getPackerSession(request)
      if (session?.user) {
        await logAuditError('PACKER_SHIPMENT_IMPORT_ERROR', {
          userId: session.user.id
        }, `PACKER CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } catch (logError) {
      console.error('Failed to log audit error:', logError)
    }

    return NextResponse.json(
      { 
        error: 'Internal server error during PACKER CSV import',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
