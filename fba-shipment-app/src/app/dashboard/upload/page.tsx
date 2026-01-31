"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Loader2,
  ArrowLeft,
  User,
  Package
} from 'lucide-react'

interface CsvRow {
  QTY: string
  SKU: string
  FNSKU: string
  ID: string
}

interface UploadResponse {
  success: boolean
  shipmentId?: string
  shipmentName?: string
  itemsCount?: number
  message?: string
  error?: string
  details?: string[]
}

interface PackerSession {
  user: {
    id: string
    email: string
    name: string
    role: string
    stationId: string
    stationName: string
    loginTime: string
  }
}

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CsvRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [userType, setUserType] = useState<'ADMIN' | 'SHIPPER' | 'PACKER' | null>(null)
  const [packerSession, setPackerSession] = useState<PackerSession | null>(null)

  const sampleData: CsvRow[] = [
    { QTY: "10", SKU: "ABC-001", FNSKU: "FN001", ID: "ITEM001" },
    { QTY: "25", SKU: "XYZ-002", FNSKU: "FN002", ID: "ITEM002" },
    { QTY: "5", SKU: "DEF-003", FNSKU: "FN003", ID: "ITEM003" }
  ]

  // Check user type on mount
  useEffect(() => {
    const checkUserType = () => {
      // Check for PACKER session first
      if (typeof window !== "undefined") {
        const packerSessionData = sessionStorage.getItem("packer-session")
        if (packerSessionData) {
          const parsedSession = JSON.parse(packerSessionData)
          // Check if session is still valid
          if (new Date(parsedSession.expires) > new Date()) {
            setUserType('PACKER')
            setPackerSession(parsedSession)
            return
          } else {
            // Session expired, remove it
            sessionStorage.removeItem("packer-session")
          }
        }
      }

      // For ADMIN/SHIPPER users, check NextAuth session via API
      fetch('/api/auth/session')
        .then(response => response.json())
        .then(session => {
          if (session?.user?.role) {
            setUserType(session.user.role)
          } else {
            // No session found, redirect to login
            router.push('/auth/signin')
          }
        })
        .catch(error => {
          console.error('Error checking session:', error)
          router.push('/auth/signin')
        })
    }

    checkUserType()
  }, [router])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    const uploadedFile = acceptedFiles[0]
    
    if (rejectedFiles.length > 0) {
      setUploadResult({
        success: false,
        error: "Invalid file format. Please upload a CSV file.",
        details: rejectedFiles.map(r => r.errors.map((e: any) => e.message)).flat()
      })
      return
    }

    if (uploadedFile) {
      if (uploadedFile.size > 10 * 1024 * 1024) {
        setUploadResult({
          success: false,
          error: "File size exceeds 10MB limit"
        })
        return
      }

      setFile(uploadedFile)
      setUploadResult(null)
      
      // Parse and preview CSV data
      try {
        const text = await uploadedFile.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setUploadResult({
            success: false,
            error: "CSV file must contain at least a header and one data row"
          })
          return
        }

        // Simple CSV parsing (basic implementation)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const requiredColumns = ['QTY', 'SKU', 'FNSKU', 'ID']
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          setUploadResult({
            success: false,
            error: `Missing required columns: ${missingColumns.join(', ')}`,
            details: [`Expected columns: ${requiredColumns.join(', ')}`]
          })
          return
        }

        const data: CsvRow[] = []
        for (let i = 1; i < Math.min(lines.length, 6); i++) { // Preview max 5 rows
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length >= 4) {
            data.push({
              QTY: values[headers.indexOf('QTY')] || '',
              SKU: values[headers.indexOf('SKU')] || '',
              FNSKU: values[headers.indexOf('FNSKU')] || '',
              ID: values[headers.indexOf('ID')] || ''
            })
          }
        }

        setPreviewData(data)
        setShowPreview(true)
      } catch (error) {
        setUploadResult({
          success: false,
          error: "Failed to parse CSV file",
          details: [error instanceof Error ? error.message : 'Unknown parsing error']
        })
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  })

  const downloadTemplate = () => {
    const csvContent = [
      'QTY,SKU,FNSKU,ID',
      ...sampleData.map(row => `${row.QTY},${row.SKU},${row.FNSKU},${row.ID}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shipment_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      // Choose the correct endpoint based on user type
      const endpoint = userType === 'PACKER' ? '/api/packer/shipments/import' : '/api/shipments/import'
      
      // For PACKER users, add authentication headers
      const headers: Record<string, string> = {}
      if (userType === 'PACKER' && packerSession) {
        headers['x-packer-id'] = packerSession.user.id
        headers['x-station-id'] = packerSession.user.stationId
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result: UploadResponse = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Redirect to appropriate dashboard after successful upload
        setTimeout(() => {
          if (userType === 'PACKER') {
            router.push('/dashboard/packer')
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      }
    } catch (error) {
      clearInterval(progressInterval)
      setUploadResult({
        success: false,
        error: "Upload failed",
        details: [error instanceof Error ? error.message : 'Network error']
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreviewData([])
    setUploadResult(null)
    setShowPreview(false)
    setUploadProgress(0)
  }

// Show loading state while checking user type
  const checkUserType = () => {
    // Check for PACKER session first
    if (typeof window !== "undefined") {
      const packerSessionData = sessionStorage.getItem("packer-session")
      if (packerSessionData) {
        const parsedSession = JSON.parse(packerSessionData)
        // Check if session is Still valid
        if (new Date(parsedSession.expires) > new Date()) {
          setUserType('PACKER')
          setPackerSession(parsedSession)
          return
        } else {
          // Session expired, remove it
          sessionStorage.removeItem("packer-session")
        }
      }
    }

    // For ADMIN/SHIPPER users, check NextAuth session via API
    fetch('/api/auth/session')
      .then(response => response.json())
      .then(session => {
        if (session?.user?.role) {
          setUserType(session.user.role)
        } else {
          // No session found, redirect to login
          router.push('/auth/signin')
        }
      })
      .catch(error => {
        console.error('Error checking session:', error)
        router.push('/auth/signin')
      })
    }
  }
