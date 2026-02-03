"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardSkeleton, AdminDashboard, ShipperDashboard } from "./dashboard-components"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Check for PACKER session first
    if (typeof window !== "undefined") {
      const packerSession = sessionStorage.getItem("packer-session")
      if (packerSession) {
        const parsedSession = JSON.parse(packerSession)
        // Check if session is still valid
        if (new Date(parsedSession.expires) > new Date()) {
          // Redirect PACKER users to specialized dashboard
          router.replace("/dashboard/packer")
          return
        }
      }
    }

    // Handle unauthenticated state
    if (status === "unauthenticated") {
      // No session found, redirect based on context
      if (typeof window !== "undefined") {
        const hasPackerSession = sessionStorage.getItem("packer-session")
        window.location.href = hasPackerSession ? "/auth/packer-login" : "/auth/signin"
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return <DashboardSkeleton />
  }

  if (!session || !session.user) {
    return <DashboardSkeleton />
  }

  // Additional validation for user.id
  if (!session.user.id) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Session error: User ID not found</p>
      </div>
    )
  }

  // Only show ADMIN and SHIPPER dashboards here
  return (
    session.user.role === "ADMIN" ? <AdminDashboard sessionUserId={session.user.id} /> :
    session.user.role === "SHIPPER" ? <ShipperDashboard sessionUserId={session.user.id} /> :
    <DashboardSkeleton />
  )
}