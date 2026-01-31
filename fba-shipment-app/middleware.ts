import { auth as customAuth } from "./auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public paths that don't require authentication
const publicPaths = [
  "/auth/signin",
  "/auth/signup", 
  "/auth/packer-login",
  "/api/auth",
  "/api/picker-links",
  "/picker/", // Public picker access via UUID
  "/_next",
  "/favicon.ico",
]

// Simple cookie migration - for now, we'll clear old cookies and force re-login if needed
async function migrateSessionCookie(req: NextRequest): Promise<NextResponse | null> {
  const oldCookie = req.cookies.get("next-auth.session-token")
  const newCookie = req.cookies.get("authjs.session-token")

  // If old cookie exists but new one doesn't, clear the old one to avoid confusion
  if (oldCookie && !newCookie) {
    const response = NextResponse.next()
    response.cookies.delete("next-auth.session-token")
    return response
  }
  
  return null
}

export default async function middleware(req: NextRequest) {
  // Try cookie migration first
  const migrationResponse = await migrateSessionCookie(req)
  if (migrationResponse) {
    return migrationResponse
  }

  // Continue with custom middleware logic
  const { pathname } = req.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith("/")) {
      return pathname.startsWith(path)
    }
    return pathname === path
  })

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for picker access via UUID
  if (pathname.startsWith("/picker/") && pathname.split("/").length === 3) {
    return NextResponse.next()
  }

  try {
    // Get authentication session
    const session = await customAuth()

    if (!session?.user) {
      // Redirect to sign-in page for unauthenticated users
      const url = new URL("/auth/signin", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
}

    // Role-based access control
    const { role } = session.user
    const userRole = role as "ADMIN" | "SHIPPER" | "PACKER"

    // Define role-based path restrictions
    const rolePaths = {
      ADMIN: ["/dashboard"], // Admin can access everything
      SHIPPER: [
        "/dashboard",
        "/dashboard/upload",
        "/dashboard/shipments", 
        "/dashboard/picker-links",
        "/dashboard/reports"
      ],
      PACKER: [
        "/dashboard",
        "/dashboard/packer"
      ]
    }

    const allowedPaths = rolePaths[userRole] || []

    // Check if user has access to requested path
    const hasAccess = allowedPaths.some(path => 
      pathname === path || pathname.startsWith(path + "/")
    )

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      let redirectPath = "/dashboard"
      
      switch (userRole) {
        case "ADMIN":
          redirectPath = "/dashboard/users"
          break
        case "SHIPPER":
          redirectPath = "/dashboard/upload"
          break
        case "PACKER":
          redirectPath = "/dashboard"
          break
      }

      const url = new URL(redirectPath, req.url)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware auth error:", error)
    // Redirect to sign-in page on auth errors
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}