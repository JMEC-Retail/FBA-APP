import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { UserRole } from "@/lib/auth"
import Link from "next/link"
import { signOut } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import NotificationBell from "@/components/notification-bell"

interface DashboardLayoutProps {
  children: React.ReactNode
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

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  const menuItems = getRoleBasedMenu(session.user.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  FBA Dashboard
                </h1>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
          <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className="flex items-center justify-between flex-shrink-0 p-4">
              <h1 className="text-xl font-semibold text-gray-900">
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
          <header className="bg-white shadow-sm border-b border-gray-200">
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
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.role}
                  </p>
                </div>
                <div className="relative">
                  <form
                    action={async () => {
                      "use server"
                      await signOut({ redirectTo: "/auth/signin" })
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
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