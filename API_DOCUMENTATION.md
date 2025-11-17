# HotStack™ API Documentation

Complete API reference for the HotStack File Orchestration System.

## Base URLs

- **Production**: `https://hotstack.faa.zone`
- **Fruitful Integration**: `https://fruitful.faa.zone`

## Authentication

HotStack supports multiple authentication methods:

### 1. Bearer Token Authentication (Optional)
For secure uploads, you can configure a `AUTH_SECRET` environment variable. When set, the `/upload` endpoint requires authentication.

```bash
Authorization: Bearer YOUR_SECRET_TOKEN
```

### 2. Session-based Authentication (D1 Database)
User authentication is managed through D1 database with bcrypt password hashing. Sessions are stored with 7-day expiration.

**Session Cookie**: `session=SESSION_ID`
**Authorization Header**: `Bearer SESSION_ID`

---

## API Endpoints

### File Operations

#### Upload File
Upload files to R2 storage with automatic manifest generation.

**Endpoint**: `POST /upload` or `POST /api/upload`

**Headers**:
- `Content-Type: multipart/form-data`
- `Authorization: Bearer TOKEN` (optional, if AUTH_SECRET is configured)

**Request Body**:
```
file: <binary file data>
```

**Response** (200 OK):
```json
{
  "success": true,
  "key": "hotstack/1699999999999-example.pdf",
  "filename": "example.pdf",
  "size": 1024,
  "manifest": "hotstack/1699999999999-example.pdf-manifest.json",
  "message": "File uploaded successfully"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "No file provided"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

**Features**:
- Streaming multipart upload for files of any size
- Automatic timestamp-based key generation
- Manifest file creation for deployment tracking
- Queue integration (if configured)
- Metadata storage (original name, size, content type)

**Example - cURL**:
```bash
curl -X POST https://hotstack.faa.zone/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

**Example - JavaScript**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log(result);
```

---

#### List All Files
Retrieve a list of all files in the R2 bucket.

**Endpoint**: `GET /files` or `GET /api/files`

**Response** (200 OK):
```json
{
  "files": [
    {
      "key": "hotstack/1699999999999-example.pdf",
      "size": 1024,
      "uploaded": "2025-01-01T00:00:00.000Z",
      "httpMetadata": {
        "contentType": "application/pdf"
      }
    }
  ],
  "count": 1
}
```

**Example**:
```bash
curl https://hotstack.faa.zone/api/files
```

---

#### Get Upload Status
Get recent uploads from the `hotstack/` prefix (last 10 files).

**Endpoint**: `GET /status` or `GET /api/status`

**Response** (200 OK):
```json
{
  "success": true,
  "files": [
    {
      "key": "hotstack/1699999999999-example.pdf",
      "uploaded": "2025-01-01T00:00:00.000Z",
      "size": 1024
    }
  ],
  "count": 1
}
```

**Example**:
```bash
curl https://hotstack.faa.zone/api/status
```

---

#### Download File
Download a specific file from R2 storage.

**Endpoint**: `GET /file/:filename` or `GET /api/file/:filename`

**Path Parameters**:
- `filename`: Full key of the file in R2 (e.g., `hotstack/1699999999999-example.pdf`)

**Response** (200 OK):
- Returns file content with appropriate headers
- `Content-Type`: Original file MIME type
- `Content-Disposition`: `attachment; filename="original-name.ext"`
- `Content-Length`: File size in bytes
- `Cache-Control`: `public, max-age=3600`

**Error Response** (404 Not Found):
```
File not found
```

**Example**:
```bash
curl https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-example.pdf \
  --output example.pdf
