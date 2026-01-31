import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserById, updateUserRole, resetUserPassword, deleteUser } from '@/lib/users'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const user = await getUserById(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const body = await request.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'updateRole':
        if (!data.role || !Object.values(UserRole).includes(data.role as UserRole)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          )
        }
        result = await updateUserRole(userId, data.role as UserRole, session.user.id)
        break

      case 'resetPassword':
        if (!data.password || data.password.length < 6) {
          return NextResponse.json(
            { error: 'Password must be at least 6 characters long' },
            { status: 400 }
          )
        }
        result = await resetUserPassword(userId, data.password, session.user.id)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error updating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const result = await deleteUser(userId, session.user.id)
    
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}