import { prisma } from './prisma'
import { promises as fs } from 'fs'
import path from 'path'

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface AuditLogEntry {
  userId?: string
  userEmail?: string
  shipmentId?: string
  action: string
  details?: string
  level: LogLevel
  timestamp: Date
}

export interface LogContext {
  userId?: string
  userEmail?: string
  shipmentId?: string
}

class AuditLogger {
  private logsDir: string
  private logFileName: string

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs')
    this.logFileName = this.getLogFileName()
  }

  private getLogFileName(): string {
    const today = new Date().toISOString().split('T')[0]
    return `audit-${today}.log`
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logsDir)
    } catch {
      await fs.mkdir(this.logsDir, { recursive: true })
    }
  }

  private formatLogEntry(entry: AuditLogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const user = entry.userEmail || entry.userId || 'System'
    const shipment = entry.shipmentId ? ` [Shipment: ${entry.shipmentId}]` : ''
    
    return `[${timestamp}] [${entry.level}] User: ${user}${shipment} Action: ${entry.action}${entry.details ? ` | ${entry.details}` : ''}`
  }

  private formatJsonEntry(entry: AuditLogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      userId: entry.userId,
      userEmail: entry.userEmail,
      shipmentId: entry.shipmentId,
      action: entry.action,
      details: entry.details
    })
  }

  private async writeToLogFile(entry: AuditLogEntry): Promise<void> {
    try {
      await this.ensureLogDirectory()
      
      const logFilePath = path.join(this.logsDir, this.logFileName)
      const readableLine = this.formatLogEntry(entry)
      const jsonLine = this.formatJsonEntry(entry)
      
      const logContent = `${readableLine}\n${jsonLine}\n---\n`
      
      await fs.appendFile(logFilePath, logContent, 'utf8')
    } catch (error) {
      console.error('Failed to write to audit log file:', error)
    }
  }

  private async writeToDatabase(entry: AuditLogEntry): Promise<void> {
    try {
      if (entry.userId) {
        const data: any = {
          userId: entry.userId,
          action: entry.action,
          details: entry.details || null,
          timestamp: entry.timestamp
        }

        if (entry.shipmentId) {
          data.shipment = { connect: { id: entry.shipmentId } }
        }

        await prisma.auditLog.create({
          data
        })
      }
    } catch (error) {
      console.error('Failed to write audit log to database:', error)
    }
  }

  async log(
    action: string,
    context: LogContext = {},
    details?: string,
    level: LogLevel = LogLevel.INFO
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId: context.userId,
      userEmail: context.userEmail,
      shipmentId: context.shipmentId,
      action,
      details,
      level,
      timestamp: new Date()
    }

    await Promise.allSettled([
      this.writeToDatabase(entry),
      this.writeToLogFile(entry)
    ])
  }

  async logInfo(action: string, context?: LogContext, details?: string): Promise<void> {
    await this.log(action, context, details, LogLevel.INFO)
  }

  async logWarning(action: string, context?: LogContext, details?: string): Promise<void> {
    await this.log(action, context, details, LogLevel.WARNING)
  }

  async logError(action: string, context?: LogContext, details?: string): Promise<void> {
    await this.log(action, context, details, LogLevel.ERROR)
  }
}

const auditLogger = new AuditLogger()

export const logAudit = auditLogger.log.bind(auditLogger)
export const logAuditInfo = auditLogger.logInfo.bind(auditLogger)
export const logAuditWarning = auditLogger.logWarning.bind(auditLogger)
export const logAuditError = auditLogger.logError.bind(auditLogger)

export default auditLogger