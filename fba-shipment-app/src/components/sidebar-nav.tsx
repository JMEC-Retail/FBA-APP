'use client'

import Link from "next/link"


interface MenuItem {
  label: string
  href: string
  icon?: string
}

interface SidebarNavProps {
  menuItems: MenuItem[]
}

export function SidebarNav({ menuItems }: SidebarNavProps) {
  const closeSidebar = () => {
    const sidebar = document.getElementById('sidebar-toggle') as HTMLInputElement
    if (sidebar) sidebar.checked = false
  }

  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={closeSidebar}
        >
          <span className="mr-3 text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}