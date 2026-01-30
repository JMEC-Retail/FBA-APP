'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/mock-nextauth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UserRole, AuthUser } from '@/lib/auth'
import SystemHealthCard from '@/components/system-health-card'

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
  defaultRole: UserRole
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

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('system')
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'FBA Shipment Manager',
    siteDescription: 'Manage FBA shipments efficiently',
    maintenanceMode: false,
    debugMode: false,
    maxFileSize: 10,
    sessionTimeout: 30,
    defaultTimezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
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
  })
  
  const [userManagementSettings, setUserManagementSettings] = useState<UserManagementSettings>({
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
  })
  
  const [databaseSettings, setDatabaseSettings] = useState<DatabaseSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    cleanupOldLogs: true,
    logRetentionDays: 90,
    cleanupOldNotifications: true,
    notificationRetentionDays: 30,
    maxDatabaseSize: 1000
  })
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enforceHttps: true,
    allowIframeEmbedding: false,
    csrfProtection: true,
    rateLimiting: true,
    maxRequestsPerMinute: 60,
    allowedOrigins: [],
    enableTwoFactorAuth: false,
    sessionTimeoutMinutes: 30,
    passwordExpirationDays: 90
  })
  
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
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
  })

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      
      // Update all settings with fetched data
      if (data.system) setSystemSettings(data.system)
      if (data.notifications) setNotificationSettings(data.notifications)
      if (data.users) setUserManagementSettings(data.users)
      if (data.database) setDatabaseSettings(data.database)
      if (data.security) setSecuritySettings(data.security)
      if (data.integrations) setIntegrationSettings(data.integrations)
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = async (category: string) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      let settingsData = {}
      switch (category) {
        case 'system':
          settingsData = systemSettings
          break
        case 'notifications':
          settingsData = notificationSettings
          break
        case 'users':
          settingsData = userManagementSettings
          break
        case 'database':
          settingsData = databaseSettings
          break
        case 'security':
          settingsData = securitySettings
          break
        case 'integrations':
          settingsData = integrationSettings
          break
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settings: settingsData })
      })
      if (!response.ok) throw new Error('Failed to save settings')
      
      setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async (category: string) => {
    if (!confirm(`Are you sure you want to reset ${category} settings to defaults?`)) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      // Reset to default values
      switch (category) {
        case 'system':
          setSystemSettings({
            siteName: 'FBA Shipment Manager',
            siteDescription: 'Manage FBA shipments efficiently',
            maintenanceMode: false,
            debugMode: false,
            maxFileSize: 10,
            sessionTimeout: 30,
            defaultTimezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
          })
          break
        case 'notifications':
          setNotificationSettings({
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
          })
          break
      }
      
      setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings reset to defaults`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  const testEmailSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-email', settings: notificationSettings })
      })
      if (!response.ok) throw new Error('Email test failed')
      
      setSuccess('Test email sent successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  if (!session?.user || (session.user as AuthUser).role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'database', label: 'Database', icon: '💾' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchSettings()}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* System Health Overview */}
        <SystemHealthCard />

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure basic system settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Site Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.siteName}
                  onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Timezone</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.defaultTimezone}
                  onChange={(e) => setSystemSettings({...systemSettings, defaultTimezone: e.target.value})}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.dateFormat}
                  onChange={(e) => setSystemSettings({...systemSettings, dateFormat: e.target.value})}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time Format</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.timeFormat}
                  onChange={(e) => setSystemSettings({...systemSettings, timeFormat: e.target.value})}
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Max File Size (MB)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.maxFileSize}
                  onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Site Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={systemSettings.siteDescription}
                onChange={(e) => setSystemSettings({...systemSettings, siteDescription: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                />
                <span className="text-sm">Maintenance Mode</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={systemSettings.debugMode}
                  onChange={(e) => setSystemSettings({...systemSettings, debugMode: e.target.checked})}
                />
                <span className="text-sm">Debug Mode</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('system')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('system')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure email and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Server</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpServer}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpServer: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Port</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpPort}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpPort: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpUsername}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpUsername: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpPassword}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpPassword: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">From Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpFromEmail}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpFromEmail: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">From Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={notificationSettings.smtpFromName}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smtpFromName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Notification Types</h3>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                />
                <span className="text-sm">Enable Email Notifications</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.smsNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                />
                <span className="text-sm">Enable SMS Notifications</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                />
                <span className="text-sm">Enable Push Notifications</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailOnShipmentCreated}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailOnShipmentCreated: e.target.checked})}
                />
                <span className="text-sm">Email on Shipment Created</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailOnShipmentUpdated}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailOnShipmentUpdated: e.target.checked})}
                />
                <span className="text-sm">Email on Shipment Updated</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailOnBoxCompleted}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailOnBoxCompleted: e.target.checked})}
                />
                <span className="text-sm">Email on Box Completed</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailOnUserCreated}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailOnUserCreated: e.target.checked})}
                />
                <span className="text-sm">Email on User Created</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={notificationSettings.emailOnSystemError}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailOnSystemError: e.target.checked})}
                />
                <span className="text-sm">Email on System Error</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('notifications')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={testEmailSettings} disabled={saving}>
                {saving ? 'Testing...' : 'Test Email'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('notifications')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* User Management Settings */}
        <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>User Management Settings</CardTitle>
            <CardDescription>
              Configure user registration, roles, and password policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userManagementSettings.defaultRole}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, defaultRole: e.target.value as UserRole})}
                >
                  <option value="PACKER">Packer</option>
                  <option value="SHIPPER">Shipper</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password Minimum Length</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userManagementSettings.passwordMinLength}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, passwordMinLength: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userManagementSettings.maxLoginAttempts}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, maxLoginAttempts: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Account Lockout Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userManagementSettings.accountLockoutDuration}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, accountLockoutDuration: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={userManagementSettings.sessionTimeoutMinutes}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, sessionTimeoutMinutes: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">User Registration</h3>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.allowUserRegistration}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, allowUserRegistration: e.target.checked})}
                />
                <span className="text-sm">Allow User Registration</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.requireEmailVerification}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, requireEmailVerification: e.target.checked})}
                />
                <span className="text-sm">Require Email Verification</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Password Requirements</h3>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.passwordRequireUppercase}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, passwordRequireUppercase: e.target.checked})}
                />
                <span className="text-sm">Require Uppercase Letters</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.passwordRequireLowercase}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, passwordRequireLowercase: e.target.checked})}
                />
                <span className="text-sm">Require Lowercase Letters</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.passwordRequireNumbers}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, passwordRequireNumbers: e.target.checked})}
                />
                <span className="text-sm">Require Numbers</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={userManagementSettings.passwordRequireSymbols}
                  onChange={(e) => setUserManagementSettings({...userManagementSettings, passwordRequireSymbols: e.target.checked})}
                />
                <span className="text-sm">Require Symbols</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('users')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('users')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database">
        <Card>
          <CardHeader>
            <CardTitle>Database Maintenance</CardTitle>
            <CardDescription>
              Configure backup, cleanup, and maintenance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={databaseSettings.backupFrequency}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Backup Retention (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={databaseSettings.backupRetention}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, backupRetention: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Log Retention (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={databaseSettings.logRetentionDays}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, logRetentionDays: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notification Retention (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={databaseSettings.notificationRetentionDays}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, notificationRetentionDays: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Max Database Size (MB)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={databaseSettings.maxDatabaseSize}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, maxDatabaseSize: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Maintenance Options</h3>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={databaseSettings.autoBackup}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, autoBackup: e.target.checked})}
                />
                <span className="text-sm">Automatic Backup</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={databaseSettings.cleanupOldLogs}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, cleanupOldLogs: e.target.checked})}
                />
                <span className="text-sm">Clean Up Old Logs</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={databaseSettings.cleanupOldNotifications}
                  onChange={(e) => setDatabaseSettings({...databaseSettings, cleanupOldNotifications: e.target.checked})}
                />
                <span className="text-sm">Clean Up Old Notifications</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('database')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('database')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security policies and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Requests Per Minute</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={securitySettings.maxRequestsPerMinute}
                  onChange={(e) => setSecuritySettings({...securitySettings, maxRequestsPerMinute: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password Expiration (days)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={securitySettings.passwordExpirationDays}
                  onChange={(e) => setSecuritySettings({...securitySettings, passwordExpirationDays: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Allowed Origins (one per line)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={securitySettings.allowedOrigins.join('\n')}
                onChange={(e) => setSecuritySettings({...securitySettings, allowedOrigins: e.target.value.split('\n').filter(url => url.trim())})}
                placeholder="https://example.com&#10;https://app.example.com"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Security Options</h3>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={securitySettings.enforceHttps}
                  onChange={(e) => setSecuritySettings({...securitySettings, enforceHttps: e.target.checked})}
                />
                <span className="text-sm">Enforce HTTPS</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={securitySettings.allowIframeEmbedding}
                  onChange={(e) => setSecuritySettings({...securitySettings, allowIframeEmbedding: e.target.checked})}
                />
                <span className="text-sm">Allow iFrame Embedding</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={securitySettings.csrfProtection}
                  onChange={(e) => setSecuritySettings({...securitySettings, csrfProtection: e.target.checked})}
                />
                <span className="text-sm">CSRF Protection</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={securitySettings.rateLimiting}
                  onChange={(e) => setSecuritySettings({...securitySettings, rateLimiting: e.target.checked})}
                />
                <span className="text-sm">Rate Limiting</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={securitySettings.enableTwoFactorAuth}
                  onChange={(e) => setSecuritySettings({...securitySettings, enableTwoFactorAuth: e.target.checked})}
                />
                <span className="text-sm">Enable Two-Factor Authentication</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('security')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('security')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations">
        <Card>
          <CardHeader>
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>
              Configure external API connections and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Amazon API</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Access Key ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.amazonAccessKeyId}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, amazonAccessKeyId: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Secret Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.amazonSecretKey}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, amazonSecretKey: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.amazonRegion}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, amazonRegion: e.target.value})}
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">EU West (Ireland)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  </select>
                </div>
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={integrationSettings.amazonApiEnabled}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, amazonApiEnabled: e.target.checked})}
                />
                <span className="text-sm">Enable Amazon API</span>
              </label>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Webhook Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.webhookUrl}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, webhookUrl: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.webhookSecret}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, webhookSecret: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">External API</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.externalApiUrl}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, externalApiUrl: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.externalApiKey}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, externalApiKey: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={integrationSettings.apiRateLimit}
                    onChange={(e) => setIntegrationSettings({...integrationSettings, apiRateLimit: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={integrationSettings.externalApiEnabled}
                  onChange={(e) => setIntegrationSettings({...integrationSettings, externalApiEnabled: e.target.checked})}
                />
                <span className="text-sm">Enable External API</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => saveSettings('integrations')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" onClick={() => resetSettings('integrations')} disabled={saving}>
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}