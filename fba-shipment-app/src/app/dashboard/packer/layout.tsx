import { redirect } from "next/navigation"

interface PackerLayoutProps {
  children: React.ReactNode
}

// This layout is specifically for PACKER users
export default function PackerLayout({ children }: PackerLayoutProps) {
  // PACKER layout uses a simplified structure - no complex sidebar needed
  // The PACKER page handles its own navigation and layout
  
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}