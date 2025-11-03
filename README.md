# 🔥 HotStack - File Orchestration System

**Live at:** https://hotstack.faa.zone

A high-performance file orchestration system built on Cloudflare Workers with R2 storage integration.

## 🌟 Features

- **Drag & Drop Upload Interface** - Beautiful, intuitive web UI
- **R2 Storage Integration** - Scalable object storage with Cloudflare R2
- **Queue Processing** - Asynchronous file processing pipeline
- **REST API** - Complete API for file management
- **Auto-Deployment** - GitHub Actions CI/CD pipeline
- **Production Ready** - CORS enabled, error handling, and logging

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

## 📁 Project Structure

```
hotstack/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   └── index.js                # Main worker code
├── wrangler.toml               # Cloudflare configuration
├── package.json                # Dependencies
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
route = "hotstack.faa.zone/*"

[[r2_buckets]]
binding = "HOTSTACK_BUCKET"
bucket_name = "hotstack-bucket"
```

### Environment Variables

Required secrets in GitHub:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## 📡 API Endpoints

### Upload File
```bash
POST /upload
Content-Type: multipart/form-data

# Response
{
  "success": true,
  "filename": "example.pdf",
  "size": 1024,
  "message": "File uploaded successfully"
}
```

### List Files
```bash
GET /files

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

### Get File
```bash
GET /file/:filename

# Returns the file content
```

### Delete File
```bash
DELETE /file/:filename

# Response
{
  "success": true,
  "message": "File example.pdf deleted successfully"
}
```

### Queue Status
```bash
GET /queue/status

# Response
{
  "queueEnabled": true,
  "timestamp": 1234567890
}
```

### Process File
```bash
POST /process
Content-Type: application/json

{
  "filename": "example.pdf",
  "action": "process"
}

# Response
{
  "success": true,
  "message": "File queued for processing",
  "filename": "example.pdf"
}
```

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

## 📚 Resources

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
