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

// Mock auth function for now
export const auth = async () => {
  return {
    user: {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      role: "ADMIN" as UserRole
    }
  } as { user: AuthUser }
}

export const signIn = async (_options?: unknown) => {}
export const signOut = async (_options?: unknown) => {}

// Mock handlers for NextAuth route
export const handlers = {
  GET: async (_request: Request, _context: unknown) => new Response("OK"),
  POST: async (_request: Request, _context: unknown) => new Response("OK")
}