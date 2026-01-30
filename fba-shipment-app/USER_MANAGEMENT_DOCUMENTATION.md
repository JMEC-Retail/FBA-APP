# User Management Interface Documentation

## Overview
The User Management Interface provides comprehensive admin capabilities for managing user accounts in the FBA Shipment App. This feature is only accessible to users with the **ADMIN** role.

## Features

### 1. User Statistics Dashboard
- **Total Users**: Displays the total number of users in the system
- **Admins**: Shows count of admin users
- **Shippers**: Shows count of shipper users  
- **Packers**: Shows count of packer users

### 2. User Listing
- **Search**: Search users by name or email
- **Role Filter**: Filter users by role (Admin, Shipper, Packer)
- **Pagination**: Navigate through large user lists
- **Role Badges**: Visual indicators for user roles
- **User Actions**: View, Edit, and Delete operations

### 3. User Creation
- **Form Fields**: Name, Email, Password, Role
- **Validation**: Email format, password minimum length
- **Role Selection**: Dropdown with available roles
- **Audit Logging**: All user creation events are logged

### 4. User Management Operations

#### View User Details
- **User Information**: Name, email, role, creation date
- **Activity Summary**: Shipments count, audit logs count
- **Recent Shipments**: Last 5 shipments with status
- **Activity History**: Last 10 audit log entries
- **Quick Actions**: Edit role, reset password

#### Edit User Role
- **Role Update**: Change user role between Admin, Shipper, Packer
- **Audit Logging**: Role changes are logged with admin details
- **Security**: Admins cannot change their own role via this interface

#### Reset Password
- **Password Reset**: Admin can reset any user's password
- **Confirmation**: Password confirmation required
- **Audit Logging**: Password reset events are logged
- **Security**: New password must meet minimum requirements

#### Delete User
- **User Deletion**: Permanent removal of user accounts
- **Validation**: Prevents deletion of users with active shipments
- **Self-Protection**: Admins cannot delete their own account
- **Audit Logging**: User deletions are logged

## API Endpoints

### GET `/api/users/statistics`
**Purpose**: Get user statistics
**Access**: Admin only
**Response**: User count by role and total users

```json
{
  "totalUsers": 15,
  "adminCount": 2,
  "shipperCount": 5,
  "packerCount": 8,
  "recentUsers": 3,
  "roleDistribution": {
    "ADMIN": 2,
    "SHIPPER": 5,
    "PACKER": 8
  }
}
```

### GET `/api/users`
**Purpose**: Get paginated list of users
**Access**: Admin only
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Users per page (default: 10)
- `search`: Search term for name/email
- `role`: Filter by role

```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

### GET `/api/users/[userId]`
**Purpose**: Get detailed user information
**Access**: Admin only
**Response**: User details with shipments and audit logs

### POST `/api/users/create`
**Purpose**: Create new user
**Access**: Admin only
**Body**: User creation data

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "role": "PACKER"
}
```

### PUT `/api/users/[userId]`
**Purpose**: Update user (role or password)
**Access**: Admin only
**Body**: Update action and data

```json
{
  "action": "updateRole",
  "data": { "role": "ADMIN" }
}
```

or

```json
{
  "action": "resetPassword",
  "data": { "password": "newpassword" }
}
```

### DELETE `/api/users/[userId]`
**Purpose**: Delete user
**Access**: Admin only
**Restrictions**: Cannot delete users with active shipments or self

## Security Features

### Authentication & Authorization
- **Admin Only**: All user management endpoints require ADMIN role
- **Session Validation**: All operations validate admin session
- **Self-Protection**: Admins cannot delete or modify their own accounts

### Input Validation
- **Email Validation**: Proper email format required
- **Password Requirements**: Minimum 6 characters
- **Role Validation**: Only valid roles accepted
- **SQL Injection Prevention**: Using Prisma ORM with parameterized queries

### Audit Logging
- **Comprehensive Logging**: All user management actions are logged
- **User Context**: Logs include which admin performed the action
- **Action Details**: Detailed information about what was changed
- **Timestamp**: Precise timing of all operations

