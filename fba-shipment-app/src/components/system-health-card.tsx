'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  email: 'healthy' | 'warning' | 'error'
  memory: 'healthy' | 'warning' | 'error'
  diskSpace: 'healthy' | 'warning' | 'error'
}

interface SystemMetrics {
  uptime: number
  activeUsers: number
  totalShipments: number
  todaysShipments: number
  errorRate: number
  responseTime: number
  databaseSize: string
  storageUsed: string
}

export default function SystemHealthCard() {
  const [health, setHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    email: 'warning',
    memory: 'healthy',
    diskSpace: 'healthy'
  })
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 0,
    activeUsers: 0,
    totalShipments: 0,
    todaysShipments: 0,
    errorRate: 0,
    responseTime: 0,
    databaseSize: '0 MB',
    storageUsed: '0 GB'
  })
  
  const [loading, setLoading] = useState(false)

  const fetchSystemHealth = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch from API
      // const response = await fetch('/api/settings/health')
      // const data = await response.json()
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHealth({
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy',
        email: 'warning',
        memory: 'healthy',
        diskSpace: 'healthy'
      })
      
      setMetrics({
        uptime: 86400 * 7, // 7 days
        activeUsers: 12,
        totalShipments: 1247,
        todaysShipments: 23,
        errorRate: 0.2,
        responseTime: 145,
        databaseSize: '245 MB',
        storageUsed: '1.2 GB'
      })
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemHealth()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSystemHealth, 300000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'Healthy'
      case 'warning': return 'Warning'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Real-time system status and performance metrics
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSystemHealth}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Service Status */}
          <div>
            <h3 className="text-lg font-medium mb-3">Service Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(health).map(([service, status]) => (
                <div key={service} className="text-center">
                  <div className="relative inline-flex h-3 w-3 mb-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${getStatusColor(status)} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor(status)}`}></span>
                  </div>
                  <div className="text-sm font-medium capitalize">{service}</div>
                  <div className="text-xs text-gray-500">{getStatusText(status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-3">System Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {formatUptime(metrics.uptime)}
                </div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.activeUsers}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.totalShipments.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Shipments</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.todaysShipments}
                </div>
                <div className="text-sm text-gray-600">Today&apos;s Shipments</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.errorRate}%
                </div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-teal-600">
                  {metrics.responseTime}ms
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-indigo-600">
                  {metrics.databaseSize}
                </div>
                <div className="text-sm text-gray-600">Database Size</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-pink-600">
                  {metrics.storageUsed}
                </div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchSystemHealth}>
                Run Health Check
              </Button>
              <Button variant="outline" size="sm" onClick={() => {/* Handle clear cache */}}>
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" onClick={() => {/* Handle restart services */}}>
                Restart Services
              </Button>
              <Button variant="outline" size="sm" onClick={() => {/* Handle view logs */}}>
                View System Logs
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}