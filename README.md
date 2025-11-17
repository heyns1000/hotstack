# 🔥 HotStack - File Orchestration System

**Live at:** https://hotstack.faa.zone  
**Intake Portal:** https://hotstack.faa.zone/intake

A high-performance file orchestration system built on Cloudflare Workers with R2 storage integration.

## 🌟 Features

- **Secure File Upload** - Bearer token authentication for protected uploads
- **Drag & Drop Interface** - Beautiful, intuitive web UI with real-time progress
- **Multipart Upload Support** - Handles large files efficiently using streaming
- **R2 Storage Integration** - Scalable object storage with Cloudflare R2
- **Auto-Deploy Manifests** - Automatic manifest creation for Fruitful sync
- **Queue Processing** - Asynchronous file processing pipeline
- **REST API** - Complete API with `/api/*` standardized endpoints
- **Auto-Deployment** - GitHub Actions CI/CD pipeline
- **Production Ready** - CORS enabled, error handling, and logging
- **User Authentication** - D1 database integration with bcrypt password hashing
- **Enhanced Delete Operations** - Confirmation modals with audit logging
- **Proper File Downloads** - Correct headers and encoding for R2 downloads
- **Mobile Responsive** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Cloudflare account
- GitHub account (for auto-deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8787
```

### Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy

# Or deploy to specific environment
npm run deploy:production
npm run deploy:staging
```

### Set up R2 Bucket

```bash
# Create the R2 bucket
wrangler r2 bucket create hotstack-intake-bucket

# Set up authentication secret (optional)
wrangler secret put AUTH_SECRET
```

## 📁 Project Structure

```
hotstack/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── public/
│   ├── hotstack-intake.html    # Intake portal (standalone)
│   ├── index.html              # Landing page
│   └── js/
│       └── auth.js             # Authentication client
├── src/
│   ├── index.js                # Main worker code
│   ├── worker.js               # Standalone secure upload worker
│   └── db/
│       └── users.js            # User database functions
├── wrangler.toml               # Cloudflare configuration
├── package.json                # Dependencies
├── schema.sql                  # Database schema
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentation
```

## 🔧 Configuration

### Cloudflare Workers Settings

Edit `wrangler.toml`:

```toml
name = "hotstack-worker"
main = "src/index.js"
account_id = "ad41fcfe1a84b27c62cc5cc9d590720e"

[[routes]]
pattern = "hotstack.faa.zone/*"
zone_name = "faa.zone"

[[routes]]
pattern = "fruitful.faa.zone/*"
zone_name = "faa.zone"

[[r2_buckets]]
binding = "HOTSTACK_BUCKET"
bucket_name = "hotstack-intake-bucket"

[[d1_databases]]
binding = "DB"
database_name = "hotstack-db"
database_id = "YOUR_DATABASE_ID"
```

### Environment Variables

Required secrets in GitHub:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

Optional secrets (set with `wrangler secret put`):
- `AUTH_SECRET` - Bearer token for secure uploads (optional but recommended)

## 🌐 Web Interfaces

### HotStack Intake Portal (`/intake`)
A dedicated secure file upload portal with:
- Real-time progress bar showing upload percentage
- Drag-and-drop file upload
- Optional Bearer token authentication
- Display of recent uploads
- Multipart upload support for large files
- Auto-deploy manifest generation

### Main Landing Page (`/`)
HotStack™ landing page with:
- Animated particle background
- Quick upload interface
- Feature highlights
- Dashboard access

### Dashboard (`/dashboard`)
File management interface with:
- Upload files
- List all uploaded files
- Delete files
- View file metadata

### Fruitful Portal (`fruitful.faa.zone`)
Fruitful integration page with:
- User authentication (signup/signin)
- File upload with authentication
- Recent uploads display

## 📡 API Endpoints

All endpoints support both legacy paths and `/api/*` prefixed paths for consistency.

### Upload File (Enhanced with Multipart Support)
```bash
POST /api/upload  # or /upload
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN (optional)

# Response
{
  "success": true,
  "key": "hotstack/1699999999999-example.pdf",
  "filename": "example.pdf",
  "size": 1024,
  "manifest": "hotstack/1699999999999-example.pdf-manifest.json",
  "message": "File uploaded successfully"
}
```

### Get Upload Status
```bash
GET /api/status  # or /status

# Response
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

### List Files
```bash
GET /api/files  # or /files

# Response
{
  "files": [
    {
      "key": "example.pdf",
      "size": 1024,
      "uploaded": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Download File
```bash
GET /api/file/:filename  # or /file/:filename

# Returns the file content with proper headers:
# - Content-Disposition: attachment; filename="original-name.ext"
# - Content-Type: original MIME type
# - Content-Length: file size
```

### Delete File
```bash
DELETE /api/file/:filename  # or /file/:filename

# Response
{
  "success": true,
  "message": "File example.pdf deleted successfully"
}
```

### Authentication Endpoints
```bash
POST /api/auth/signup    # Create new user account
POST /api/auth/signin    # Sign in and create session
POST /api/auth/signout   # Sign out and invalidate session
GET  /api/auth/me        # Get current user information
```

**For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)**

## 🔐 Security Features

### Bearer Token Authentication
Upload endpoints support optional Bearer token authentication. When `AUTH_SECRET` is configured, the worker validates the Authorization header:

```bash
curl -X POST https://hotstack.faa.zone/upload \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -F "file=@document.pdf"
```

### Password Hashing
User passwords are securely hashed using bcryptjs with salt rounds before storage in the D1 database.

### Audit Logging
All authentication events (signup, signin, signout) are logged with:
- User ID
- Action type
- IP address
- User agent
- Timestamp

## ⚡ Technical Improvements

### Multipart Upload Support
The worker now uses streaming for file uploads instead of buffering the entire file in memory:
- Handles files of any size efficiently
- Reduced memory footprint
- Better performance for large files

**Before:**
```javascript
const arrayBuffer = await file.arrayBuffer();  // Loads entire file in memory
await env.HOTSTACK_BUCKET.put(filename, arrayBuffer);
```

**After:**
```javascript
await env.HOTSTACK_BUCKET.put(key, file.stream());  // Streams directly
```

### Auto-Deploy Manifests
Each uploaded file automatically generates a manifest file for synchronization:

```json
{
  "status": "deployed",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "hotstack/1699999999999-example.pdf",
  "originalName": "example.pdf",
  "size": 1024,
  "contentType": "application/pdf"
}
```

### Real-time Progress Tracking
The intake portal uses XMLHttpRequest with progress events to show real-time upload progress:
- Percentage complete
- Bytes uploaded / Total bytes
- Upload speed indication

## 🔄 Auto-Deployment with GitHub Actions

Every push to `main` branch automatically deploys to Cloudflare:

1. Code is pushed to GitHub
2. GitHub Actions workflow triggers
3. Tests run (if configured)
4. Deploys to Cloudflare Workers
5. Live at hotstack.faa.zone in ~2 minutes

### Setup GitHub Auto-Deploy

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/hotstack.git
   git push -u origin main
   ```

2. **Add GitHub Secrets**
   - Go to: `Settings` → `Secrets and variables` → `Actions`
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`

3. **Push to Deploy**
   ```bash
   git add .
   git commit -m "Update"
   git push
   ```

That's it! Your code deploys automatically.

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run deploy           # Deploy to production
npm run deploy:staging   # Deploy to staging
npm run tail             # View live logs
```

### Adding New Features

1. Edit `src/index.js`
2. Test locally with `npm run dev`
3. Commit and push to GitHub
4. Automatic deployment happens

## 🔐 Security

- CORS headers configured for API access
- R2 bucket permissions managed via Cloudflare
- API tokens stored as GitHub secrets
- Production environment isolation

## 📊 Monitoring

View live logs:
```bash
npm run tail
```

Or check the Cloudflare dashboard:
https://dash.cloudflare.com

## 🐛 Troubleshooting

### Common Issues

**Deploy fails:**
- Check GitHub secrets are set correctly
- Verify Cloudflare account ID
- Check R2 bucket exists

**Files not uploading:**
- Check R2 bucket binding in wrangler.toml
- Verify bucket permissions
- Check CORS headers

**Worker not responding:**
- Check route configuration
- Verify DNS settings
- Check worker logs

**Authentication issues:**
- Verify D1 database is configured
- Check database schema is initialized
- Ensure sessions are not expired

**For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## 📚 Resources

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Detailed troubleshooting and debugging guide
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions](https://docs.github.com/en/actions)

## 📝 License

MIT License - feel free to use for any project!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

Questions? Issues? Open a GitHub issue or check the [Cloudflare Community](https://community.cloudflare.com/).

---

**Built with ❤️ using Cloudflare Workers**
