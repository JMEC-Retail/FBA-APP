'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Link, 
  Plus, 
  Search, 
  Copy, 
  Eye, 
  EyeOff, 
  Calendar,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

// Types
interface PickerLink {
  id: string
  uuid: string
  isActive: boolean
  createdAt: string
  shipmentId: string
  packerId?: string
  packer?: {
    id: string
    name: string
    email: string
  }
  shipment: {
    id: string
    name: string
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    shipper: {
      id: string
      name: string
      email: string
    }
    _count: {
      items: number
      boxes: number
    }
  }
  // We'll track access count via audit logs if needed
}

interface Shipment {
  id: string
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  _count: {
    items: number
    boxes: number
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
function PickerLinksSkeleton() {
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
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Status badge component
function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (!isActive) {
    return <Badge variant="outline">INACTIVE</Badge>
  }
  
  if (status === 'COMPLETED') {
    return <Badge variant="secondary">COMPLETED</Badge>
  }
  
  if (status === 'CANCELLED') {
    return <Badge variant="destructive">EXPIRED</Badge>
  }
  
  return <Badge variant="default">ACTIVE</Badge>
}

// Create Link Modal
function CreateLinkModal({ 
  isOpen, 
  onClose, 
  shipments, 
  onCreate 
}: { 
  isOpen: boolean
  onClose: () => void
  shipments: Shipment[]
  onCreate: (shipmentId: string) => void
}) {
  const [selectedShipment, setSelectedShipment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment) return

    setLoading(true)
    try {
      await onCreate(selectedShipment)
      setSelectedShipment('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Picker Link</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Shipment
            </label>
            <select
              value={selectedShipment}
              onChange={(e) => setSelectedShipment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a shipment...</option>
              {shipments
                .filter(s => s.status === 'ACTIVE')
                .map(shipment => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.name} ({shipment._count.items} items, {shipment._count.boxes} boxes)
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedShipment || loading}>
              {loading ? 'Creating...' : 'Create Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main component
export default function PickerLinksPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [pickerLinks, setPickerLinks] = useState<PickerLink[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const itemsPerPage = 10

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await auth() as AuthSession
        setSession(sessionData)
      } catch {
        setError('Failed to load user session')
      }
    }
    fetchSession()
  }, [])

  // Fetch picker links
  useEffect(() => {
    if (!session) return

    const fetchPickerLinks = async () => {
      try {
        setLoading(true)
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        })

        const response = await fetch(`/api/picker-links?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch picker links')
        }

        const data = await response.json()
        setPickerLinks(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } catch {
        setError('Failed to load picker links')
      } finally {
        setLoading(false)
      }
    }

    fetchPickerLinks()
  }, [session, currentPage])

  // Fetch shipments for creating links
  useEffect(() => {
    if (!session) return

    const fetchShipments = async () => {
      try {
        const params = new URLSearchParams({
          limit: '100', // Get all shipments for the dropdown
          status: 'ACTIVE'
        })

        const response = await fetch(`/api/shipments?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch shipments')
        }

        const data = await response.json()
        setShipments(data.shipments || [])
      } catch {
        console.error('Failed to load shipments')
      }
    }

    fetchShipments()
  }, [session])

  // Calculate statistics
  const stats = {
    total: pickerLinks.length,
    active: pickerLinks.filter(l => l.isActive && l.shipment.status === 'ACTIVE').length,
    inactive: pickerLinks.filter(l => !l.isActive).length,
    expired: pickerLinks.filter(l => l.isActive && ['COMPLETED', 'CANCELLED'].includes(l.shipment.status)).length
  }

  // Role-based actions
  const canCreateLink = session?.user.role === 'ADMIN' || session?.user.role === 'SHIPPER'
  const canManageLink = (link: PickerLink) => {
    return session?.user.role === 'ADMIN' || 
           (session?.user.role === 'SHIPPER' && link.shipment.shipper.id === session.user.id)
  }

  // Copy UUID to clipboard
  const copyToClipboard = async (uuid: string) => {
    const fullUrl = `${window.location.origin}/picker/${uuid}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setSuccess('Link copied to clipboard!')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setSuccess('Failed to copy link')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Toggle link activation
  const toggleLinkStatus = async (link: PickerLink) => {
    try {
      const response = await fetch('/api/picker-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: link.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update link')
      }

      const updatedLink = await response.json()
      setPickerLinks(links => 
        links.map(l => l.id === link.id ? { ...l, isActive: updatedLink.isActive } : l)
      )
      setSuccess(`Link ${updatedLink.isActive ? 'activated' : 'deactivated'} successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to update link status')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Create new picker link
  const createPickerLink = async (shipmentId: string) => {
    try {
      const response = await fetch('/api/picker-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId })
      })

      if (!response.ok) {
        throw new Error('Failed to create link')
      }

      const newLink = await response.json()
      setPickerLinks(links => [newLink, ...links])
      setSuccess('Picker link created successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to create picker link')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Filter links
  const filteredLinks = pickerLinks.filter(link => {
    const matchesSearch = link.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.shipment.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = link.isActive && link.shipment.status === 'ACTIVE'
    } else if (statusFilter === 'inactive') {
      matchesStatus = !link.isActive
    }

    return matchesSearch && matchesStatus
  })

  if (loading && pickerLinks.length === 0) {
    return <PickerLinksSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Picker Links Management</h1>
          <p className="text-gray-600 mt-2">
            Manage UUID picker links for shipment access
          </p>
        </div>
        
        {canCreateLink && (
          <div className="flex space-x-2">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All picker links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Deactivated links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Shipment completed/cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by UUID or shipment name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Picker Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Picker Links</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-8">
              <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No picker links found</p>
              {canCreateLink && (
                <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Link
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Link className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-lg">{link.shipment.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {link.shipment.shipper.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(link.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={link.shipment.status} isActive={link.isActive} />
                      
                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(link.uuid)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={`/picker/${link.uuid}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Test
                          </a>
                        </Button>
                        
                        {canManageLink(link) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLinkStatus(link)}
                            className={link.isActive ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                          >
                            {link.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* UUID Display */}
                  <div className="mb-3 p-2 bg-gray-50 rounded font-mono text-sm">
                    {link.uuid}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">UUID</p>
                      <p className="font-semibold">{link.uuid.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Shipment Status</p>
                      <StatusBadge status={link.shipment.status} isActive={link.isActive} />
                    </div>
                    <div>
                      <p className="text-gray-600">Assigned Packer</p>
                      <p className="font-semibold">
                        {link.packer ? link.packer.name : 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-semibold">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
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

      {/* Create Link Modal */}
      <CreateLinkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        shipments={shipments}
        onCreate={createPickerLink}
      />
    </div>
  )
}