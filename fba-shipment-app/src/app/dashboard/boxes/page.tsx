'use client'

import { useState, useEffect } from 'react'
import { getClientSession } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  X,
  RefreshCw,
  Download,
  Filter,
  Grid3X3,
  List,
  Box,
  ShoppingCart
} from 'lucide-react'

// Types
interface BoxItem {
  id: string
  boxId: string
  itemId: string
  quantity: number
  item: {
    id: string
    sku: string
    fnSku: string
    quantity: number
    pickedQty: number
  }
}

interface Box {
  id: string
  shipmentId: string
  name: string
  status: 'OPEN' | 'CONCLUDED'
  concludedAt?: string
  createdAt: string
  shipment: {
    id: string
    name: string
    status: string
    shipper: {
      id: string
      name: string
      email: string
    }
  }
  boxItems: BoxItem[]
  _count: {
    boxItems: number
  }
}

interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'SHIPPER' | 'PACKER'
  }
}

// Loading skeleton
function BoxesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
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
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    OPEN: 'default',
    CONCLUDED: 'secondary'
  }

  const colors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    CONCLUDED: 'bg-blue-100 text-blue-800'
  }

  return (
    <Badge variant={variants[status] || 'outline'} className={colors[status] || ''}>
      {status === 'OPEN' ? '📦 Open' : '✅ Concluded'}
    </Badge>
  )
}

// Progress bar for boxes
function BoxProgressBar({ box }: { box: Box }) {
  if (box.status === 'CONCLUDED') return null

  const totalItems = box.boxItems.reduce((sum, item) => sum + item.quantity, 0)
  const progress = totalItems > 0 ? Math.min((totalItems / 10) * 100, 100) : 0 // Assuming 10 items per box target

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  )
}

interface AvailableItem {
  id: string
  shipmentId: string
  sku: string
  fnSku: string
  quantity: number
  pickedQty: number
  identifier: string
  availableQuantity: number
  isFullyPicked: boolean
}

