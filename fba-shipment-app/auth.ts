import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./src/lib/prisma"
import { verifyPassword } from "./src/lib/users"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "SHIPPER" | "PACKER"
    } & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role: "ADMIN" | "SHIPPER" | "PACKER"
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: "ADMIN" | "SHIPPER" | "PACKER"
  }
}

export type UserRole = "ADMIN" | "SHIPPER" | "PACKER"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AuthSession {
  user: AuthUser
}

// Client-side only function - checks PACKER sessionStorage
export const getClientSession = async (): Promise<{ user: AuthUser } | null> => {
  if (typeof window !== "undefined") {
    try {
      const packerSession = sessionStorage.getItem("packer-session")
      if (packerSession) {
        const session = JSON.parse(packerSession)
        // Check if session is Still valid
        if (new Date(session.expires) > new Date()) {
          return {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              role: session.user.role as UserRole
            }
          }
        } else {
          // Session expired, remove it
          sessionStorage.removeItem("packer-session")
        }
      }
    } catch (error) {
      console.error("Error parsing PACKER session:", error)
    }
  }
  return null
}

// Server-side only function - checks NextAuth session
export const getServerSession = async (): Promise<{ user: AuthUser } | null> => {
  try {
    const session = await nextAuthSession()
    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name!,
          role: session.user.role as UserRole
        }
      }
    }
  } catch (error) {
    console.error("Error checking NextAuth session:", error)
  }
  return null
}

// Smart auth function that adapts to context
export const getSession = async (): Promise<{ user: AuthUser } | null> => {
  if (typeof window !== "undefined") {
    // Client context - only check sessionStorage
    return getClientSession()
  } else {
    // Server context - only check NextAuth
    return getServerSession()
  }
}

const nextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error("Error in credentials authorize:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  trustHost: true
}

export const { handlers, signIn, signOut, auth: nextAuthSession } = NextAuth(nextAuthConfig)
export const auth = getSession