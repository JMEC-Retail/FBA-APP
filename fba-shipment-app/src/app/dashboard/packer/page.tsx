"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Box, 
  Archive, 
  Activity,
  Link2,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Scan,
  Printer,
  RefreshCw,
  LogOut,
  User,
  MapPin
} from "lucide-react"

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

interface Shipment {
  id: string
  name: string
  status: string
  _count: {
    items: number
    boxes: number
  }
}

interface Box {
  id: string
  name: string
  status: string
  shipment: {
    name: string
  }
  createdAt: string
}

interface PickerLink {
  id: string
  uuid: string
  shipment: {
    id: string
    name: string
    status: string
    items: Array<{
      id: string
      sku: string
      quantity: number
      pickedQty: number
    }>
    boxes: Array<{
      id: string
      name: string
      status: string
    }>
  }
  createdAt: string
}

interface Stats {
  activeAssignments: number
  openBoxes: number
  totalPacked: number
  itemsRemaining: number
  todayPacked: number
  averageTime: number
}

export default function PackerDashboard() {
  const router = useRouter()
  const [session, setSession] = useState<PackerSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    activeAssignments: 0,
    openBoxes: 0,
    totalPacked: 0,
    itemsRemaining: 0,
    todayPacked: 0,
    averageTime: 0
  })
  const [pickerLinks, setPickerLinks] = useState<PickerLink[]>([])
  const [recentBoxes, setRecentBoxes] = useState<Box[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load session and data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check PACKER session
        if (typeof window !== "undefined") {
          const packerSession = sessionStorage.getItem("packer-session")
          if (packerSession) {
            const parsedSession = JSON.parse(packerSession)
            // Check if session is still valid
            if (new Date(parsedSession.expires) > new Date()) {
              setSession(parsedSession)
              await loadDashboardData(parsedSession.user)
            } else {
              // Session expired
              sessionStorage.removeItem("packer-session")
              router.push("/auth/packer-login")
              return
            }
          } else {
            router.push("/auth/packer-login")
            return
          }
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
        setError("Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const loadDashboardData = async (user: any) => {
    try {
      setRefreshing(true)
      
      // Load PACKER statistics
      const statsResponse = await fetch(`/api/packer/stats?packerId=${user.id}`)
      let packerStats = null
      if (statsResponse.ok) {
        packerStats = await statsResponse.json()
      }

      // Load active picker links (accessible shipments)
      const linksResponse = await fetch(`/api/picker-links?packer=${user.id}`)
      if (linksResponse.ok) {
        const linksData = await linksResponse.json()
        setPickerLinks(linksData.data || [])
      }

      // Load recent boxes
      const boxesResponse = await fetch(`/api/boxes?limit=10&sortBy=createdAt&sortOrder=desc&packerId=${user.id}`)
      if (boxesResponse.ok) {
        const boxesData = await boxesResponse.json()
        setRecentBoxes(boxesData.boxes || [])
      }

      // Use PACKER stats if available, otherwise fallback to calculated stats
      if (packerStats) {
        const itemsRemaining = pickerLinks.reduce((acc: number, link: PickerLink) => {
          return acc + link.shipment.items.reduce((itemAcc: number, item: any) => {
            return itemAcc + (item.quantity - item.pickedQty)
          }, 0)
        }, 0)

        setStats({
          activeAssignments: packerStats.activeAssignments,
          openBoxes: pickerLinks.reduce((acc: number, link: PickerLink) => 
            acc + link.shipment.boxes.filter((b: any) => b.status === 'OPEN').length, 0),
          totalPacked: packerStats.totalBoxesPacked,
          itemsRemaining,
          todayPacked: packerStats.todayBoxesPacked,
          averageTime: packerStats.averagePackingTimeMinutes
        })
      } else {
        // Fallback calculation
        const shipmentsResponse = await fetch(`/api/shipments?status=ACTIVE`)
        if (shipmentsResponse.ok) {
          const shipmentsData = await shipmentsResponse.json()
          const activeShipments = shipmentsData.shipments || []
          
          const openBoxesCount = activeShipments.reduce((acc: number, shipment: Shipment) => {
            return acc + shipment._count.boxes
          }, 0)

          const itemsRemaining = pickerLinks.reduce((acc: number, link: PickerLink) => {
            return acc + link.shipment.items.reduce((itemAcc: number, item: any) => {
              return itemAcc + (item.quantity - item.pickedQty)
            }, 0)
          }, 0)

          setStats({
            activeAssignments: pickerLinks.length,
            openBoxes: openBoxesCount,
            totalPacked: 0, // Would need separate calculation
            itemsRemaining,
            todayPacked: 0,
            averageTime: 45
          })
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (session) {
      loadDashboardData(session.user)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("packer-session")
      sessionStorage.removeItem("current-station")
    }
    router.push("/auth/packer-login")
  }

  const handleAccessPickerLink = (uuid: string) => {
    router.push(`/picker/${uuid}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading PACKER dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-black mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">PACKER Dashboard</h1>
                <p className="text-sm text-black">Station: {session?.user.stationName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Current Time */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-black">{currentTime.toLocaleTimeString()}</p>
                <p className="text-xs text-black">{currentTime.toLocaleDateString()}</p>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden sm:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* User Info */}
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-black" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-black">{session?.user.name}</p>
                  <p className="text-xs text-black">{session?.user.stationId}</p>
                </div>
              </div>

              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-black bg-blue-100 px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.activeAssignments}</p>
                <p className="text-xs text-black">Assignments</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Box className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-black bg-green-100 px-2 py-1 rounded">Open</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.openBoxes}</p>
                <p className="text-xs text-black">Boxes</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Archive className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-black bg-purple-100 px-2 py-1 rounded">Total</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.totalPacked}</p>
                <p className="text-xs text-black">Packed</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-black bg-orange-100 px-2 py-1 rounded">Items</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.itemsRemaining}</p>
                <p className="text-xs text-black">Remaining</p>
              </CardContent>
            </Card>

            <Card className="border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  <span className="text-xs text-black bg-teal-100 px-2 py-1 rounded">Today</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.todayPacked}</p>
                <p className="text-xs text-black">Packed</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-black bg-gray-100 px-2 py-1 rounded">Avg</span>
                </div>
                <p className="text-2xl font-bold text-black mt-2">{stats.averageTime}m</p>
                <p className="text-xs text-black">Time/Box</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => router.push("/dashboard/boxes")}
                >
                  <Box className="h-6 w-6" />
                  <span className="text-sm">Manage Boxes</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => router.push("/dashboard/shipments")}
                >
                  <Package className="h-6 w-6" />
                  <span className="text-sm">View Shipments</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => router.push("/dashboard/reports")}
                >
                  <Activity className="h-6 w-6" />
                  <span className="text-sm">Reports</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Picker Links (Accessible Shipments) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <Link2 className="h-5 w-5 mr-2" />
                Active Assignments
                {pickerLinks.length > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    {pickerLinks.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pickerLinks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-black">No active assignments</p>
                  <p className="text-sm text-black mt-2">
                    Contact your supervisor to get assigned picker links
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pickerLinks.map((link) => {
                    const totalItems = link.shipment.items.reduce((acc, item) => acc + item.quantity, 0)
                    const pickedItems = link.shipment.items.reduce((acc, item) => acc + item.pickedQty, 0)
                    const completionRate = totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0
                    
                    return (
                      <div key={link.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-black">{link.shipment.name}</h3>
                            <p className="text-sm text-black">
                              Assigned {new Date(link.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={completionRate === 100 ? "default" : "secondary"}
                              className={completionRate === 100 ? "bg-green-100 text-green-800" : ""}
                            >
                              {completionRate}% Complete
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleAccessPickerLink(link.uuid)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Scan className="h-4 w-4 mr-1" />
                              Access
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-black">Total Items</p>
                            <p className="font-semibold">{totalItems}</p>
                          </div>
                          <div>
                            <p className="text-black">Picked Items</p>
                            <p className="font-semibold">{pickedItems}</p>
                          </div>
                          <div>
                            <p className="text-black">Open Boxes</p>
                            <p className="font-semibold">
                              {link.shipment.boxes.filter(b => b.status === 'OPEN').length}
                            </p>
                          </div>
                          <div>
                            <p className="text-black">Closed Boxes</p>
                            <p className="font-semibold">
                              {link.shipment.boxes.filter(b => b.status === 'CLOSED').length}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Box Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBoxes.length === 0 ? (
                <p className="text-black text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentBoxes.slice(0, 5).map((box) => (
                    <div key={box.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-black">{box.name}</p>
                        <p className="text-sm text-black">{box.shipment.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={box.status === "OPEN" ? "default" : "secondary"}
                          className={box.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {box.status}
                        </Badge>
                        <p className="text-xs text-black mt-1">
                          {new Date(box.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Station Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Station Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-black">Station ID</p>
                  <p className="font-semibold">{session?.user.stationId}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Station Name</p>
                  <p className="font-semibold">{session?.user.stationName}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Operator</p>
                  <p className="font-semibold">{session?.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Login Time</p>
                  <p className="font-semibold">
                    {session?.user.loginTime ? new Date(session.user.loginTime).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}