### Error Handling
- **User-Friendly Messages**: Clear error messages for common issues
- **Security Messages**: Generic messages for security-sensitive operations
- **Validation Errors**: Detailed feedback for form validation failures

## Database Schema

### User Model
```typescript
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  shipments     Shipment[]
  pickerLinks   PickerLink[]
  auditLogs     AuditLog[]
  notifications Notification[]
}
```

### AuditLog Model
```typescript
model AuditLog {
  id         String    @id @default(cuid())
  userId     String
  shipmentId String?
  action     String
  details    String?
  timestamp  DateTime  @default(now())
  
  // Relationships
  user     User      @relation(fields: [userId], references: [id])
  shipment Shipment? @relation(fields: [shipmentId], references: [id])
}
```

## Frontend Components

### Main Components
- **UsersPage**: Main user management interface
- **Statistics Cards**: Visual user statistics
- **User Table**: Paginated user listing
- **Filter Controls**: Search and role filtering
- **Modal Components**: Create, Edit, Password reset modals

### UI Components Used
- **Card**: Container components
- **Button**: Action buttons
- **Badge**: Role indicators
- **Input Forms**: User creation and editing

### State Management
- **React Hooks**: useState, useEffect, useCallback
- **Session Management**: NextAuth session data
- **Error State**: Centralized error handling
- **Loading States**: Visual loading indicators

## Responsive Design

### Mobile Support
- **Responsive Tables**: Horizontal scrolling on mobile
- **Adaptive Layout**: Flexbox-based responsive design
- **Touch-Friendly**: Appropriately sized buttons and inputs
- **Modal Optimization**: Full-screen modals on mobile devices

### Desktop Experience
- **Efficient Layout**: Multi-column layouts for statistics
- **Keyboard Navigation**: Full keyboard accessibility
- **Large Screen Optimization**: Maximum utilization of screen space

## Performance Considerations

### Database Optimization
- **Efficient Queries**: Optimized Prisma queries with selects
- **Pagination**: Limits data transferred per request
- **Indexing**: Proper database indexes for user lookups
- **Connection Pooling**: Prisma handles database connections

### Frontend Optimization
- **Component Memoization**: Efficient re-rendering
- **Debounced Search**: Reduces API calls during search
- **Lazy Loading**: User details loaded on demand
- **Error Boundaries**: Prevents cascading failures

## Testing Recommendations

### API Testing
- **Authentication Tests**: Verify admin-only access
- **Input Validation**: Test all validation scenarios
- **Error Handling**: Verify proper error responses
- **Audit Logging**: Confirm all actions are logged

### Frontend Testing
- **Component Rendering**: Verify all UI elements
- **User Interactions**: Test all buttons and forms
- **Responsive Design**: Test on various screen sizes
- **Error Display**: Verify error messages are shown

### Integration Testing
- **End-to-End Flows**: Test complete user management workflows
- **Permission Checks**: Verify role-based access control
- **Data Consistency**: Ensure database integrity
- **Performance**: Test with large user datasets

## Future Enhancements

### Potential Improvements
- **Bulk Operations**: Multi-select for batch user actions
- **User Groups**: Organize users into teams or groups
- **Advanced Search**: More sophisticated filtering options
- **User Profiles**: Extended user information and preferences
- **Activity Reports**: Detailed user activity analytics
- **Email Notifications**: Notify users of account changes
- **Two-Factor Authentication**: Enhanced security for admin accounts

### Scalability Considerations
- **User Archiving**: Soft delete for data retention
- **Role-Based Permissions**: More granular permission system
- **API Rate Limiting**: Prevent abuse of user management APIs
- **Background Jobs**: Async processing for bulk operations

## Deployment Notes

### Environment Variables
No additional environment variables required beyond the existing NextAuth and Prisma configuration.

### Database Migrations
The user management feature uses the existing User model. No schema changes are required.

### Security Headers
Ensure appropriate security headers are configured for production deployment.

### Monitoring
Monitor user management API endpoints for unusual activity and implement alerting for security events.

---

This comprehensive user management interface provides administrators with all the tools needed to effectively manage user accounts while maintaining security and auditability. The interface is designed to be intuitive, responsive, and performant even with large numbers of users.