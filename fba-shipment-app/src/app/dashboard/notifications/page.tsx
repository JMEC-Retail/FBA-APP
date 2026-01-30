'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Notification {
  id: string
  type: 'BOX_CONCLUDED' | 'SHIPMENT_COMPLETED' | 'SHIPMENT_CANCELLED' | 'PICKER_ASSIGNED' | 'SYSTEM_ANNOUNCEMENT'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt?: string
  metadata?: Record<string, unknown>
}

interface NotificationSettings {
  [key: string]: {
    enabled: boolean
    emailEnabled: boolean
    realTimeEnabled: boolean
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and pagination
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [settings, setSettings] = useState<NotificationSettings>({})
  
  const limit = 20

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      })
      
      if (activeTab === 'unread') {
        params.append('unreadOnly', 'true')
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      
      if (dateFilter !== 'all') {
        params.append('dateFilter', dateFilter)
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications || [])
        setTotalPages(Math.ceil(data.total / limit) || 1)
      } else {
        setError(data.error || 'Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchTerm, typeFilter, dateFilter, page, limit])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      const data = await response.json()
      if (response.ok) {
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      const data = await response.json()
      if (response.ok) {
        setSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    fetchSettings()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAsRead: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteOldNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/cleanup', {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotifications()
        fetchUnreadCount()
      }
    } catch (error) {
      console.error('Failed to delete old notifications:', error)
    }
  }

  const updateNotificationSetting = async (type: string, key: string, value: boolean) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          settings: { [key]: value }
        }),
      })

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            [key]: value
          }
        }))
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      if (diffHours < 1) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60))
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BOX_CONCLUDED':
        return '✅'
      case 'SHIPMENT_COMPLETED':
        return '📦'
      case 'SHIPMENT_CANCELLED':
        return '❌'
      case 'PICKER_ASSIGNED':
        return '👤'
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢'
      default:
        return '📄'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BOX_CONCLUDED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SHIPMENT_COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SHIPMENT_CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PICKER_ASSIGNED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SYSTEM_ANNOUNCEMENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    
    let matchesDate = true
    if (dateFilter !== 'all') {
      const notificationDate = new Date(notification.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays === 0
          break
        case 'week':
          matchesDate = diffDays <= 7
          break
        case 'month':
          matchesDate = diffDays <= 30
          break
      }
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'BOX_CONCLUDED', label: 'Box Concluded' },
    { value: 'SHIPMENT_COMPLETED', label: 'Shipment Completed' },
    { value: 'SHIPMENT_CANCELLED', label: 'Shipment Cancelled' },
    { value: 'PICKER_ASSIGNED', label: 'Picker Assigned' },
    { value: 'SYSTEM_ANNOUNCEMENT', label: 'System Announcement' }
  ]

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ]

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading notifications</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchNotifications} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">Manage your notifications and preferences</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {notificationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dateFilters.map(filter => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('')
                      setTypeFilter('all')
                      setDateFilter('all')
                      setPage(1)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} size="sm">
                    Mark All as Read
                  </Button>
                )}
                <Button onClick={deleteOldNotifications} variant="outline" size="sm">
                  Delete Old Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-sm font-normal text-gray-500">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 items-center">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <Badge className={getTypeColor(notification.type)}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="destructive">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-1 text-gray-900">{notification.title}</h4>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <div className="text-sm text-gray-500 mb-2">
                          {Object.entries(notification.metadata).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              <span className="font-medium">{key}:</span> {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {!notification.isRead && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {unreadCount === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No unread notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications
                    .filter(n => !n.isRead)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border border-blue-200 bg-blue-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-lg">{getTypeIcon(notification.type)}</span>
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(notification.createdAt)}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1 text-gray-900">{notification.title}</h4>
                        <p className="text-gray-700 mb-2">{notification.message}</p>
                        <Button
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(settings).map(([type, typeSettings]) => (
                  <div key={type} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span>{getTypeIcon(type)}</span>
                      {type.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.enabled || false}
                          onChange={(e) => updateNotificationSetting(type, 'enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Enable notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.emailEnabled || false}
                          onChange={(e) => updateNotificationSetting(type, 'emailEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeSettings.realTimeEnabled !== false}
                          onChange={(e) => updateNotificationSetting(type, 'realTimeEnabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">Real-time notifications</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}