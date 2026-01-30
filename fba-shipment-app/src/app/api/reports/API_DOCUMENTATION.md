# Reports API Documentation

## Overview
The Reports API provides endpoints for generating, accessing, and managing CSV reports for FBA shipments and boxes. Access is restricted to ADMIN and SHIPPER roles.

## Authentication
All endpoints require authentication with valid session tokens. Users must have role 'ADMIN' or 'SHIPPER' to access any report functionality.

## Endpoints

### 1. GET /api/reports
List available reports with metadata and pagination.

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `shipmentId` (string, optional): Filter by shipment ID
- `dateFrom` (datetime, optional): Filter reports created after this date
- `dateTo` (datetime, optional): Filter reports created before this date
- `format` (string, optional): Filter by report format ('fba', 'inventory', 'custom')
- `search` (boolean, optional): Enable advanced search mode

**Response:**
```json
{
  "reports": [
    {
      "filename": "shipment123_summary_2026-01-31_14-30-25_custom.csv",
      "shipmentId": "shipment123",
      "boxId": null,
      "format": "custom",
      "generatedAt": "2026-01-31T14:30:25.000Z",
      "fileSize": 2048,
      "recordCount": 15,
      "createdAt": "2026-01-31T14:30:25.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 2. GET /api/reports/[filename]
Download or view a specific report file.

**Parameters:**
- `filename` (string): Name of the CSV file

**Query Parameters:**
- `view` (boolean, optional): Set to 'true' to return JSON representation instead of file download

**Response (Download):** CSV file with proper headers

**Response (View):**
```json
{
  "filename": "shipment123_summary_2026-01-31_14-30-25_custom.csv",
  "headers": ["SKU", "QTY", "seller", "seller"],
  "data": [
    {
      "SKU": "ITEM001",
      "QTY": "10",
      "seller": "Amazon",
      "seller": "Amazon"
    }
  ],
  "metadata": {
    "fileSize": 2048,
    "createdAt": "2026-01-31T14:30:25.000Z",
    "modifiedAt": "2026-01-31T14:30:25.000Z",
    "recordCount": 1
  }
}
```

### 3. POST /api/reports?action=generate
Generate a new report for a box or shipment.

**Request Body:**
```json
{
  "type": "box" | "shipment",
  "id": "box-id" | "shipment-id",
  "format": "fba" | "inventory" | "custom" (optional, default: "custom")
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "fileName": "shipment123_summary_2026-01-31_14-30-25_custom.csv",
    "filePath": "/reports/shipment123_summary_2026-01-31_14-30-25_custom.csv",
    "recordCount": 15,
    "format": "custom",
    "metadata": {
      "shipmentId": "shipment123",
      "boxId": null,
      "generatedAt": "2026-01-31T14:30:25.000Z",
      "fileSize": 2048
    }
  }
}
```

### 4. GET /api/reports/search
Advanced search for reports with multiple filters and sorting options.

**Query Parameters:**
- `query` (string, optional): Text search across filename, shipment ID, and format
- `shipmentId` (string, optional): Filter by shipment ID
- `dateFrom` (datetime, optional): Filter reports created after this date
- `dateTo` (datetime, optional): Filter reports created before this date
- `format` (string, optional): Filter by report format ('fba', 'inventory', 'custom')
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort field ('generatedAt', 'fileName', 'fileSize', 'recordCount')
- `sortOrder` (string, optional): Sort order ('asc', 'desc', default: 'desc')

**Response:**
```json
{
  "reports": [...],
  "pagination": {...},
  "search": {
    "totalFiles": 50,
    "filteredFiles": 5,
    "criteria": {
      "query": "shipment123",
      "shipmentId": null,
      "dateFrom": "2026-01-01T00:00:00.000Z",
      "dateTo": null,
      "format": "custom"
    },
    "sortBy": "generatedAt",
    "sortOrder": "desc"
  }
}
```

### 5. DELETE /api/reports/[filename]
Delete a specific report file.

**Parameters:**
- `filename` (string): Name of the CSV file to delete

**Response:**
```json
{
  "success": true,
  "message": "Report filename.csv deleted successfully"
}
```

## Report Formats

### FBA Format
Headers: `SKU,Quantity,FN SKU,Seller SKU`

### Inventory Format  
Headers: `SKU,FN SKU,Quantity,Description,Seller`

### Custom Format
Headers: `SKU,QTY,seller,seller`

## File Naming Convention

Files follow this naming pattern:
- Box reports: `{shipmentId}_{boxId}_{date}_{time}_{format}.csv`
- Shipment reports: `{shipmentId}_summary_{date}_{time}_{format}.csv`

Example: `shipment123_box456_2026-01-31_14-30-25_custom.csv`

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized. Only ADMIN and SHIPPER roles can access reports."
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request data",
  "details": [...]
}
```

**404 Not Found:**
```json
{
  "error": "Report file not found or invalid filename"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch reports"
}
```

## Security Features

- Role-based access control (ADMIN, SHIPPER only)
- File path sanitization to prevent directory traversal
- Audit logging for all report access and operations
- Input validation using Zod schemas
- Proper MIME type handling for file downloads

## Audit Logging

All API calls are logged with:
- User ID and email
- Action performed
- File names and parameters
- Timestamp
- Success/failure status

## Usage Examples

### Generate a box report
```bash
curl -X POST "http://localhost:3000/api/reports?action=generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-token>" \
  -d '{
    "type": "box",
    "id": "box123",
    "format": "fba"
  }'
```

### List recent reports
```bash
curl -X GET "http://localhost:3000/api/reports?page=1&limit=10" \
  -H "Authorization: Bearer <session-token>"
```

### Search reports
```bash
curl -X GET "http://localhost:3000/api/reports/search?query=shipment123&format=fba&page=1" \
  -H "Authorization: Bearer <session-token>"
```

### Download a report
```bash
curl -X GET "http://localhost:3000/api/reports/shipment123_summary_2026-01-31_14-30-25_custom.csv" \
  -H "Authorization: Bearer <session-token>" \
  -o report.csv
```

### View report contents as JSON
```bash
curl -X GET "http://localhost:3000/api/reports/shipment123_summary_2026-01-31_14-30-25_custom.csv?view=true" \
  -H "Authorization: Bearer <session-token>"
```