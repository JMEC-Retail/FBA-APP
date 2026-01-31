import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Package, 
  Archive, 
  Upload, 
  Link as LinkIcon, 
  Box, 
  Activity,
  Plus,
  FileText,
  TrendingUp
} from "lucide-react"

// Loading component
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Dashboard Content
export async function AdminDashboard({ sessionUserId }: { sessionUserId?: string }) {
  const [
    totalUsers,
    totalShipments,
    totalBoxes,
    activeShipments,
    recentActivity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shipment.count(),
    prisma.box.count(),
    prisma.shipment.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-black mt-2">System overview and management</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-black">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
            <p className="text-xs text-black">All time shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
            <Archive className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxes}</div>
            <p className="text-xs text-black">Created boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalShipments > 0 ? Math.round((activeShipments / totalShipments) * 100) : 0}%
            </div>
            <p className="text-xs text-black">{activeShipments} active shipments</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Package className="h-6 w-6" />
              <span>View Shipments</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>Generate Reports</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6" />
              <span>System Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-sm text-black">
                    by {log.user.name} ({log.user.email})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-black">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-black">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-black text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Shipper Dashboard Content
export async function ShipperDashboard({ sessionUserId }: { sessionUserId: string }) {
  const [
    shipments,
    totalBoxes,
    openBoxes,
    pickerLinks
  ] = await Promise.all([
    prisma.shipment.findMany({
      where: { shipperId: sessionUserId },
      include: {
        boxes: true,
        items: true,
        _count: {
          select: {
            items: true,
            boxes: true,
            pickerLinks: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.box.count({
      where: {
        shipment: { shipperId: sessionUserId }
      }
    }),
    prisma.box.count({
      where: {
        shipment: { shipperId: sessionUserId },
        status: "OPEN"
      }
    }),
    prisma.pickerLink.count({
      where: {
        shipment: { shipperId: sessionUserId },
        isActive: true
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-black">Shipper Dashboard</h1>
        <p className="text-black mt-2">Manage your shipments and picker links</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
            <p className="text-xs text-black">Your shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
            <Archive className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxes}</div>
            <p className="text-xs text-black">Created boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Boxes</CardTitle>
            <Box className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openBoxes}</div>
            <p className="text-xs text-black">Active boxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickerLinks}</div>
            <p className="text-xs text-black">Picker links</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Plus className="h-6 w-6" />
              <span>New Shipment</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Upload className="h-6 w-6" />
              <span>Upload CSV</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <LinkIcon className="h-6 w-6" />
              <span>Create Link</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Package className="h-6 w-6" />
              <span>View All</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{shipment.name}</h3>
                  <p className="text-sm text-black">
                    {shipment._count.items} items • {shipment._count.boxes} boxes
                  </p>
                  <p className="text-xs text-black">
                    Created {new Date(shipment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={shipment.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {shipment.status}
                  </Badge>
                  <p className="text-sm text-black mt-1">
                    {shipment._count.pickerLinks} links
                  </p>
                </div>
              </div>
            ))}
            {shipments.length === 0 && (
              <p className="text-black text-center py-4">No shipments yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Packer Dashboard Content
export async function PackerDashboard({ sessionUserId }: { sessionUserId: string }) {
  const [
    assignedShipments,
    totalBoxesPacked,
    recentBoxes
  ] = await Promise.all([
    prisma.pickerLink.findMany({
      where: { packerId: sessionUserId, isActive: true },
      include: {
        shipment: {
          include: {
            boxes: {
              where: { status: "OPEN" },
              include: {
                boxItems: {
                  include: {
                    item: true
                  }
                }
              }
            },
            items: true
          }
        }
      }
    }),
    prisma.box.count({
      where: {
        shipment: {
          pickerLinks: {
            some: { packerId: sessionUserId }
          }
        }
      }
    }),
    prisma.box.findMany({
      where: {
        shipment: {
          pickerLinks: {
            some: { packerId: sessionUserId }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        shipment: {
          select: { name: true }
        }
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-black">Packer Dashboard</h1>
        <p className="text-black mt-2">Manage boxes and pack items efficiently</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Package className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedShipments.length}</div>
            <p className="text-xs text-black">Current shipments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Boxes</CardTitle>
            <Box className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedShipments.reduce((acc, link) => acc + link.shipment.boxes.length, 0)}
            </div>
            <p className="text-xs text-black">Ready to pack</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packed</CardTitle>
            <Archive className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxesPacked}</div>
            <p className="text-xs text-black">Boxes processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Remaining</CardTitle>
            <Activity className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedShipments.reduce((acc, link) => {
                return acc + link.shipment.items.reduce((itemAcc, item) => {
                  return itemAcc + (item.quantity - item.pickedQty)
                }, 0)
              }, 0)}
            </div>
            <p className="text-xs text-black">Items to pick</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Box className="h-6 w-6" />
              <span>Manage Boxes</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Package className="h-6 w-6" />
              <span>View Shipments</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-6 w-6" />
              <span>Reports</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6" />
              <span>Activity Log</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Shipments */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedShipments.map((link) => (
              <div key={link.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{link.shipment.name}</h3>
                  <Badge variant="outline">
                    {link.shipment.boxes.length} open boxes
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-black">Items Total</p>
                    <p className="font-medium">
                      {link.shipment.items.reduce((acc, item) => acc + item.quantity, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-black">Items Picked</p>
                    <p className="font-medium">
                      {link.shipment.items.reduce((acc, item) => acc + item.pickedQty, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-black">Assigned</p>
                    <p className="font-medium">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {assignedShipments.length === 0 && (
              <p className="text-black text-center py-4">No active assignments</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Boxes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Box Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBoxes.map((box) => (
              <div key={box.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div>
                  <p className="font-medium">{box.name}</p>
                  <p className="text-sm text-black">{box.shipment.name}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={box.status === "OPEN" ? "default" : "secondary"}
                  >
                    {box.status}
                  </Badge>
                  <p className="text-xs text-black mt-1">
                    {new Date(box.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentBoxes.length === 0 && (
              <p className="text-black text-center py-4">No recent box activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}