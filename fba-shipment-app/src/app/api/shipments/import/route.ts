import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import csv from 'csv-parser'
import { Readable } from 'stream'
import { z } from 'zod'
import { logAuditInfo, logAuditError } from "../../../../lib/audit"

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth()
    
    // Enhanced session validation
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session found' },
        { status: 401 }
      )
    }

    // Check user role - PACKER users should use the PACKER-specific endpoint
    if (session.user.role === 'PACKER') {
      return NextResponse.json(
        { 
          error: 'PACKER users should use the PACKER-specific upload endpoint',
          suggestion: 'Please use /api/packer/shipments/import for PACKER users'
        },
        { status: 403 }
      )
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SHIPPER') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only ADMIN or SHIPPER roles allowed.' },
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

    // Create shipment and items in a transaction
    const result = await prisma.$transaction(async (tx) => {

      // Generate shipment name
      const shipmentName = `Import-${new Date().toISOString().split('T')[0]}-${Date.now()}`

      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          name: shipmentName,
          shipperId: session.user.id,
          status: 'ACTIVE'
        }
      })

      // Create items
      const items = await Promise.all(
        validatedItems.map(item =>
          tx.item.create({
            data: {
              shipmentId: shipment.id,
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
        await logAuditInfo('IMPORTED_SHIPMENT', {
          userId: session.user.id,
          shipmentId: shipment.id
        }, `Imported shipment ${shipment.name} with ${items.length} items from CSV file: ${file.name}`)
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError)
      }

      return { shipment, items }
    })

    return NextResponse.json({
      success: true,
      shipmentId: result.shipment.id,
      shipmentName: result.shipment.name,
      itemsCount: result.items.length,
      message: `Successfully imported ${result.items.length} items into shipment ${result.shipment.name}`
    })

  } catch (error) {
    console.error('CSV import error:', error)
    
    // Log error to audit if possible
    try {
      const session = await auth()
      if (session?.user?.id) {
        await logAuditError('SHIPMENT_IMPORT_ERROR', {
          userId: session.user.id
        }, `CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } catch (logError) {
      console.error('Failed to log audit error:', logError)
    }

    return NextResponse.json(
      { 
        error: 'Internal server error during CSV import',
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

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
