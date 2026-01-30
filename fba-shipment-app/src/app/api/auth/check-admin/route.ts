import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    })

    return NextResponse.json({ adminExists: !!adminExists })
  } catch (error) {
    console.error("Error checking admin existence:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}