// Add Item Modal
function AddItemModal({ 
  box, 
  isOpen, 
  onClose, 
  onItemAdded 
}: { 
  box: Box
  isOpen: boolean
  onClose: () => void
  onItemAdded: () => void 
}) {
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([])
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && box) {
      const fetchAvailableItems = async () => {
        try {
          const response = await fetch(`/api/shipments/${box.shipmentId}/items`)
          if (response.ok) {
            const items: AvailableItem[] = await response.json()
            setAvailableItems(items.filter((item) => !item.isFullyPicked))
          }
        } catch (error) {
          console.error('Error fetching items:', error)
        }
      }

      fetchAvailableItems()
    }
  }, [isOpen, box])

  const handleAddItem = async () => {
    if (!selectedItem || quantity <= 0) return

    setLoading(true)
    try {
      const response = await fetch(`/api/boxes/${box.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem, quantity })
      })

      if (response.ok) {
        onItemAdded()
        onClose()
        setSelectedItem('')
        setQuantity(1)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add item')
      }
    } catch {
      alert('Error adding item')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Item to {box.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an item...</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.fnSku} ({item.availableQuantity} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedItem || loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Item Comment Modal
function ItemCommentModal({ 
  box, 
  item, 
  isOpen, 
  onClose, 
  onCommentAdded 
}: { 
  box: Box
  item: BoxItem
  isOpen: boolean
  onClose: () => void
  onCommentAdded: () => void 
}) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/boxes/${box.id}/items/${item.itemId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.trim() })
      })

      if (response.ok) {
        onCommentAdded()
        onClose()
        setComment('')
      } else {
        alert('Failed to add comment')
      }
    } catch {
      alert('Error adding comment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Comment</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Item: <strong>{item.item.sku}</strong>
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={!comment.trim() || loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
              Add Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component
export default function BoxesPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Modals
  const [selectedBox, setSelectedBox] = useState<Box | null>(null)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BoxItem | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  
  // Real-time updates
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const itemsPerPage = 12

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getClientSession()
        if (sessionData?.user?.role !== 'PACKER') {
          setError('Access denied. This page is only available to packers.')
        }
        setSession(sessionData as AuthSession)
      } catch {
        setError('Failed to load user session')
      }
    }
    fetchSession()
  }, [])

  // Fetch boxes
  useEffect(() => {
    if (!session) return

    const fetchBoxes = async () => {
      try {
        setLoading(true)
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchTerm,
          status: statusFilter,
          sortBy,
          sortOrder
        })

        const response = await fetch(`/api/boxes?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch boxes')
        }

        const data = await response.json()
        setBoxes(data.boxes || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } catch {
        setError('Failed to load boxes')
      } finally {
        setLoading(false)
      }
    }

    fetchBoxes()
  }, [session, currentPage, searchTerm, statusFilter, sortBy, sortOrder, lastUpdate])

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [session])

  // Calculate statistics
  const stats = {
    total: boxes.length,
    open: boxes.filter(b => b.status === 'OPEN').length,
    concluded: boxes.filter(b => b.status === 'CONCLUDED').length,
    totalItems: boxes.reduce((sum, box) => sum + box._count.boxItems, 0)
  }

  // Action handlers
  const handleConcludeBox = async (boxId: string) => {
    if (!confirm('Are you sure you want to conclude this box? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/boxes/${boxId}/conclude`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to conclude box')
        return
      }

      // Download CSV if successful
      const data = await response.json()
      if (data.allBoxesConcluded) {
        alert('Shipment completed! All boxes have been concluded.')
      }

      // Refresh boxes
      setLastUpdate(Date.now())
    } catch {
      alert('Error concluding box')
    }
  }

  const handleRemoveItem = async (boxId: string, itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the box?')) return

    try {
      const response = await fetch(`/api/boxes/${boxId}?itemId=${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLastUpdate(Date.now())
      } else {
        alert('Failed to remove item')
      }
    } catch {
      alert('Error removing item')
    }
  }

  const handleDownloadCSV = async (boxId: string, boxName: string) => {
    try {
      const response = await fetch(`/api/boxes/${boxId}/conclude?download=csv`, {
        method: 'POST'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `box_${boxName}_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch {
      alert('Error downloading CSV')
    }
  }

  if (loading && boxes.length === 0) {
    return <BoxesSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Box Management</h1>
          <p className="text-gray-600 mt-2">Manage and track packing progress</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setLastUpdate(Date.now())}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Active boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluded</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.concluded}</div>
            <p className="text-xs text-muted-foreground">Completed boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Items packed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search boxes or shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CONCLUDED">Concluded</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as 'name' | 'createdAt' | 'updatedAt')
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Boxes Display */}
      <Card>
        <CardHeader>
          <CardTitle>Boxes</CardTitle>
        </CardHeader>
        <CardContent>
          {boxes.length === 0 ? (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No boxes found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxes.map((box) => (
                <div key={box.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Box className="h-6 w-6 text-blue-500" />
                      <h3 className="font-semibold">{box.name}</h3>
                    </div>
                    <StatusBadge status={box.status} />
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      {box.shipment.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(box.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {box.shipment.shipper.name}
                    </div>
                  </div>

                  {box.status === 'OPEN' && (
                    <div className="mb-3">
                      <BoxProgressBar box={box} />
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      {box._count.boxItems} items • {box.boxItems.reduce((sum, item) => sum + item.quantity, 0)} units
                    </p>
                  </div>

                  {/* Items List */}
                  {box.boxItems.length > 0 && (
                    <div className="mb-3 max-h-32 overflow-y-auto">
                      <div className="text-xs text-gray-600 mb-1">Items:</div>
                      {box.boxItems.map((item) => (
                        <div key={item.id} className="text-xs bg-gray-50 rounded p-2 mb-1">
                          <div className="flex justify-between items-center">
                            <span>{item.item.sku}</span>
                            <span className="font-medium">×{item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {box.status === 'OPEN' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedBox(box)
                            setShowAddItemModal(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleConcludeBox(box.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conclude
                        </Button>
                      </>
                    )}
                    {box.status === 'CONCLUDED' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadCSV(box.id, box.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        CSV
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {boxes.map((box) => (
                <div key={box.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Box className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg">{box.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {box.shipment.name}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {box.shipment.shipper.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(box.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={box.status} />
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        {box.status === 'OPEN' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedBox(box)
                                setShowAddItemModal(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Item
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleConcludeBox(box.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Conclude
                            </Button>
                          </>
                        )}
                        {box.status === 'CONCLUDED' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadCSV(box.id, box.name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {box.status === 'OPEN' && (
                    <div className="mb-3">
                      <BoxProgressBar box={box} />
                    </div>
                  )}
                  
                  {/* Items Table */}
                  {box.boxItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">FN SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Required</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {box.boxItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-sm">{item.item.sku}</td>
                              <td className="px-4 py-2 text-sm">{item.item.fnSku}</td>
                              <td className="px-4 py-2 text-sm font-medium">{item.quantity}</td>
                              <td className="px-4 py-2 text-sm">{item.item.quantity}</td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex space-x-2">
                                  {box.status === 'OPEN' && (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedItem(item)
                                          setSelectedBox(box)
                                          setShowCommentModal(true)
                                        }}
                                      >
                                        <MessageSquare className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleRemoveItem(box.id, item.itemId)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedBox && (
        <AddItemModal
          box={selectedBox}
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onItemAdded={() => setLastUpdate(Date.now())}
        />
      )}

      {selectedBox && selectedItem && (
        <ItemCommentModal
          box={selectedBox}
          item={selectedItem}
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          onCommentAdded={() => setLastUpdate(Date.now())}
        />
      )}
    </div>
  )
}