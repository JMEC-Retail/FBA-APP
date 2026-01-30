# Admin Settings Page

A comprehensive administrative settings page for configuring the FBA Shipment Management system.

## Features

### 🎛️ System Configuration
- **Site Settings**: Configure site name, description, and basic appearance
- **Time & Date**: Set timezone, date format, and time format preferences
- **File Uploads**: Configure maximum file size limits
- **Session Management**: Set session timeout duration
- **Maintenance Mode**: Toggle maintenance and debug modes

### 🔔 Notification Settings
- **Email Configuration**: Full SMTP server setup with authentication
- **Notification Types**: Fine-grained control over email, SMS, and push notifications
- **Event Triggers**: Configure notifications for shipments, users, and system events
- **Email Testing**: Test email configuration directly from the interface

### 👥 User Management
- **Default Roles**: Set default user role for new registrations
- **Registration Control**: Enable/disable user registration
- **Password Policies**: Enforce complex password requirements
- **Security Settings**: Configure login attempts and account lockout
- **Session Control**: Manage user session timeouts

### 💾 Database Maintenance
- **Automated Backups**: Configure backup frequency and retention
- **Log Cleanup**: Automatic cleanup of old audit logs
- **Notification Cleanup**: Manage notification retention periods
- **Storage Monitoring**: Monitor database size and usage
- **Maintenance Tasks**: One-click maintenance operations

### 🔒 Security Settings
- **HTTPS Enforcement**: Force secure connections
- **CSRF Protection**: Enable cross-site request forgery protection
- **Rate Limiting**: Configure API rate limits
- **CORS Settings**: Manage allowed origins
- **Two-Factor Auth**: Enable/disable 2FA
- **Password Expiration**: Set password aging policies

### 🔗 Integrations
- **Amazon API**: Configure Amazon FBA API credentials and regions
- **Webhooks**: Set up webhook URLs and secrets
- **External APIs**: Configure third-party API connections
- **Rate Limits**: Set API call rate limits

### 📊 System Health Dashboard
- **Real-time Monitoring**: Live service status indicators
- **Performance Metrics**: Response times, error rates, uptime
- **Resource Usage**: Memory, disk space, database size
- **Quick Actions**: Common administrative tasks
- **Auto-refresh**: Automatic health status updates

## Technical Implementation

### File Structure
```
src/app/dashboard/settings/
├── page.tsx                 # Main settings page component
└── API integration

src/app/api/settings/
├── route.ts                # Settings API endpoints (GET, PUT, POST)
└── validation and management

src/components/
├── ui/
│   ├── tabs.tsx           # Reusable tabs component
│   ├── card.tsx           # Card layout component
│   └── button.tsx         # Button component
└── system-health-card.tsx # System health dashboard
```

### API Endpoints

#### GET /api/settings
Fetches all settings or specific category settings.
- **Query Parameters**: `category` (optional) - system, notifications, users, database, security, integrations
- **Response**: Settings object for the requested category
- **Authorization**: Admin role required

#### PUT /api/settings
Updates settings for a specific category.
- **Body**: `{ category: string, settings: object }`
- **Response**: Success message
- **Authorization**: Admin role required

#### POST /api/settings
Performs administrative actions.
- **Body**: `{ action: string, ...params }`
- **Actions**: `test-email`, `backup-database`, `cleanup-logs`
- **Authorization**: Admin role required

### Security Features
- **Role-Based Access**: Only ADMIN role can access settings
- **Input Validation**: Server-side validation for all settings
- **TypeScript Safety**: Full TypeScript integration with type checking
- **Error Handling**: Comprehensive error handling with user feedback
- **Secure Storage**: Sensitive data handling with appropriate masking

### UI/UX Features
- **Responsive Design**: Mobile-friendly interface
- **Tab Navigation**: Organized settings categories
- **Real-time Feedback**: Loading states and success/error messages
- **Form Validation**: Client-side validation with server-side verification
- **Accessibility**: WCAG compliant design patterns

## Usage Examples

### Basic Settings Access
1. Navigate to `/dashboard/settings`
2. Use tab navigation to access different setting categories
3. Modify settings and save changes
4. Reset to defaults if needed

### Email Configuration
1. Go to Notifications tab
2. Configure SMTP server details
3. Test email configuration
4. Enable/disable specific notification types

### Security Configuration
1. Access Security tab
2. Configure password policies
3. Set rate limiting parameters
4. Manage CORS origins

### System Health Monitoring
1. View real-time service status
2. Monitor performance metrics
3. Perform quick maintenance tasks
4. Auto-refresh status every 5 minutes

## Development Notes

### State Management
- Uses React hooks for local state management
- API integration through fetch with proper error handling
- Loading states for all async operations

### Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Type checking with TypeScript interfaces

### Performance
- Debounced form inputs to reduce API calls
- Lazy loading of settings data
- Optimized re-renders with proper dependencies

### Accessibility
- Semantic HTML5 structure
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader compatibility

## Future Enhancements

### Planned Features
- [ ] Settings change audit log
- [ ] Bulk configuration import/export
- [ ] Advanced monitoring and alerting
- [ ] Multi-language support
- [ ] Theme customization
- [ ] Advanced backup scheduling
- [ ] API key rotation management

### Integrations
- [ ] Third-party monitoring services
- [ ] Cloud storage providers
- [ ] Advanced email providers
- [ ] Security scanning services

## Troubleshooting

### Common Issues
1. **Access Denied**: Ensure user has ADMIN role
2. **Save Failed**: Check network connection and validation errors
3. **Email Test Failed**: Verify SMTP configuration and credentials
4. **Performance Issues**: Check system health metrics

### Debug Information
- Browser console logs for JavaScript errors
- Network tab for API request/response details
- Server logs for backend issues
- Health dashboard for system status

## Dependencies

### External Libraries
- `react-hook-form`: Form handling and validation
- `@radix-ui/react-slot`: Component composition
- `class-variance-authority`: Component variants
- `tailwindcss`: Styling framework
- `lucide-react`: Icon library

### Internal Components
- Uses existing UI components from `/components/ui/`
- Integrates with existing authentication system
- Follows established project patterns