```

**Features**:
- Proper Content-Disposition headers for downloads
- URL-encoded filename support
- Original filename preservation
- Streaming for large files

---

#### Delete File
Delete a file from R2 storage.

**Endpoint**: `DELETE /file/:filename` or `DELETE /api/file/:filename`

**Path Parameters**:
- `filename`: Full key of the file in R2

**Response** (200 OK):
```json
{
  "success": true,
  "message": "File hotstack/1699999999999-example.pdf deleted successfully",
  "filename": "hotstack/1699999999999-example.pdf"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "File not found",
  "filename": "hotstack/1699999999999-example.pdf"
}
```

**Example**:
```bash
curl -X DELETE https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-example.pdf
```

**Features**:
- Checks file existence before deletion
- Also deletes associated manifest files
- Returns detailed error messages

---

### Authentication Endpoints

#### Sign Up
Create a new user account.

**Endpoint**: `POST /api/auth/signup`

**Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe" // optional
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Error Response** (409 Conflict):
```json
{
  "error": "User already exists"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Email and password are required"
}
```

**Validation Rules**:
- Email must be valid format
- Password must be at least 8 characters
- Username is optional

**Example**:
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "username": "johndoe"
  }'
```

---

#### Sign In
Authenticate and create a session.

**Endpoint**: `POST /api/auth/signin`

**Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "sessionId": "abc123...",
  "expiresAt": "2025-01-08T00:00:00.000Z",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Response Headers**:
- `Set-Cookie: session=abc123...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid email or password"
}
```

**Features**:
- Creates session with 7-day expiration
- Updates user's last login timestamp
- Logs audit event
- Sets secure HttpOnly cookie

**Example**:
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }' \
  --cookie-jar cookies.txt
```

---

#### Sign Out
Invalidate current session and log out.

**Endpoint**: `POST /api/auth/signout`

**Headers**:
- `Authorization: Bearer SESSION_ID` or Cookie: `session=SESSION_ID`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

**Response Headers**:
- `Set-Cookie: session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

**Error Response** (401 Unauthorized):
```json
{
  "error": "Not authenticated"
}
```

**Features**:
- Deletes session from database
- Clears session cookie
- Logs audit event

**Example**:
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signout \
  -H "Authorization: Bearer SESSION_ID" \
  --cookie cookies.txt
```

---

#### Get Current User
Retrieve information about the currently authenticated user.

**Endpoint**: `GET /api/auth/me`

**Headers**:
- `Authorization: Bearer SESSION_ID` or Cookie: `session=SESSION_ID`

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Not authenticated"
}
```

**Error Response** (401 Unauthorized - Expired Session):
```json
{
  "error": "Invalid or expired session"
}
```

**Example**:
```bash
curl https://hotstack.faa.zone/api/auth/me \
  -H "Authorization: Bearer SESSION_ID"
```

---

### Queue Operations

#### Get Queue Status
Check if queue processing is enabled.

**Endpoint**: `GET /queue/status`

**Response** (200 OK):
```json
{
  "queueEnabled": true,
  "timestamp": 1699999999999
}
```

**Example**:
```bash
curl https://hotstack.faa.zone/queue/status
```

---

#### Process File
Send a file to the processing queue.

**Endpoint**: `POST /process`

**Headers**:
- `Content-Type: application/json`

**Request Body**:
```json
{
  "filename": "hotstack/1699999999999-example.pdf",
  "action": "process" // optional, defaults to "process"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "File queued for processing",
  "filename": "hotstack/1699999999999-example.pdf"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "File not found"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Filename required"
}
```

**Example**:
```bash
curl -X POST https://hotstack.faa.zone/process \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hotstack/1699999999999-example.pdf",
    "action": "process"
  }'
```

---

## CORS Configuration

All endpoints support Cross-Origin Resource Sharing (CORS) with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Preflight Requests (OPTIONS)
All endpoints support OPTIONS preflight requests for CORS.

**Example**:
```bash
curl -X OPTIONS https://hotstack.faa.zone/api/upload \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (signup) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required) |
| 404 | Not Found (file or resource not found) |
| 409 | Conflict (user already exists) |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, there are no rate limits enforced. For production use, consider implementing rate limiting based on IP address or user session.

---

## Web Interfaces

### Landing Page
**URL**: `https://hotstack.faa.zone/`
- Animated particle background
- Quick upload interface
- Feature highlights
- Dashboard access button

