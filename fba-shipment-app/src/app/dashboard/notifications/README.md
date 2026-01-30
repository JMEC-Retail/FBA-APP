# Notification Center

A comprehensive notification management system that provides real-time updates and user preferences for the FBA Shipment App.

## Features

### 1. Centralized Notification Management
- **Single Hub**: All notifications in one place
- **Real-time Updates**: Automatic refresh every 30 seconds
- **Multi-role Access**: Available to ADMIN, SHIPPER, and PACKER roles

### 2. Advanced Filtering
- **Search**: Filter by title and message content
- **Type Filtering**: Filter by notification types:
  - Box Concluded ✅
  - Shipment Completed 📦
  - Shipment Cancelled ❌
  - Picker Assigned 👤
  - System Announcement 📢
- **Date Range**: Filter by today, this week, or this month
- **Read Status**: View all or only unread notifications

### 3. Bulk Actions
- **Mark All as Read**: Clear all unread notifications at once
- **Delete Old Notifications**: Clean up notifications older than 30 days (Admin only)

### 4. Notification Preferences
- **Per-type Settings**: Configure notifications for each type
- **Delivery Methods**: Enable/disable email and real-time notifications
- **User Control**: Users can customize their notification experience

### 5. Responsive Design
- **Mobile Friendly**: Works on all screen sizes
- **Accessible**: Follows WCAG guidelines
- **Fast**: Optimized for performance with pagination

## API Endpoints

### GET /api/notifications
Fetch user notifications with filtering and pagination.

**Query Parameters:**
- `unreadOnly`: boolean - Filter unread notifications only
- `limit`: number - Number of notifications per page (default: 50)
- `page`: number - Page number (default: 1)
- `search`: string - Search in title and message
- `type`: string - Filter by notification type
- `dateFilter`: string - Filter by date range (today, week, month)

**Response:**
```json
{
  "notifications": [...],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

### GET /api/notifications/unread-count
Get the count of unread notifications for the current user.

**Response:**
```json
{
  "count": 5
}
```

### POST /api/notifications/mark-all-read
Mark all notifications as read for the current user.

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

### PATCH /api/notifications/[notificationId]
Mark a specific notification as read.

**Request Body:**
```json
{
  "markAsRead": true
}
```

### GET /api/notifications/settings
Get user notification preferences.

**Response:**
```json
{
  "settings": {
    "BOX_CONCLUDED": {
      "enabled": true,
      "emailEnabled": true,
      "realTimeEnabled": true
    },
    ...
  }
}
```

### PATCH /api/notifications/settings
Update user notification preferences.

**Request Body:**
```json
{
  "type": "BOX_CONCLUDED",
  "settings": {
    "emailEnabled": false
  }
}
```

### DELETE /api/notifications/cleanup
Delete old notifications (Admin only).

**Response:**
```json
{
  "message": "Old notifications deleted successfully"
}
```

## Integration

### Navigation
The notification center is integrated into the dashboard sidebar for all user roles:
- ADMIN: Users → Shipments → Reports → **Notifications** → Settings
- SHIPPER: Shipments → Upload CSV → Create Picker Links → **Notifications**
- PACKER: View Shipments → Manage Boxes → Reports → **Notifications**

### Real-time Updates
- **Header Badge**: Shows unread count in the top navigation
- **Auto-refresh**: Updates every 30 seconds
- **Instant Feedback**: Actions are reflected immediately

### Database Schema
Uses the following Prisma models:
- `Notification`: Stores individual notifications
- `NotificationSetting`: Stores user preferences
- `User`: Linked to both models

## Usage Examples

### Mark All Notifications as Read
```javascript
const response = await fetch('/api/notifications/mark-all-read', {
  method: 'POST'
})
```

### Fetch Filtered Notifications
```javascript
const params = new URLSearchParams({
  unreadOnly: 'true',
  limit: '20',
  type: 'BOX_CONCLUDED',
  dateFilter: 'week'
})

const response = await fetch(`/api/notifications?${params}`)
```

### Update Notification Settings
```javascript
const response = await fetch('/api/notifications/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'SHIPMENT_COMPLETED',
    settings: { emailEnabled: false }
  })
})
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── notifications/
│   │       ├── route.ts              # Main notifications endpoint
│   │       ├── settings/
│   │       │   └── route.ts         # Settings management
│   │       ├── unread-count/
│   │       │   └── route.ts         # Unread count endpoint
│   │       └── cleanup/
│   │           └── route.ts         # Cleanup endpoint
│   └── dashboard/
│       └── notifications/
│           └── page.tsx             # Main notification center UI
├── components/
│   ├── notification-bell.tsx        # Header notification indicator
│   └── notification-manager.tsx     # Existing notification component
└── lib/
    └── notifications.ts              # Core notification system
```

## Security

- **Authentication**: All endpoints require authenticated users
- **Authorization**: Admin-only actions are protected
- **User Isolation**: Users can only access their own notifications
- **Input Validation**: All inputs are validated server-side

## Performance

- **Pagination**: Limits database queries to reasonable sizes
- **Indexing**: Database tables are properly indexed
- **Caching**: Unread counts are cached client-side
- **Lazy Loading**: Notifications load on-demand

## Future Enhancements

- **Push Notifications**: Browser push notifications
- **Email Templates**: Customizable email templates
- **Notification Scheduling**: Schedule notifications for specific times
- **Analytics**: Notification engagement metrics
- **Webhooks**: External system integration