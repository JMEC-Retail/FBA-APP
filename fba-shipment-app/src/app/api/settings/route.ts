import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  debugMode: boolean
  maxFileSize: number
  sessionTimeout: number
  defaultTimezone: string
  dateFormat: string
  timeFormat: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  emailOnShipmentCreated: boolean
  emailOnShipmentUpdated: boolean
  emailOnBoxCompleted: boolean
  emailOnUserCreated: boolean
  emailOnSystemError: boolean
  smtpServer: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  smtpFromEmail: string
  smtpFromName: string
}

interface UserManagementSettings {
  defaultRole: "ADMIN" | "SHIPPER" | "PACKER"
  allowUserRegistration: boolean
  requireEmailVerification: boolean
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  maxLoginAttempts: number
  accountLockoutDuration: number
  sessionTimeoutMinutes: number
}

interface DatabaseSettings {
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupRetention: number
  cleanupOldLogs: boolean
  logRetentionDays: number
  cleanupOldNotifications: boolean
  notificationRetentionDays: number
  maxDatabaseSize: number
}

interface SecuritySettings {
  enforceHttps: boolean
  allowIframeEmbedding: boolean
  csrfProtection: boolean
  rateLimiting: boolean
  maxRequestsPerMinute: number
  allowedOrigins: string[]
  enableTwoFactorAuth: boolean
  sessionTimeoutMinutes: number
  passwordExpirationDays: number
}

interface IntegrationSettings {
  amazonApiEnabled: boolean
  amazonAccessKeyId: string
  amazonSecretKey: string
  amazonRegion: string
  webhookUrl: string
  webhookSecret: string
  apiRateLimit: number
  externalApiEnabled: boolean
  externalApiUrl: string
  externalApiKey: string
}

// Default settings
const defaultSystemSettings: SystemSettings = {
  siteName: 'FBA Shipment Manager',
  siteDescription: 'Manage FBA shipments efficiently',
  maintenanceMode: false,
  debugMode: false,
  maxFileSize: 10,
  sessionTimeout: 30,
  defaultTimezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h'
}

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  emailOnShipmentCreated: true,
  emailOnShipmentUpdated: true,
  emailOnBoxCompleted: true,
  emailOnUserCreated: false,
  emailOnSystemError: true,
  smtpServer: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpFromEmail: 'noreply@fbamanager.com',
  smtpFromName: 'FBA Manager'
}

const defaultUserManagementSettings: UserManagementSettings = {
  defaultRole: 'PACKER',
  allowUserRegistration: false,
  requireEmailVerification: true,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  maxLoginAttempts: 5,
  accountLockoutDuration: 15,
  sessionTimeoutMinutes: 30
}

const defaultDatabaseSettings: DatabaseSettings = {
  autoBackup: true,
  backupFrequency: 'daily',
  backupRetention: 30,
  cleanupOldLogs: true,
  logRetentionDays: 90,
  cleanupOldNotifications: true,
  notificationRetentionDays: 30,
  maxDatabaseSize: 1000
}

const defaultSecuritySettings: SecuritySettings = {
  enforceHttps: true,
  allowIframeEmbedding: false,
  csrfProtection: true,
  rateLimiting: true,
  maxRequestsPerMinute: 60,
  allowedOrigins: [],
  enableTwoFactorAuth: false,
  sessionTimeoutMinutes: 30,
  passwordExpirationDays: 90
}

const defaultIntegrationSettings: IntegrationSettings = {
  amazonApiEnabled: false,
  amazonAccessKeyId: '',
  amazonSecretKey: '',
  amazonRegion: 'us-east-1',
  webhookUrl: '',
  webhookSecret: '',
  apiRateLimit: 1000,
  externalApiEnabled: false,
  externalApiUrl: '',
  externalApiKey: ''
}

