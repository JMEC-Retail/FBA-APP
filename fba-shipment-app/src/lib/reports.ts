import { prisma } from './prisma'
import { logAuditInfo } from './audit'
import { promises as fs } from 'fs'
import path from 'path'

export enum ReportFormat {
  FBA = 'fba',
  INVENTORY = 'inventory',
  CUSTOM = 'custom'
}

export interface ReportItem {
  sku: string
  quantity: number
  fnSku?: string
  seller?: string
  description?: string
}

export interface ReportData {
  shipmentId: string
  shipmentName: string
  boxId?: string
  boxName?: string
  items: ReportItem[]
  format: ReportFormat
  generatedAt: Date
}

export interface ReportResult {
  filePath: string
  fileName: string
  recordCount: number
  format: ReportFormat
  metadata: {
    shipmentId: string
    boxId?: string
    generatedAt: Date
    fileSize: number
  }
}

export interface ReportSummary {
  shipmentId: string
  shipmentName: string
  totalItems: number
  totalQuantity: number
  boxesCount: number
  concludedBoxesCount: number
  generatedAt: Date
}

class CSVReportGenerator {
  private reportsDir: string

  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports')
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.access(this.reportsDir)
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true })
    }
  }

  private escapeCSVField(field: string | number | undefined): string {
    if (field === undefined || field === null) {
      return ''
    }
    
    const fieldStr = String(field)
    
    // If field contains comma, newline, quotes, or starts/ends with whitespace
    if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('\r') || 
        fieldStr.includes('"') || fieldStr.trim() !== fieldStr) {
      // Escape quotes by doubling them and wrap in quotes
      return `"${fieldStr.replace(/"/g, '""')}"`
    }
    
    return fieldStr
  }

  private generateFBAHeaders(): string[] {
    return ['SKU', 'Quantity', 'FN SKU', 'Seller SKU']
  }

  private generateInventoryHeaders(): string[] {
    return ['SKU', 'FN SKU', 'Quantity', 'Description', 'Seller']
  }

  private generateCustomHeaders(): string[] {
    return ['SKU', 'QTY', 'seller', 'seller']
  }

  private generateHeaders(format: ReportFormat): string[] {
    switch (format) {
      case ReportFormat.FBA:
        return this.generateFBAHeaders()
      case ReportFormat.INVENTORY:
        return this.generateInventoryHeaders()
      case ReportFormat.CUSTOM:
        return this.generateCustomHeaders()
      default:
        return this.generateCustomHeaders()
    }
  }

  private formatItemForCSV(item: ReportItem, format: ReportFormat): string[] {
    switch (format) {
      case ReportFormat.FBA:
        return [
          this.escapeCSVField(item.sku),
          this.escapeCSVField(item.quantity),
          this.escapeCSVField(item.fnSku),
          this.escapeCSVField(item.seller)
        ]
      case ReportFormat.INVENTORY:
        return [
          this.escapeCSVField(item.sku),
          this.escapeCSVField(item.fnSku),
          this.escapeCSVField(item.quantity),
          this.escapeCSVField(item.description),
          this.escapeCSVField(item.seller)
        ]
      case ReportFormat.CUSTOM:
        return [
          this.escapeCSVField(item.sku),
          this.escapeCSVField(item.quantity),
          this.escapeCSVField(item.seller),
          this.escapeCSVField(item.seller)
        ]
      default:
        return this.formatItemForCSV(item, ReportFormat.CUSTOM)
    }
  }

  private generateFileName(data: ReportData): string {
    const timestamp = data.generatedAt.toISOString().replace(/[:.]/g, '-').split('T')[0]
    const timeStr = data.generatedAt.toTimeString().split(' ')[0].replace(/:/g, '-')
    
    const baseName = data.boxId 
      ? `${data.shipmentId}_${data.boxId}_${timestamp}_${timeStr}`
      : `${data.shipmentId}_summary_${timestamp}_${timeStr}`
    
    return `${baseName}_${data.format}.csv`
  }

  private async writeCSVReport(data: ReportData): Promise<{ filePath: string; fileName: string; recordCount: number }> {
    await this.ensureReportsDirectory()
    
    const fileName = this.generateFileName(data)
    const filePath = path.join(this.reportsDir, fileName)
    
    const headers = this.generateHeaders(data.format)
    const csvLines = [headers.join(',')]
    
    if (data.items.length === 0) {
      // Add a header-only file for empty reports
      csvLines.push('# No items found for this report')
    } else {
      for (const item of data.items) {
        const formattedItem = this.formatItemForCSV(item, data.format)
        csvLines.push(formattedItem.join(','))
      }
    }
    
    const csvContent = csvLines.join('\n')
    await fs.writeFile(filePath, csvContent, 'utf8')
    
    const stats = await fs.stat(filePath)
    console.log(`Report file created: ${fileName} (${stats.size} bytes)`)
    
    return {
      filePath,
      fileName,
      recordCount: Math.max(0, data.items.length)
    }
  }

  async generateBoxReport(
    boxId: string,
    format: ReportFormat = ReportFormat.CUSTOM,
    context?: { userId?: string; userEmail?: string }
  ): Promise<ReportResult> {
    try {
      // Fetch box with items
      const box = await prisma.box.findUnique({
        where: { id: boxId },
        include: {
          shipment: true,
          boxItems: {
            include: {
              item: true
            }
          }
        }
      })

      if (!box) {
        throw new Error(`Box with ID ${boxId} not found`)
      }

      if (box.status !== 'CONCLUDED') {
        throw new Error(`Box ${box.name} is not concluded. Current status: ${box.status}`)
      }

      const reportData: ReportData = {
        shipmentId: box.shipmentId,
        shipmentName: box.shipment.name,
        boxId: box.id,
        boxName: box.name,
        items: box.boxItems.map(bi => ({
          sku: bi.item.sku,
          fnSku: bi.item.fnSku,
          quantity: bi.quantity,
          seller: bi.item.identifier || 'Unknown'
        })),
        format,
        generatedAt: new Date()
      }

      const { filePath, fileName, recordCount } = await this.writeCSVReport(reportData)
      
      const stats = await fs.stat(filePath)
      
      const result: ReportResult = {
        filePath,
        fileName,
        recordCount,
        format,
        metadata: {
          shipmentId: reportData.shipmentId,
          boxId: reportData.boxId,
          generatedAt: reportData.generatedAt,
          fileSize: stats.size
        }
      }

      // Log to audit system
      await logAuditInfo(
        'CSV report generated for box',
        {
          userId: context?.userId,
          userEmail: context?.userEmail,
          shipmentId: box.shipmentId
        },
        `Box: ${box.name}, Format: ${format}, Records: ${recordCount}, File: ${fileName}`
      )

      return result

    } catch (error) {
      await logAuditInfo(
        'CSV report generation failed for box',
        {
          userId: context?.userId,
          userEmail: context?.userEmail,
          shipmentId: undefined
        },
        `Box ID: ${boxId}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  async generateShipmentSummaryReport(
    shipmentId: string,
    format: ReportFormat = ReportFormat.CUSTOM,
    context?: { userId?: string; userEmail?: string }
  ): Promise<ReportResult> {
    try {
      // Fetch shipment with all concluded boxes and their items
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          boxes: {
            where: { status: 'CONCLUDED' },
            include: {
              boxItems: {
                include: {
                  item: true
                }
              }
            }
          }
        }
      })

      if (!shipment) {
        throw new Error(`Shipment with ID ${shipmentId} not found`)
      }

      // Aggregate items across all concluded boxes
      const itemMap = new Map<string, ReportItem>()

      for (const box of shipment.boxes) {
        for (const boxItem of box.boxItems) {
          const key = boxItem.item.sku
          const existing = itemMap.get(key)
          
          if (existing) {
            existing.quantity += boxItem.quantity
          } else {
            itemMap.set(key, {
              sku: boxItem.item.sku,
              fnSku: boxItem.item.fnSku,
              quantity: boxItem.quantity,
              seller: boxItem.item.identifier || 'Unknown'
            })
          }
        }
      }

      const reportData: ReportData = {
        shipmentId: shipment.id,
        shipmentName: shipment.name,
        items: Array.from(itemMap.values()),
        format,
        generatedAt: new Date()
      }

      const { filePath, fileName, recordCount } = await this.writeCSVReport(reportData)
      
      const stats = await fs.stat(filePath)
      
      const result: ReportResult = {
        filePath,
        fileName,
        recordCount,
        format,
        metadata: {
          shipmentId: reportData.shipmentId,
          generatedAt: reportData.generatedAt,
          fileSize: stats.size
        }
      }

      // Log to audit system
      await logAuditInfo(
        'CSV summary report generated for shipment',
        {
          userId: context?.userId,
          userEmail: context?.userEmail,
          shipmentId
        },
        `Shipment: ${shipment.name}, Boxes: ${shipment.boxes.length}, Records: ${recordCount}, File: ${fileName}`
      )

      return result

    } catch (error) {
      await logAuditInfo(
        'CSV summary report generation failed for shipment',
        {
          userId: context?.userId,
          userEmail: context?.userEmail,
          shipmentId
        },
        `Shipment ID: ${shipmentId}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  async getShipmentSummary(shipmentId: string): Promise<ReportSummary> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          boxes: {
            include: {
              boxItems: {
                include: {
                  item: true
                }
              }
            }
          },
          items: true
        }
      })

      if (!shipment) {
        throw new Error(`Shipment with ID ${shipmentId} not found`)
      }

      const concludedBoxes = shipment.boxes.filter(box => box.status === 'CONCLUDED')
      
      // Aggregate quantities from concluded boxes
      let totalQuantity = 0
      const uniqueItems = new Set<string>()
      
      for (const box of concludedBoxes) {
        for (const boxItem of box.boxItems) {
          totalQuantity += boxItem.quantity
          uniqueItems.add(boxItem.item.sku)
        }
      }

      return {
        shipmentId: shipment.id,
        shipmentName: shipment.name,
        totalItems: uniqueItems.size,
        totalQuantity,
        boxesCount: shipment.boxes.length,
        concludedBoxesCount: concludedBoxes.length,
        generatedAt: new Date()
      }

    } catch (error) {
      throw new Error(`Failed to generate shipment summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listExistingReports(limit: number = 50): Promise<string[]> {
    try {
      await this.ensureReportsDirectory()
      const files = await fs.readdir(this.reportsDir)
      return files
        .filter(file => file.endsWith('.csv'))
        .sort((a, b) => {
          // Sort by filename (which includes timestamp)
          return b.localeCompare(a)
        })
        .slice(0, limit)
    } catch (error) {
      throw new Error(`Failed to list reports: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getReportFilePath(fileName: string): Promise<string> {
    return path.join(this.reportsDir, fileName)
  }

  async deleteReport(fileName: string, context?: { userId?: string; userEmail?: string }): Promise<void> {
    try {
      await this.ensureReportsDirectory()
      const filePath = path.join(this.reportsDir, fileName)
      await fs.unlink(filePath)
      
      await logAuditInfo(
        'CSV report deleted',
        {
          userId: context?.userId,
          userEmail: context?.userEmail
        },
        `Deleted file: ${fileName}`
      )
    } catch (error) {
      await logAuditInfo(
        'CSV report deletion failed',
        {
          userId: context?.userId,
          userEmail: context?.userEmail
        },
        `File: ${fileName}, Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }
}

export const reportGenerator = new CSVReportGenerator()

// Convenience functions
export const generateBoxReport = reportGenerator.generateBoxReport.bind(reportGenerator)
export const generateShipmentSummaryReport = reportGenerator.generateShipmentSummaryReport.bind(reportGenerator)
export const getShipmentSummary = reportGenerator.getShipmentSummary.bind(reportGenerator)
export const listExistingReports = reportGenerator.listExistingReports.bind(reportGenerator)
export const getReportFilePath = reportGenerator.getReportFilePath.bind(reportGenerator)
export const deleteReport = reportGenerator.deleteReport.bind(reportGenerator)

export default reportGenerator