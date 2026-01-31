# PACKER Dashboard

A specialized dashboard interface designed for PACKER (packaging station) users in the FBA Shipment Management System.

## Features

### 📊 Real-time Statistics
- **Active Assignments**: Number of current picker links assigned to this packer
- **Open Boxes**: Boxes currently being worked on
- **Total Packed**: Lifetime boxes packed by this packer
- **Items Remaining**: Total items left to pick across all assignments
- **Today's Progress**: Boxes packed today
- **Average Time**: Average time per box (in minutes)

### 🔗 Active Assignments
- View all active picker links assigned to this packer
- Real-time completion percentage for each shipment
- Quick access button to start picking for each assignment
- Progress tracking with visual indicators
- Item and box counts for each shipment

### 📦 Recent Activity
- Shows the 10 most recent box activities
- Tracks box status changes
- Links to related shipments

### ⚡ Quick Actions
- **Manage Boxes**: Navigate to box management interface
- **View Shipments**: Access assigned shipments
- **Reports**: View performance reports
- **Refresh**: Update dashboard data

### 🏪 Station Information
- Display current station ID and name
- Shows logged-in operator information
- Session login time tracking

## Navigation

The PACKER dashboard provides streamlined navigation optimized for warehouse workflow:

1. **Direct Picker Access**: Click "Access" on any active assignment to start picking
2. **Box Management**: Quick access to current and recent boxes
3. **Performance Tracking**: Built-in statistics and progress monitoring
4. **Station Management**: Station and operator information display

## Authentication

- Uses PACKER-specific authentication via station ID
- Session management with 24-hour expiration
- Automatic logout on session expiry
- Quick login with default station credentials

## Responsive Design

- **Mobile Optimized**: Works on tablets and mobile devices
- **Touch Friendly**: Large buttons and touch targets
- **Warehouse Environment**: Designed for industrial settings
- **Light Theme**: High contrast for visibility in various lighting conditions

## Performance Features

- **Real-time Updates**: Live statistics and activity tracking
- **Optimized Loading**: Fast dashboard initialization
- **Efficient API Calls**: Minimal data transfer for quick updates
- **Offline Resilience**: Graceful handling of network issues

## Technical Implementation

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks with local state
- **API Integration**: Custom PACKER-specific endpoints
- **Authentication**: Session-based with sessionStorage

## API Endpoints

- `/api/picker-links?packer={packerId}` - Get assigned picker links
- `/api/boxes?packerId={packerId}` - Get recent boxes for packer
- `/api/packer/stats?packerId={packerId}` - Get performance statistics
- `/api/packer/health?packerId={packerId}` - Health check endpoint

## Usage

1. **Login**: Access through `/auth/packer-login` with station ID
2. **Dashboard**: Automatic redirect to PACKER dashboard after login
3. **Start Working**: Click "Access" on active assignments to begin picking
4. **Monitor Progress**: View real-time statistics and completion rates
5. **Track Performance**: Access reports and activity logs

## Security

- Role-based access control
- Station-specific authentication
- Session validation
- API endpoint protection
- Data filtering by packer assignment

This dashboard provides PACKER users with a focused, efficient interface optimized for the specific needs of warehouse packing operations while maintaining security and performance standards.