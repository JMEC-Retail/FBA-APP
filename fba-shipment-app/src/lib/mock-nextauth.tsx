'use client'

import { ReactNode } from 'react'
import { UserRole, AuthUser } from '@/lib/auth'

export interface Session {
  user: AuthUser
  expires: string
}

export interface SessionContextValue {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: (_data?: unknown) => Promise<Session | null>
}

const mockSession: Session = {
  user: {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    role: "ADMIN" as UserRole
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useSession(): SessionContextValue {
  return {
    data: mockSession,
    status: 'authenticated',
    update: async () => mockSession
  }
}