# Picker Links API Endpoints

## Overview
The picker links API provides endpoints for managing picker links in the FBA shipment application.

## Endpoints

### 1. GET /api/picker-links
**Description:** List all picker links for the authenticated user (supports pagination)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `id` (optional): Get specific picker link by ID instead of listing

**Permissions:** SHIPPER or ADMIN

**Example Usage:**
```bash
# List all picker links (paginated)
GET /api/picker-links?page=1&limit=10

# Get specific picker link
GET /api/picker-links?id=clx123abc
```

### 2. POST /api/picker-links
**Description:** Create new picker link for a shipment or delete a picker link

**Permissions:** SHIPPER or ADMIN

**Request Body (Create):**
```json
{
  "shipmentId": "shipment_id_here"
}
```

**Request Body (Delete):**
```json
{
  "action": "delete",
  "id": "picker_link_id_here"
}
```

### 3. DELETE /api/picker-links
**Description:** Deactivate a picker link

**Query Parameters:**
- `id` (required): Picker link ID to deactivate

**Permissions:** SHIPPER or ADMIN

**Example Usage:**
```bash
DELETE /api/picker-links?id=clx123abc
```

### 4. GET /api/picker-links/[uuid]
**Description:** Access shipment via UUID (for pickers, no auth required)

**URL Parameters:**
- `uuid`: The UUID of the picker link

**Permissions:** None (public access for active links)

**Example Usage:**
```bash
GET /api/picker-links/550e8400-e29b-41d4-a716-446655440000
```

### 5. POST /api/picker-links/[uuid]
**Description:** Update picker link (assign packer, etc.)

**URL Parameters:**
- `uuid`: The UUID of the picker link

**Request Body:**
```json
{
  "action": "assign_packer"
}
```

**Permissions:** Authentication required for assign_packer action

## Features

### Security & Validation
- Secure UUID generation using Node.js crypto module
- Permission validation based on user roles
- Active link validation for UUID access
- Shipment ownership verification for SHIPPER role

### Error Handling
- Comprehensive error responses with appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful handling of missing resources

### Audit Logging
- All actions are logged to the audit system
- Tracks user ID, action type, and detailed information
- Anonymous access logging for UUID endpoints

### Pagination
- Support for paginated results in list endpoints
- Configurable page size and current page
- Total count and page information in response

### Response Format
The API returns JSON responses with the following structure:

**Success Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

## Usage Examples

### Creating a Picker Link
```bash
curl -X POST "http://localhost:3000/api/picker-links" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"shipmentId": "shipment_123"}'
```

### Accessing Shipment via UUID
```bash
curl "http://localhost:3000/api/picker-links/550e8400-e29b-41d4-a716-446655440000"
```

### Listing Picker Links
```bash
curl "http://localhost:3000/api/picker-links?page=1&limit=5" \
  -H "Authorization: Bearer <token>"
```

### Deactivating a Picker Link
```bash
curl -X DELETE "http://localhost:3000/api/picker-links?id=picker_link_123" \
  -H "Authorization: Bearer <token>"
```

## Implementation Details

### File Structure
- `src/app/api/picker-links/route.ts` - Main CRUD operations
- `src/app/api/picker-links/[uuid]/route.ts` - UUID-based access

### Dependencies
- Next.js API Routes
- Prisma ORM
- NextAuth.js for authentication
- Node.js crypto module for UUID generation

### Database Schema
The API uses the following database models:
- `PickerLink` - Main picker link entity
- `Shipment` - Associated shipment information
- `User` - Shipper and packer information
- `AuditLog` - Action logging

### Security Considerations
- UUID-based access only for active links
- Role-based permission validation
- Shipment ownership verification
- Audit trail for all actions
- Input validation and sanitization