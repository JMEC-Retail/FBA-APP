import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { auth } from "@/lib/auth"

// Security: Allowed file patterns for log files
const LOG_FILE_PATTERN = /^audit-\d{4}-\d{2}-\d{2}\.log$/
const LOGS_DIR = path.join(process.cwd(), 'logs')

interface LogFileInfo {
  filename: string
  path: string
  size: number
  createdAt: Date
  modifiedAt: Date
  entryCount?: number
}

interface LogSearchQuery {
  startDate?: string
  endDate?: string
  user?: string
  action?: string
  level?: string
  page?: number
  limit?: number
}

async function ensureLogsDirectory(): Promise<void> {
  try {
    await fs.access(LOGS_DIR)
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true })
  }
}

async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === "ADMIN"
}

function validateFilename(filename: string): boolean {
  return LOG_FILE_PATTERN.test(filename)
}

async function getLogFiles(): Promise<LogFileInfo[]> {
  await ensureLogsDirectory()
  
  try {
    const files = await fs.readdir(LOGS_DIR)
    const logFiles: LogFileInfo[] = []

    for (const file of files) {
      if (!validateFilename(file)) continue

      const filePath = path.join(LOGS_DIR, file)
      const stats = await fs.stat(filePath)
      
      logFiles.push({
        filename: file,
        path: filePath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      })
    }

    return logFiles.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  } catch (error) {
    console.error("Error reading log files:", error)
    return []
  }
}

async function parseLogFile(filePath: string, limit?: number, offset?: number): Promise<any[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    
    const entries: any[] = []
    let entryIndex = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line === '---' || line === '') continue
      
      try {
        if (line.startsWith('[') && line.includes('][')) {
          // This is a readable line, try to parse the next line as JSON
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim()
            if (nextLine.startsWith('{') && nextLine.endsWith('}')) {
              const jsonEntry = JSON.parse(nextLine)
              
              // Apply pagination
              if (!offset || entryIndex >= offset) {
                if (!limit || entries.length < limit) {
                  entries.push(jsonEntry)
                }
              }
              entryIndex++
              
              if (limit && entries.length >= limit) {
                break
              }
            }
          }
        } else if (line.startsWith('{') && line.endsWith('}')) {
          // This is a JSON line
          const jsonEntry = JSON.parse(line)
          
          // Apply pagination
          if (!offset || entryIndex >= offset) {
            if (!limit || entries.length < limit) {
              entries.push(jsonEntry)
            }
          }
          entryIndex++
          
          if (limit && entries.length >= limit) {
            break
          }
        }
      } catch (parseError) {
        // Skip invalid lines
        continue
      }
    }
    
    return entries
  } catch (error) {
    console.error("Error parsing log file:", error)
    return []
  }
}

async function countLogEntries(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    let count = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '---' || trimmed === '') continue
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        count++
      }
    }
    
    return count
  } catch (error) {
    return 0
  }
}

async function searchLogFiles(query: LogSearchQuery): Promise<{ entries: any[], total: number }> {
  const logFiles = await getLogFiles()
  let allEntries: any[] = []
  
  // Filter by date range
  let filesToSearch = logFiles
  if (query.startDate || query.endDate) {
    filesToSearch = filesToSearch.filter(file => {
      const date = file.filename.match(/audit-(\d{4}-\d{2}-\d{2})\.log$/)?.[1]
      if (!date) return false
      
      if (query.startDate && date < query.startDate) return false
      if (query.endDate && date > query.endDate) return false
      return true
    })
  }

  // Parse entries from relevant files
  for (const file of filesToSearch) {
    const entries = await parseLogFile(file.path)
    allEntries.push(...entries)
  }

  // Filter by search criteria
  if (query.user) {
    allEntries = allEntries.filter(entry => 
      entry.userEmail?.toLowerCase().includes(query.user!.toLowerCase()) ||
      entry.userId?.includes(query.user!)
    )
  }

  if (query.action) {
    allEntries = allEntries.filter(entry => 
      entry.action?.toLowerCase().includes(query.action!.toLowerCase())
    )
  }

  if (query.level) {
    allEntries = allEntries.filter(entry => 
      entry.level?.toLowerCase() === query.level!.toLowerCase()
    )
  }

  // Sort by timestamp (newest first)
  allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const total = allEntries.length
  const page = query.page || 1
  const limit = query.limit || 50
  const offset = (page - 1) * limit

  const paginatedEntries = allEntries.slice(offset, offset + limit)

  return { entries: paginatedEntries, total }
}

export async function GET(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const searchMode = searchParams.get('search') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    // GET /api/logs - List log files
    if (!searchMode) {
      const logFiles = await getLogFiles()
      
      // Add entry count for each file
      for (const file of logFiles) {
        file.entryCount = await countLogEntries(file.path)
      }

      return NextResponse.json({
        files: logFiles,
        totalFiles: logFiles.length,
        totalSize: logFiles.reduce((sum, file) => sum + file.size, 0)
      })
    }

    // GET /api/logs?search=true - Search log files
    if (searchMode) {
      const searchQuery: LogSearchQuery = {
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        user: searchParams.get('user') || undefined,
        action: searchParams.get('action') || undefined,
        level: searchParams.get('level') || undefined,
        page,
        limit
      }

      const { entries, total } = await searchLogFiles(searchQuery)
      
      return NextResponse.json({
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        search: searchQuery
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  } catch (error) {
    console.error("Logs API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}