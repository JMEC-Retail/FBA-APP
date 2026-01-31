'use client'

import { useState, useEffect, useCallback } from 'react'
import { getClientSession } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Search, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Filter,
  DownloadCloud,
  BarChart3,
  Package,
  X,
  RefreshCw
} from 'lucide-react'

// Types
interface Report {
  filename: string
  shipmentId: string
  boxId?: string
  format: 'fba' | 'inventory' | 'custom'
  generatedAt: string
  fileSize: number
  recordCount: number
  createdAt: string
}

interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'SHIPPER' | 'PACKER'
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface FilterOptions {
  shipmentId: string
  dateFrom: string
  dateTo: string
  format: string
}

// Loading skeleton
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Format badge component
function FormatBadge({ format }: { format: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    fba: 'default',
    inventory: 'secondary',
    custom: 'outline'
  }

  return (
    <Badge variant={variants[format] || 'outline'} className="capitalize">
      {format}
    </Badge>
  )
}

// File size formatter
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Report preview modal
function ReportPreviewModal({ 
  report, 
  isOpen, 
  onClose 
}: { 
  report: Report | null
  isOpen: boolean
  onClose: () => void 
}) {
  const [preview, setPreview] = useState<{
    filename: string
    headers: string[]
    data: Record<string, string>[]
    metadata: {
      fileSize: number
      createdAt: string
      modifiedAt: string
      recordCount: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadPreview = useCallback(async () => {
    if (!report) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${report.filename}?view=true`)
      if (response.ok) {
        const data = await response.json()
        setPreview(data)
      }
    } catch (error) {
      console.error('Failed to load preview:', error)
    } finally {
      setLoading(false)
    }
  }, [report])

  useEffect(() => {
    if (isOpen && report) {
      loadPreview()
    }
  }, [isOpen, report, loadPreview])

  if (!isOpen || !report) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Report Preview: {report.filename}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading preview...
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Records:</span> {preview.metadata.recordCount}
                </div>
                <div>
                  <span className="font-medium">File Size:</span> {formatFileSize(preview.metadata.fileSize)}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(preview.metadata.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {report.format}
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-sm">Preview (first 10 rows)</h4>
                </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {preview.headers.map((header: string, index: number) => (
                            <th key={index} className="px-4 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.slice(0, 10).map((row: Record<string, string>, index: number) => (
                          <tr key={index} className="border-b">
                            {preview.headers.map((header: string, cellIndex: number) => (
                              <td key={cellIndex} className="px-4 py-2">
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  {preview.data.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                      ... and {preview.data.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-red-600">
              Failed to load preview
            </div>
          )}
        </div>
        
        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            window.open(`/api/reports/${report.filename}`, '_blank')
          }}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function ReportsPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  })
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({
    shipmentId: '',
    dateFrom: '',
    dateTo: '',
    format: ''
  })
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getClientSession()
        setSession(sessionData as AuthSession)
      } catch {
        setError('Failed to load user session')
      }
    }
    fetchSession()
  }, [])

  // Fetch reports
  useEffect(() => {
    if (!session) return

    const fetchReports = async () => {
      try {
        setLoading(true)
        
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        })

        // Add search and filters
        if (searchTerm) params.append('search', searchTerm)
        if (filters.shipmentId) params.append('shipmentId', filters.shipmentId)
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
        if (filters.dateTo) params.append('dateTo', filters.dateTo)
        if (filters.format) params.append('format', filters.format)

        const response = await fetch(`/api/reports?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reports')
        }

        const data = await response.json()
        setReports(data.reports || [])
        setPagination(prev => ({ ...prev, ...data.pagination }))
      } catch {
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [session, pagination.page, pagination.limit, searchTerm, filters])

  // Calculate statistics
  const stats = {
    total: pagination.total,
    fba: reports.filter(r => r.format === 'fba').length,
    inventory: reports.filter(r => r.format === 'inventory').length,
    custom: reports.filter(r => r.format === 'custom').length,
    totalSize: reports.reduce((acc, r) => acc + r.fileSize, 0),
    totalRecords: reports.reduce((acc, r) => acc + r.recordCount, 0)
  }

  // Role-based access control
  const canViewAllReports = session?.user.role === 'ADMIN'
  const canManageReports = session?.user.role === 'ADMIN' || session?.user.role === 'SHIPPER'
  const isReadOnlyUser = session?.user.role === 'PACKER'

  // Action handlers
  const handleDownload = (filename: string) => {
    window.open(`/api/reports/${filename}`, '_blank')
  }

  const handlePreview = (report: Report) => {
    setPreviewReport(report)
    setShowPreviewModal(true)
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/reports/${filename}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReports(reports.filter(r => r.filename !== filename))
      } else {
        throw new Error('Failed to delete report')
      }
    } catch {
      setError('Failed to delete report')
    }
  }

  const handleBulkDownload = () => {
    selectedReports.forEach(filename => {
      setTimeout(() => {
        window.open(`/api/reports/${filename}`, '_blank')
      }, 100)
    })
    setSelectedReports([])
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedReports.length} reports?`)) return

    try {
      const deletePromises = selectedReports.map(filename =>
        fetch(`/api/reports/${filename}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      setReports(reports.filter(r => !selectedReports.includes(r.filename)))
      setSelectedReports([])
    } catch {
      setError('Failed to delete reports')
    }
  }

  const toggleReportSelection = (filename: string) => {
    setSelectedReports(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    )
  }

  const clearFilters = () => {
    setFilters({
      shipmentId: '',
      dateFrom: '',
      dateTo: '',
      format: ''
    })
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (loading && reports.length === 0) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600 mt-2">
            {canViewAllReports ? 'Manage all system reports' : 
             isReadOnlyUser ? 'View and download available reports' : 
             'View your generated reports'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
            {selectedReports.length > 0 && !isReadOnlyUser && (
              <>
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Download ({selectedReports.length})
                </Button>
                {canManageReports && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedReports.length})
                  </Button>
                )}
              </>
            )}
            {selectedReports.length > 0 && isReadOnlyUser && (
              <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                <DownloadCloud className="h-4 w-4 mr-2" />
                Download Selected ({selectedReports.length})
              </Button>
            )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All generated reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">Total file size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formats</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fba + stats.inventory + stats.custom}</div>
            <p className="text-xs text-muted-foreground">FBA: {stats.fba} | Inv: {stats.inventory} | Custom: {stats.custom}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filters</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports by filename or shipment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <input
                type="text"
                placeholder="Shipment ID"
                value={filters.shipmentId}
                onChange={(e) => setFilters(prev => ({ ...prev, shipmentId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={filters.format}
                onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Formats</option>
                <option value="fba">FBA</option>
                <option value="inventory">Inventory</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          {(searchTerm || filters.shipmentId || filters.dateFrom || filters.dateTo || filters.format) && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reports ({pagination.total})</CardTitle>
            {selectedReports.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedReports([])}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.filename} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {!isReadOnlyUser && (
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.filename)}
                        onChange={() => toggleReportSelection(report.filename)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg truncate max-w-md">
                          {report.filename}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {report.shipmentId}
                          </span>
                          {report.boxId && (
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Box: {report.boxId}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(report.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <FormatBadge format={report.format} />
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreview(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(report.filename)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        
                        {canManageReports && !isReadOnlyUser && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(report.filename)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Report details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Records</p>
                      <p className="font-semibold">{report.recordCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">File Size</p>
                      <p className="font-semibold">{formatFileSize(report.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-semibold capitalize">{report.boxId ? 'Box Report' : 'Shipment Summary'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Generated</p>
                      <p className="font-semibold">
                        {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total reports)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ 
                    ...prev, 
                    page: Math.max(1, prev.page - 1) 
                  }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ 
                    ...prev, 
                    page: Math.min(pagination.totalPages, prev.page + 1) 
                  }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview Modal */}
      <ReportPreviewModal
        report={previewReport}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  )
}