"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { redirect } from "next/navigation"
import { UserRole } from "@/lib/auth"
import Link from "next/link"
import { SidebarNav } from "@/components/sidebar-nav"
import NotificationBell from "@/components/notification-bell"
import { signOutAction } from "@/app/actions/auth"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  session: {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  } | null
}

interface MenuItem {
  label: string
  href: string
  icon?: string
}

const getRoleBasedMenu = (role: UserRole): MenuItem[] => {
  const menus: Record<UserRole, MenuItem[]> = {
    ADMIN: [
      { label: "Users", href: "/dashboard/users", icon: "👥" },
      { label: "Shipments", href: "/dashboard/shipments", icon: "📦" },
      { label: "Reports", href: "/dashboard/reports", icon: "📊" },
      { label: "Notifications", href: "/dashboard/notifications", icon: "🔔" },
      { label: "Settings", href: "/dashboard/settings", icon: "⚙️" }
    ],
    SHIPPER: [
      { label: "Shipments", href: "/dashboard/shipments", icon: "📦" },
      { label: "Upload CSV", href: "/dashboard/upload", icon: "📄" },
      { label: "Create Picker Links", href: "/dashboard/picker-links", icon: "🔗" },
      { label: "Notifications", href: "/dashboard/notifications", icon: "🔔" }
    ],
    PACKER: [
      { label: "View Shipments", href: "/dashboard/shipments", icon: "📦" },
      { label: "Manage Boxes", href: "/dashboard/boxes", icon: "📋" },
      { label: "Reports", href: "/dashboard/reports", icon: "📊" },
      { label: "Notifications", href: "/dashboard/notifications", icon: "🔔" }
    ]
  }

  return menus[role] || []
}

export default function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [clientSession, setClientSession] = useState(session)

  useEffect(() => {
    setIsClient(true)
    
    // Check for PACKER session in sessionStorage
    if (!clientSession && typeof window !== "undefined") {
      try {
        const packerSession = sessionStorage.getItem("packer-session")
        if (packerSession) {
          const parsedSession = JSON.parse(packerSession)
          // Check if session is still valid
          if (new Date(parsedSession.expires) > new Date()) {
            setClientSession({
              user: {
                id: parsedSession.user.id,
                email: parsedSession.user.email,
                name: parsedSession.user.name,
                role: parsedSession.user.role as UserRole
              }
            })
          } else {
            // Session expired, redirect to login
            sessionStorage.removeItem("packer-session")
            router.push("/auth/packer-login")
            return
          }
        } else {
          // No session found, redirect to login
          router.push("/auth/signin")
        }
      } catch (error) {
        console.error("Error parsing PACKER session:", error)
        router.push("/auth/signin")
      }
    }
  }, [clientSession, router])

  // Handle PACKER logout
  const handlePackerLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("packer-session")
      sessionStorage.removeItem("current-station")
    }
    router.push("/auth/packer-login")
  }

  // Show loading state on server side or during client hydration
  if (!isClient || !clientSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  const menuItems = getRoleBasedMenu(clientSession.user.role)
  const isPacker = clientSession.user.role === "PACKER"

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-300">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-semibold text-black">
                  FBA Dashboard
                </h1>
                {isPacker && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    PACKER
                  </span>
                )}
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                     className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-black hover:bg-gray-100"
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        <input type="checkbox" id="sidebar-toggle" className="hidden peer" />
        <label
          htmlFor="sidebar-toggle"
          className="fixed inset-0 z-20 hidden bg-black opacity-50 peer-checked:block md:hidden"
        />
        
        {/* Mobile sidebar */}
        <aside className="fixed top-0 left-0 z-30 h-full w-64 transform -translate-x-full transition-transform duration-300 ease-in-out peer-checked:translate-x-0 md:hidden">
          <div className="flex flex-col h-full bg-white border-r border-gray-300">
            <div className="flex items-center justify-between flex-shrink-0 p-4">
              <h1 className="text-xl font-semibold text-black">
                FBA Dashboard
              </h1>
              <label
                htmlFor="sidebar-toggle"
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </label>
            </div>
          <SidebarNav menuItems={menuItems} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top header */}
          <header className="bg-white shadow-lg border-b border-gray-300">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <label
                  htmlFor="sidebar-toggle"
                  className="p-2 rounded-md hover:bg-gray-100 md:hidden"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </label>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="text-right">
                   <p className="text-sm font-medium text-black">
                     {clientSession.user.name}
                   </p>
                   <p className="text-xs text-black">
                     {clientSession.user.role}
                     {isPacker && " Station"}
                   </p>
                </div>
                 <div className="relative">
                  {isPacker ? (
                    <button
                      onClick={handlePackerLogout}
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Logout
                    </button>
                  ) : (
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Logout
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="py-6">
              <div className="px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}