// In a real implementation, these would be stored in a database
let systemSettings = { ...defaultSystemSettings }
let notificationSettings = { ...defaultNotificationSettings }
let userManagementSettings = { ...defaultUserManagementSettings }
let databaseSettings = { ...defaultDatabaseSettings }
let securitySettings = { ...defaultSecuritySettings }
let integrationSettings = { ...defaultIntegrationSettings }

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let settings = {}
    
    switch (category) {
      case 'system':
        settings = systemSettings
        break
      case 'notifications':
        settings = notificationSettings
        break
      case 'users':
        settings = userManagementSettings
        break
      case 'database':
        settings = databaseSettings
        break
      case 'security':
        settings = securitySettings
        break
      case 'integrations':
        settings = integrationSettings
        break
      default:
        settings = {
          system: systemSettings,
          notifications: notificationSettings,
          users: userManagementSettings,
          database: databaseSettings,
          security: securitySettings,
          integrations: integrationSettings
        }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { category, settings } = body

    if (!category || !settings) {
      return NextResponse.json(
        { error: 'Category and settings are required' },
        { status: 400 }
      )
    }

    // Validate settings based on category
    switch (category) {
      case 'system':
        if (!isValidSystemSettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid system settings' },
            { status: 400 }
          )
        }
        systemSettings = { ...settings }
        break
        
      case 'notifications':
        if (!isValidNotificationSettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid notification settings' },
            { status: 400 }
          )
        }
        notificationSettings = { ...settings }
        break
        
      case 'users':
        if (!isValidUserManagementSettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid user management settings' },
            { status: 400 }
          )
        }
        userManagementSettings = { ...settings }
        break
        
      case 'database':
        if (!isValidDatabaseSettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid database settings' },
            { status: 400 }
          )
        }
        databaseSettings = { ...settings }
        break
        
      case 'security':
        if (!isValidSecuritySettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid security settings' },
            { status: 400 }
          )
        }
        securitySettings = { ...settings }
        break
        
      case 'integrations':
        if (!isValidIntegrationSettings(settings)) {
          return NextResponse.json(
            { error: 'Invalid integration settings' },
            { status: 400 }
          )
        }
        integrationSettings = { ...settings }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
    }

    return NextResponse.json({ message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'test-email':
        // In a real implementation, this would send a test email
        // For now, just simulate the test
        await new Promise(resolve => setTimeout(resolve, 1000))
        return NextResponse.json({ message: 'Test email sent successfully' })
        
      case 'backup-database':
        // In a real implementation, this would trigger a database backup
        await new Promise(resolve => setTimeout(resolve, 2000))
        return NextResponse.json({ message: 'Database backup initiated successfully' })
        
      case 'cleanup-logs':
        // In a real implementation, this would clean up old logs
        await new Promise(resolve => setTimeout(resolve, 1500))
        return NextResponse.json({ message: 'Log cleanup completed successfully' })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validation functions
function isValidSystemSettings(settings: unknown): settings is SystemSettings {
  const s = settings as Record<string, unknown>
  return typeof s.siteName === 'string' &&
         typeof s.siteDescription === 'string' &&
         typeof s.maintenanceMode === 'boolean' &&
         typeof s.debugMode === 'boolean' &&
         typeof s.maxFileSize === 'number' &&
         typeof s.sessionTimeout === 'number' &&
         typeof s.defaultTimezone === 'string' &&
         typeof s.dateFormat === 'string' &&
         typeof s.timeFormat === 'string'
}

function isValidNotificationSettings(settings: unknown): settings is NotificationSettings {
  const s = settings as Record<string, unknown>
  return typeof s.emailNotifications === 'boolean' &&
         typeof s.smsNotifications === 'boolean' &&
         typeof s.pushNotifications === 'boolean' &&
         typeof s.emailOnShipmentCreated === 'boolean' &&
         typeof s.emailOnShipmentUpdated === 'boolean' &&
         typeof s.emailOnBoxCompleted === 'boolean' &&
         typeof s.emailOnUserCreated === 'boolean' &&
         typeof s.emailOnSystemError === 'boolean' &&
         typeof s.smtpServer === 'string' &&
         typeof s.smtpPort === 'number' &&
         typeof s.smtpUsername === 'string' &&
         typeof s.smtpPassword === 'string' &&
         typeof s.smtpFromEmail === 'string' &&
         typeof s.smtpFromName === 'string'
}

function isValidUserManagementSettings(settings: unknown): settings is UserManagementSettings {
  const s = settings as Record<string, unknown>
  return (s.defaultRole === 'ADMIN' || s.defaultRole === 'SHIPPER' || s.defaultRole === 'PACKER') &&
         typeof s.allowUserRegistration === 'boolean' &&
         typeof s.requireEmailVerification === 'boolean' &&
         typeof s.passwordMinLength === 'number' &&
         typeof s.passwordRequireUppercase === 'boolean' &&
         typeof s.passwordRequireLowercase === 'boolean' &&
         typeof s.passwordRequireNumbers === 'boolean' &&
         typeof s.passwordRequireSymbols === 'boolean' &&
         typeof s.maxLoginAttempts === 'number' &&
         typeof s.accountLockoutDuration === 'number' &&
         typeof s.sessionTimeoutMinutes === 'number'
}

function isValidDatabaseSettings(settings: unknown): settings is DatabaseSettings {
  const s = settings as Record<string, unknown>
  return typeof s.autoBackup === 'boolean' &&
         (s.backupFrequency === 'daily' || s.backupFrequency === 'weekly' || s.backupFrequency === 'monthly') &&
         typeof s.backupRetention === 'number' &&
         typeof s.cleanupOldLogs === 'boolean' &&
         typeof s.logRetentionDays === 'number' &&
         typeof s.cleanupOldNotifications === 'boolean' &&
         typeof s.notificationRetentionDays === 'number' &&
         typeof s.maxDatabaseSize === 'number'
}

function isValidSecuritySettings(settings: unknown): settings is SecuritySettings {
  const s = settings as Record<string, unknown>
  return typeof s.enforceHttps === 'boolean' &&
         typeof s.allowIframeEmbedding === 'boolean' &&
         typeof s.csrfProtection === 'boolean' &&
         typeof s.rateLimiting === 'boolean' &&
         typeof s.maxRequestsPerMinute === 'number' &&
         Array.isArray(s.allowedOrigins) &&
         s.allowedOrigins.every((origin: unknown) => typeof origin === 'string') &&
         typeof s.enableTwoFactorAuth === 'boolean' &&
         typeof s.sessionTimeoutMinutes === 'number' &&
         typeof s.passwordExpirationDays === 'number'
}

function isValidIntegrationSettings(settings: unknown): settings is IntegrationSettings {
  const s = settings as Record<string, unknown>
  return typeof s.amazonApiEnabled === 'boolean' &&
         typeof s.amazonAccessKeyId === 'string' &&
         typeof s.amazonSecretKey === 'string' &&
         typeof s.amazonRegion === 'string' &&
         typeof s.webhookUrl === 'string' &&
         typeof s.webhookSecret === 'string' &&
         typeof s.apiRateLimit === 'number' &&
         typeof s.externalApiEnabled === 'boolean' &&
         typeof s.externalApiUrl === 'string' &&
         typeof s.externalApiKey === 'string'
}