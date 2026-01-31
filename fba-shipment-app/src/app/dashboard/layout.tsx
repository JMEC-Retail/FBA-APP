import { getServerSession } from "@/auth"
import DashboardLayoutClient from "@/components/dashboard-layout-client"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Get server-side session (this will be fallback for non-PACKER users)
  const serverSession = await getServerSession()

  return (
    <DashboardLayoutClient session={serverSession}>
      {children}
    </DashboardLayoutClient>
  )
}