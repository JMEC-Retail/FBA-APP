"use client"

import { useState, useCallback } from 'react'
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
  ArrowLeft
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

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CsvRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const sampleData: CsvRow[] = [
    { QTY: "10", SKU: "ABC-001", FNSKU: "FN001", ID: "ITEM001" },
    { QTY: "25", SKU: "XYZ-002", FNSKU: "FN002", ID: "ITEM002" },
    { QTY: "5", SKU: "DEF-003", FNSKU: "FN003", ID: "ITEM003" }
  ]

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
      const response = await fetch('/api/shipments/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result: UploadResponse = await response.json()
      setUploadResult(result)

      if (result.success) {
        // Redirect to shipments page after successful upload
        setTimeout(() => {
          router.push('/dashboard')
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Shipment CSV</h1>
          <p className="text-gray-600 mt-2">Import your inventory data from a CSV file</p>
        </div>
        <Button 
          onClick={downloadTemplate}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Format Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Required Columns:</h4>
              <div className="flex flex-wrap gap-2">
                {['QTY', 'SKU', 'FNSKU', 'ID'].map(col => (
                  <Badge key={col} variant="secondary">{col}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">File Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV format only</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Header row required</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QTY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FNSKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.QTY}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.SKU}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.FNSKU}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ID}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop your CSV file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Only CSV files up to 10MB are supported
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-700">Uploading... {uploadProgress}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              uploadResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    uploadResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {uploadResult.success ? uploadResult.message : uploadResult.error}
                  </p>
                  {uploadResult.details && uploadResult.details.length > 0 && (
                    <ul className={`mt-2 text-sm ${
                      uploadResult.success ? 'text-green-700' : 'text-red-700'
                    } list-disc list-inside space-y-1`}>
                      {uploadResult.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QTY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FNSKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.QTY}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.SKU}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.FNSKU}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ID}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length >= 5 && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Showing first 5 rows of data
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {file && !uploading && (
        <div className="flex justify-center">
          <Button
            onClick={handleUpload}
            size="lg"
            className="px-8 py-3"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Shipment
          </Button>
        </div>
      )}
    </div>
  )
}