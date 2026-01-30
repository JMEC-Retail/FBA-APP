# CSV Report Generation Utility

The reports utility provides comprehensive CSV report generation for FBA shipments with support for multiple formats and automatic audit logging.

## Features

- **Multiple Report Formats**: FBA, Inventory, and Custom formats
- **FBA-Compliant**: Generate Amazon Seller Central ready reports
- **Automatic Directory Creation**: Creates reports/ directory as needed
- **Unique Filenames**: Includes metadata (shipment_id, box_id, date) in filenames
- **Audit Logging**: All report operations logged to audit system
- **Error Handling**: Comprehensive edge case handling
- **CSV Formatting**: Proper escaping and quoting for CSV compatibility

## Usage

### Generate Box Report
```typescript
import { generateBoxReport, ReportFormat } from '@/lib/reports'

// Generate report for a concluded box
const result = await generateBoxReport(
  'boxId', 
  ReportFormat.CUSTOM, 
  { userId: 'user123', userEmail: 'user@example.com' }
)
```

### Generate Shipment Summary Report
```typescript
import { generateShipmentSummaryReport, ReportFormat } from '@/lib/reports'

// Generate summary for entire shipment
const result = await generateShipmentSummaryReport(
  'shipmentId', 
  ReportFormat.FBA, 
  { userId: 'user123', userEmail: 'user@example.com' }
)
```

### Get Shipment Summary
```typescript
import { getShipmentSummary } from '@/lib/reports'

// Get summary statistics
const summary = await getShipmentSummary('shipmentId')
```

## Report Formats

### FBA Format
- Headers: SKU, Quantity, FN SKU, Seller SKU
- Compatible with Amazon Seller Central

### Inventory Format
- Headers: SKU, FN SKU, Quantity, Description, Seller
- Detailed inventory reporting

### Custom Format
- Headers: SKU, QTY, seller, seller
- Custom format for specific needs

## File Naming Convention

Files are saved with unique names including:
- Shipment ID
- Box ID (for box reports)
- Date and timestamp
- Report format

Example: `shipmentId_boxId_2026-01-31_14-30-45_custom.csv`

## Error Handling

The utility handles:
- Empty boxes/shipments
- Invalid box IDs
- Non-concluded boxes
- File system errors
- Database errors
- CSV formatting issues

All operations are logged to the audit system for tracking and debugging.