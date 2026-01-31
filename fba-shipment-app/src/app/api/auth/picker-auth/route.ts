import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/users"

// Picker users with their emails and passwords
const PICKER_USERS = [
  { email: "picker-alpha@system.local", nickname: "Alpha", uuid: "f1eb2b00-90d4-4033-9c71-885fb7bf07da" },
  { email: "picker-beta@system.local", nickname: "Beta", uuid: "bdd1883a-c9f2-4c8e-8088-81c3e323753d" },
  { email: "picker-gamma@system.local", nickname: "Gamma", uuid: "b4e41c2a-5d68-49d9-8541-08dac2a47012" },
  { email: "picker-delta@system.local", nickname: "Delta", uuid: "4579ea58-dc4e-43eb-ad2e-35fbfaad27b2" },
  { email: "picker-epsilon@system.local", nickname: "Epsilon", uuid: "2fe31dda-cd38-40fd-9704-6615e814385d" },
  { email: "picker-zeta@system.local", nickname: "Zeta", uuid: "af7d724a-35bf-48c3-a893-6435490d9d1a" },
  { email: "picker-eta@system.local", nickname: "Eta", uuid: "4d5edb4d-9e53-42a1-b50a-7e114c2bcabf" },
  { email: "picker-theta@system.local", nickname: "Theta", uuid: "e1dad35b-bfe2-483c-90eb-360964494cc7" },
  { email: "picker-iota@system.local", nickname: "Iota", uuid: "eca9cda4-9bfa-4a93-af22-67ba2c12e5d4" },
  { email: "picker-kappa@system.local", nickname: "Kappa", uuid: "e99ce147-8ebb-4d76-92b4-1a4d9865a8fe" },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loginType, identifier, password } = body

    if (!loginType || !identifier || !password) {
      return NextResponse.json(
        { error: "Login type, identifier, and password are required" },
        { status: 400 }
      )
    }

    if (loginType === "picker") {
      // Handle picker login by UUID or nickname
      const pickerUser = PICKER_USERS.find(
        user => user.uuid === identifier || user.nickname.toLowerCase() === identifier.toLowerCase()
      )

      if (!pickerUser) {
        return NextResponse.json(
          { error: "Invalid UUID or nickname" },
          { status: 400 }
        )
      }

      // Verify picker password
      const user = await prisma.user.findUnique({
        where: { email: pickerUser.email }
      })

      if (!user) {
        return NextResponse.json(
          { error: "Picker user not found" },
          { status: 404 }
        )
      }

      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          uuid: pickerUser.uuid,
          nickname: pickerUser.nickname
        },
        redirectUrl: "/dashboard/picker"
      })

    } else {
      return NextResponse.json(
        { error: "Invalid login type" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Picker login error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      pickerUsers: PICKER_USERS.map(user => ({
        uuid: user.uuid,
        nickname: user.nickname,
        email: user.email
      })),
      defaultCredentials: {
        uuid: "f1eb2b00-90d4-4033-9c71-885fb7bf07da",
        nickname: "Alpha",
        password: "picker123"
      }
    })

  } catch (error) {
    console.error("Picker login info error:", error)
    return NextResponse.json(
      { error: "Failed to get picker info" },
      { status: 500 }
    )
  }
}