### Dashboard
**URL**: `https://hotstack.faa.zone/dashboard`
- File upload zone with drag & drop
- Real-time progress tracking
- File list with metrics
- Delete operations
- Live status console
- Global hubs (Analytics, Admin, Account, Referrals)

### Intake Portal
**URL**: `https://hotstack.faa.zone/intake`
- Dedicated secure upload interface
- Optional Bearer token authentication
- Real-time progress bar
- Recent uploads display
- Multipart upload support

### Fruitful Integration
**URL**: `https://fruitful.faa.zone/`
- User authentication (signup/signin)
- Authenticated file uploads
- HotStack technology integration
- Feature showcase

### Auth Test Page
**URL**: `https://hotstack.faa.zone/auth-test`
- Test authentication flows
- Signup, signin, signout testing
- Profile information display

---

## Security Best Practices

### For File Uploads
1. Always use HTTPS in production
2. Configure `AUTH_SECRET` for protected uploads
3. Validate file types and sizes on client side
4. Use content security headers
5. Implement rate limiting

### For Authentication
1. Use strong passwords (minimum 8 characters)
2. Passwords are hashed with bcrypt (10 salt rounds)
3. Sessions expire after 7 days
4. Sessions are HttpOnly, Secure, and SameSite=Strict
5. All authentication events are logged in audit logs

### For API Access
1. Always include CORS headers
2. Validate input data
3. Use parameterized queries for database operations
4. Log all critical operations
5. Handle errors gracefully

---

## Edge Cases & Known Issues

### File Upload
- **Large files**: Streaming is used, so files of any size are supported
- **Concurrent uploads**: Multiple files can be uploaded simultaneously
- **Special characters in filenames**: URLs should be properly encoded
- **Network interruptions**: Uploads may fail; implement retry logic on client side

### Authentication
- **Expired sessions**: Automatically cleaned up; users need to sign in again
- **Concurrent sessions**: Multiple sessions per user are allowed
- **Password reset**: Not yet implemented (TODO)
- **Email verification**: Not yet implemented (TODO)

### File Operations
- **Delete operations**: Check file existence before attempting deletion
- **Download large files**: Streaming is used for efficient delivery
- **Manifest files**: Automatically created and deleted with files
- **File listing**: Limited to bucket capacity; pagination may be needed for large deployments

### CORS
- **Local development**: May require CORS configuration in browser or proxy
- **Firewall restrictions**: Some corporate firewalls may block CORS requests
- **Preview URLs**: Worker preview URLs may have different CORS behavior

---

## Troubleshooting

### Upload Fails
1. Check if `AUTH_SECRET` is required and provided
2. Verify CORS headers are present
3. Check file size limits (R2 supports up to 5TB per object)
4. Ensure R2 bucket exists and is accessible
5. Check network connectivity

### Authentication Issues
1. Verify D1 database is configured and accessible
2. Check if database schema is initialized
3. Verify session cookie is being set
4. Check if session has expired
5. Ensure HTTPS is used in production

### Download Problems
1. Verify file key is correct and URL-encoded
2. Check if file exists in R2
3. Ensure proper Content-Disposition headers
4. Verify CORS headers are present
5. Check browser cache settings

### CORS Errors
1. Verify OPTIONS preflight requests are handled
2. Check Access-Control-Allow-Origin header
3. Ensure all required headers are allowed
4. Test with different browsers
5. Check for corporate firewall restrictions

---

## Support & Resources

- **GitHub Repository**: https://github.com/heyns1000/hotstack
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **R2 Storage Docs**: https://developers.cloudflare.com/r2/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/

---

## Changelog

### Version 1.0.0
- Initial API documentation
- Complete endpoint reference
- Authentication system
- File operations with streaming
- CORS support
- Queue integration
- Audit logging

---

*Last Updated: November 2024*
