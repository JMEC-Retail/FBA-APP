# Reports Management Page

A comprehensive reports management interface for the FBA Shipment App that provides centralized access to all generated CSV reports.

## Features

### 📊 Report Listing
- **Complete report metadata display**: filename, shipment ID, box ID, format, generation date
- **File information**: file size, record count, creation/modification timestamps
- **Report type identification**: Box reports vs Shipment Summary reports
- **Format badges**: Visual indicators for FBA, Inventory, and Custom formats

### 🔍 Search & Filtering
- **Text search**: Search by filename or shipment ID
- **Advanced filters**:
  - Shipment ID filtering
  - Date range selection (from/to dates)
  - Report format filtering (FBA/Inventory/Custom)
- **Collapsible filter panel**: Clean interface with expandable filter options
- **Clear filters**: One-click filter reset functionality

### 📥 Download Functionality
- **Individual downloads**: Single click download with proper MIME types
- **Bulk downloads**: Select multiple reports for batch downloading
- **Preview before download**: In-app report preview functionality
- **Direct file access**: Stream downloads with correct headers (text/csv, Content-Disposition)

### 👁️ Report Preview
- **Modal preview**: In-app report viewing without downloading
- **Table format**: Preview shows CSV data in tabular format
- **Limited preview**: First 10 rows displayed for performance
- **Metadata display**: Shows record count, file size, creation date
- **Download from preview**: Direct download option from preview modal

### 🗑️ Bulk Actions
- **Multi-select reports**: Checkbox selection for bulk operations
- **Bulk download**: Download multiple reports simultaneously
- **Bulk deletion**: Remove multiple reports at once (Admin/Shipper only)
- **Selection counter**: Shows number of selected reports
- **Clear selection**: One-click deselect all functionality

### 👥 Role-Based Access Control
- **ADMIN**: Full access to all reports, can delete any report
- **SHIPPER**: Can view and download own reports, manage their reports
- **PACKER**: Read-only access, can view and download reports but cannot delete
- **Permission-based UI**: Different action buttons based on user role

### 📈 Statistics Dashboard
- **Total reports count**: Overall number of generated reports
- **Total records**: Combined record count across all reports
- **Storage usage**: Total file size of all reports
- **Format breakdown**: Count by report type (FBA/Inventory/Custom)

### 📱 Responsive Design
- **Mobile-friendly**: Works on all device sizes
- **Adaptive layout**: Grid system adjusts to screen size
- **Touch-friendly**: Large tap targets for mobile use
- **Collapsible navigation**: Mobile sidebar with hamburger menu

### ⚡ Performance Features
- **Loading states**: Skeleton components for better perceived performance
- **Pagination**: Navigate through large datasets efficiently
- **Lazy loading**: Reports loaded on demand
- **Error handling**: Comprehensive error states with user feedback
- **Debounced search**: Optimized search performance

### 🔄 Data Refresh
- **Manual refresh**: Refresh button to reload data
- **Real-time updates**: Data reflects latest report generation
- **Automatic refresh**: Updates when filters change
- **Cache management**: Proper cache headers for file downloads

## File Structure

```
src/app/dashboard/reports/
├── page.tsx                 # Main reports management component
└── README.md               # This documentation file

src/app/api/reports/
├── route.ts                # Main reports API (GET/POST)
├── [filename]/route.ts     # Individual report operations (GET/DELETE)
└── search/route.ts         # Advanced search functionality
```

## API Integration

### GET /api/reports
- Lists all reports with pagination
- Supports filtering by shipment, date range, format
- Returns report metadata and pagination info

### GET /api/reports/[filename]
- Downloads individual report files
- Supports preview mode with `?view=true` query parameter
- Proper MIME types and Content-Disposition headers

### DELETE /api/reports/[filename]
- Deletes specific report files
- Role-based access control
- Audit logging for deletions

### GET /api/reports/search
- Advanced search functionality
- Multiple filter parameters
- Sortable results
- Enhanced metadata in response

## Usage Examples

### Viewing Reports
1. Navigate to `/dashboard/reports`
2. View all reports in the main list
3. Use filters to narrow down results
4. Click "Preview" to view report content
5. Click "Download" to save report file

### Bulk Operations
1. Select reports using checkboxes
2. Use "Download Selected" for bulk downloads
3. Use "Delete Selected" for bulk removal (Admin/Shipper only)

### Advanced Search
1. Click "Show Filters" to expand search options
2. Enter shipment ID to filter specific shipments
3. Select date range for time-based filtering
4. Choose format to filter by report type
5. Use search bar for text-based filtering

## Component Structure

### Main Components
- `ReportsPage`: Main container component
- `ReportsSkeleton`: Loading state component
- `FormatBadge`: Report format indicator
- `ReportPreviewModal`: Report preview functionality

### State Management
- `reports`: Array of report objects
- `pagination`: Pagination information
- `filters`: Current filter state
- `selectedReports`: Array of selected report filenames
- `previewReport`: Currently previewed report

### Data Flow
1. Component mounts → fetches session
2. Session loaded → fetches reports
3. Filter changes → refetches with new parameters
4. User actions → API calls for downloads/deletions
5. State updates → UI re-renders

## Performance Optimizations

- **Pagination**: Limits initial data load
- **Lazy loading**: Preview data loaded on demand
- **Debounced search**: Reduces API calls during typing
- **Skeleton loading**: Improves perceived performance
- **Memoized components**: Prevents unnecessary re-renders
- **Efficient filtering**: Server-side filtering reduces data transfer

## Security Features

- **Role-based access**: Different permissions per user role
- **File validation**: Prevents path traversal attacks
- **Audit logging**: Tracks all report access and modifications
- **Input sanitization**: Validates all user inputs
- **Secure downloads**: Proper headers for file downloads

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Android Chrome)

## Future Enhancements

- Report scheduling functionality
- Export to other formats (PDF, Excel)
- Report sharing capabilities
- Advanced analytics dashboard
- Custom report templates
- Automated report cleanup
- Email delivery of reports
- Report versioning and history
- Integration with external storage services