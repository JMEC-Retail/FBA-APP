import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { auth } from "@/lib/auth"

// Security: Allowed file patterns for log files
const LOG_FILE_PATTERN = /^audit-\d{4}-\d{2}-\d{2}\.log$/
const LOGS_DIR = path.join(process.cwd(), 'logs')

async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === "ADMIN"
}

function validateFilename(filename: string): boolean {
  return LOG_FILE_PATTERN.test(filename)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { filename } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!validateFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }

  try {
    const filePath = path.join(LOGS_DIR, filename)
    
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (format === 'text') {
      // Return raw text content for download
      const content = await fs.readFile(filePath, 'utf8')
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // Return parsed JSON entries
      const offset = (page - 1) * limit
      const entries = await parseLogFile(filePath, limit, offset)
      const total = await countLogEntries(filePath)
      
      return NextResponse.json({
        filename,
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        metadata: {
          size: (await fs.stat(filePath)).size,
          created: (await fs.stat(filePath)).birthtime,
          modified: (await fs.stat(filePath)).mtime
        }
      })
    }
  } catch (error) {
    console.error("Get log file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { filename } = await params

  if (!validateFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }

  try {
    const filePath = path.join(LOGS_DIR, filename)
    
    try {
      await fs.access(filePath) // Check if file exists
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    
    await fs.unlink(filePath) // Delete file

    return NextResponse.json({ 
      message: "Log file deleted successfully",
      filename 
    })
  } catch (error) {
    console.error("Delete log file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}