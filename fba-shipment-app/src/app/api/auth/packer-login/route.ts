import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@/auth"

// Mock PACKER authentication for stations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stationId, role } = body

    // Validate role
    if (role !== "PACKER") {
      return NextResponse.json(
        { error: "Invalid role for PACKER login" },
        { status: 400 }
      )
    }

    // Available stations (in real app, this would come from database)
    const availableStations = [
      { id: "PACKER001", name: "Main Packing Station 1", status: "online" },
      { id: "PACKER002", name: "Main Packing Station 2", status: "online" },
      { id: "PACKER003", name: "Secondary Packing Station 1", status: "online" },
      { id: "PACKER004", name: "Secondary Packing Station 2", status: "offline" },
      { id: "PACKER005", name: "Overflow Packing Station", status: "online" },
    ]

    // Validate station
    const station = availableStations.find(s => s.id === stationId)
    if (!station) {
      return NextResponse.json(
        { error: "Invalid Station ID" },
        { status: 400 }
      )
    }

    if (station.status === "offline") {
      return NextResponse.json(
        { error: `Station ${stationId} is currently offline` },
        { status: 400 }
      )
    }

    // Create PACKER session
    const sessionData = {
      user: {
        id: `packer-${stationId}`,
        email: `${stationId.toLowerCase()}@packing.station`,
        name: `Packer ${stationId}`,
        role: "PACKER" as UserRole,
        stationId: stationId,
        stationName: station.name,
        loginTime: new Date().toISOString(),
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    // Log the login attempt (in real app, would use audit logging)
    console.log(`PACKER login: Station ${stationId} logged in at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      user: sessionData.user,
      redirectUrl: "/dashboard"
    })

  } catch (error) {
    console.error("PACKER auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}

// GET endpoint to check station availability
export async function GET() {
  try {
    const availableStations = [
      { id: "PACKER001", name: "Main Packing Station 1", status: "online" },
      { id: "PACKER002", name: "Main Packing Station 2", status: "online" },
      { id: "PACKER003", name: "Secondary Packing Station 1", status: "online" },
      { id: "PACKER004", name: "Secondary Packing Station 2", status: "offline" },
      { id: "PACKER005", name: "Overflow Packing Station", status: "online" },
    ]

    return NextResponse.json({
      stations: availableStations,
      defaultCredentials: {
        stationId: "PACKER001",
        role: "PACKER"
      }
    })

  } catch (error) {
    console.error("Station status check error:", error)
    return NextResponse.json(
      { error: "Failed to check station status" },
      { status: 500 }
    )
  }
}