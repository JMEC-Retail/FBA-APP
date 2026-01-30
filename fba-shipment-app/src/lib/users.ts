import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import { logAuditInfo } from './audit'

const SALT_ROUNDS = 12

/**
 * Creates a new user with a hashed password
 * @param email - User's email address
 * @param name - User's name
 * @param password - Plain text password
 * @param role - User role (ADMIN, SHIPPER, PACKER)
 * @returns Promise that resolves to the created user object
 * @throws Error if user creation fails
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole
) {
  try {
    const hashedPassword = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }
    throw new Error('Failed to create user: Unknown error')
  }
}

/**
 * Retrieves a user by their email address
 * @param email - User's email address
 * @returns Promise that resolves to the user object or null if not found
 */
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user by email: ${error.message}`)
    }
    throw new Error('Failed to get user by email: Unknown error')
  }
}

/**
 * Verifies a password against its hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise that resolves to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to verify password: ${error.message}`)
    }
    throw new Error('Failed to verify password: Unknown error')
  }
}

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to hash password: ${error.message}`)
    }
    throw new Error('Failed to hash password: Unknown error')
  }
}

/**
 * Creates a default admin user if no admin users exist
 * @param adminEmail - Default admin email address
 * @param adminPassword - Default admin password
 * @param adminName - Default admin name
 * @returns Promise that resolves to the created admin user or existing admin
 */
export async function createDefaultAdmin(
  adminEmail: string,
  adminPassword: string,
  adminName: string = 'Default Admin'
) {
  try {
    // Check if any admin users exist
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      return existingAdmin
    }

    // Create default admin user
    const adminUser = await createUser(adminEmail, adminName, adminPassword, 'ADMIN')
    
    return adminUser
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create default admin: ${error.message}`)
    }
    throw new Error('Failed to create default admin: Unknown error')
  }
}

/**
 * Retrieves all users with optional pagination and filtering
 * @param page - Page number (default: 1)
 * @param limit - Number of users per page (default: 10)
 * @param search - Search term for email or name
 * @param role - Filter by role
 * @param status - Filter by active status
 * @returns Promise that resolves to paginated users and metadata
 */
export async function getUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: UserRole,
  _status?: 'active' | 'inactive'
) {
  try {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    // Note: You might want to add an 'active' field to your User model
    // For now, we'll consider all users as active

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
  _count: {
    select: {
      shipments: true,
      auditLogs: true
    }
  }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users: ${error.message}`)
    }
    throw new Error('Failed to get users: Unknown error')
  }
}

/**
 * Retrieves a user by their ID
 * @param userId - User's ID
 * @returns Promise that resolves to the user object or null if not found
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        shipments: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            details: true,
            timestamp: true,
            shipment: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        _count: {
          select: {
            shipments: true,
            auditLogs: true
          }
        }
      }
    })
    
    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user by ID: ${error.message}`)
    }
    throw new Error('Failed to get user by ID: Unknown error')
  }
}

/**
 * Updates a user's role
 * @param userId - User's ID
 * @param role - New role
 * @param adminId - ID of the admin making the change
 * @returns Promise that resolves to the updated user object
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
  adminId: string
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    await logAuditInfo(
      'USER_ROLE_UPDATED',
      { userId: adminId },
      `Updated role for user ${user.email} to ${role}`
    )

    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update user role: ${error.message}`)
    }
    throw new Error('Failed to update user role: Unknown error')
  }
}

/**
 * Resets a user's password
 * @param userId - User's ID
 * @param newPassword - New plain text password
 * @param adminId - ID of the admin making the change
 * @returns Promise that resolves to the updated user object
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  adminId: string
) {
  try {
    const hashedPassword = await hashPassword(newPassword)
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    await logAuditInfo(
      'USER_PASSWORD_RESET',
      { userId: adminId },
      `Password reset for user ${user.email}`
    )

    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reset user password: ${error.message}`)
    }
    throw new Error('Failed to reset user password: Unknown error')
  }
}

/**
 * Deletes a user (soft delete by marking as inactive if you add an active field)
 * @param userId - User's ID
 * @param adminId - ID of the admin making the change
 * @returns Promise that resolves to the deleted user object
 */
export async function deleteUser(
  userId: string,
  adminId: string
) {
  try {
    // Check if user has active shipments
    const activeShipments = await prisma.shipment.count({
      where: {
        shipperId: userId,
        status: 'ACTIVE'
      }
    })

    if (activeShipments > 0) {
      throw new Error('Cannot delete user with active shipments')
    }

    const user = await prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    await logAuditInfo(
      'USER_DELETED',
      { userId: adminId },
      `Deleted user ${user.email}`
    )

    return user
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
    throw new Error('Failed to delete user: Unknown error')
  }
}

/**
 * Gets user statistics
 * @returns Promise that resolves to user statistics
 */
export async function getUserStatistics() {
  try {
    const [
      totalUsers,
      adminCount,
      shipperCount,
      packerCount,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SHIPPER' } }),
      prisma.user.count({ where: { role: 'PACKER' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    return {
      totalUsers,
      adminCount,
      shipperCount,
      packerCount,
      recentUsers,
      roleDistribution: {
        ADMIN: adminCount,
        SHIPPER: shipperCount,
        PACKER: packerCount
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user statistics: ${error.message}`)
    }
    throw new Error('Failed to get user statistics: Unknown error')
  }
}