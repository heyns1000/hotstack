# 🔥 HotStack Template Integration Guide

**Version**: 5.0-github-drive-integrated
**Last Updated**: 2025-11-24

This guide walks you through completing the integration of GitHub and Google Drive templates into HotStack's deployment flow.

---

## 📋 What's Been Done

✅ **Code Implementation Complete**:
- `src/drive-connector.js` - Google Drive template scanner
- `src/github-scanner.js` - GitHub repository scanner
- `src/index.js` - Updated orchestrator with new endpoints
- `googleapis` package installed

✅ **New Endpoints Added**:
- `POST /api/templates/scan-github` - Scan GitHub repositories
- `POST /api/templates/scan-drive` - Scan Google Drive folder
- `POST /api/templates/search` - Search across all sources
- `GET /api/templates/stats` - Get template statistics
- `GET /api/templates/sources` - Check template source status
- `POST /api/collapse` - Deploy with intelligent template selection
- `GET /health` - Health check with system status
- `GET /status` - Detailed system status

---

## 🔑 STEP 1: Set Up Google Drive API

### 1.1 Create Google Cloud Project

1. Go to: https://console.cloud.google.com
2. Create or select project: **hotstack-production**
3. Enable **Google Drive API**:
   - Navigate: APIs & Services → Library
   - Search "Google Drive API"
   - Click **Enable**

### 1.2 Create Service Account

1. Go to: APIs & Services → Credentials
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - Name: `hotstack-drive-connector`
   - Service account ID: `hotstack-drive-connector`
   - Description: "HotStack template scanning service"
   - Click **Create and Continue**
   - Skip roles (no role needed)
   - Click **Done**

### 1.3 Generate JSON Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Select **JSON** format
5. Click **Create**
6. **Save this file** - you'll need it in Step 3

### 1.4 Share Drive Folder

1. Open Google Drive: https://drive.google.com
2. Find your `Codenest_drive_data` folder
3. Click **Share**
4. Add the service account email:
   - Email looks like: `hotstack-drive-connector@hotstack-production.iam.gserviceaccount.com`
   - Permission: **Viewer**
5. Click **Send**

---

## 🔑 STEP 2: Set Up GitHub Access

### 2.1 Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Fill in details:
   - Note: `hotstack-template-scanner`
   - Expiration: **No expiration** (or 1 year)
   - Scopes: Check `repo` (Full control of private repositories)
4. Click **Generate token**
5. **Copy the token** - you'll need it in Step 3 (you won't be able to see it again!)

---

## ⚙️ STEP 3: Configure Cloudflare Secrets

### 3.1 Set Google Drive Credentials

```bash
wrangler secret put GOOGLE_DRIVE_CREDENTIALS
```

When prompted, paste the **entire contents** of the JSON file you downloaded in Step 1.3.

The JSON should look like this:
```json
{
  "type": "service_account",
  "project_id": "hotstack-production",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "hotstack-drive-connector@hotstack-production.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 3.2 Set GitHub Token

```bash
wrangler secret put GITHUB_TOKEN
```

When prompted, paste the **Personal Access Token** you created in Step 2.1.

Example: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🚀 STEP 4: Deploy to Cloudflare

### 4.1 Verify Changes

```bash
# Check git status
git status

# Review changes
git diff src/index.js
```

### 4.2 Deploy

```bash
# Deploy to Cloudflare
wrangler deploy

# Or use npm script
npm run deploy
```

### 4.3 Expected Output

```
✨ Built successfully!
✨ Successfully published your script to
   https://hotstack-worker.YOUR_SUBDOMAIN.workers.dev
```

---

## 🧪 STEP 5: Test the Integration

### 5.1 Test Health Check

```bash
curl https://hotstack.faa.zone/health | jq
```

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "5.0-github-drive-integrated",
  "systems": ["HotStack", "R2Storage", "GitHub", "GoogleDrive", "D1Database"],
  "timestamp": "2025-11-24T..."
}
```

### 5.2 Test System Status

```bash
curl https://hotstack.faa.zone/status | jq
```

**Expected Response**:
```json
{
  "version": "5.0-github-drive-integrated",
  "uptime": "online",
  "systems": {
    "github": {
      "status": "connected",
      "username": "heyns1000",
      "publicRepos": 83,
      "cacheSize": 0
    },
    "googleDrive": {
      "status": "connected",
      "cacheSize": 0,
      "message": "Google Drive connection healthy"
    },
    "r2": {
      "status": "connected"
    }
  }
}
```

### 5.3 Scan GitHub Repositories

```bash
curl -X POST https://hotstack.faa.zone/api/templates/scan-github | jq
```

**Expected Response**:
```json
{
  "success": true,
  "source": "github",
  "repositories": 83,
  "scannedRepositories": 83,
  "templatesFound": 247,
  "categories": {
    "landing-page": 89,
    "dashboard": 42,
    "ecommerce": 35,
    "saas": 28,
    "web-app": 21,
    "general": 32
  },
  "scannedAt": "2025-11-24T..."
}
```

### 5.4 Scan Google Drive

```bash
curl -X POST https://hotstack.faa.zone/api/templates/scan-drive | jq
```

**Expected Response**:
```json
{
  "success": true,
  "templates": [...],
  "count": 127,
  "folderId": "...",
  "scannedAt": "2025-11-24T..."
}
```

### 5.5 Get Template Statistics

```bash
curl https://hotstack.faa.zone/api/templates/stats | jq
```

**Expected Response**:
```json
{
  "sources": {
    "github": {
      "status": "connected",
      "repositories": 83,
      "templates": 247,
      "categories": {...}
    },
    "drive": {
      "status": "connected",
      "templates": 127,
      "folderId": "..."
    }
  },
  "totalTemplates": 374,
  "categories": {...},
  "lastUpdated": "2025-11-24T..."
}
```

### 5.6 Test Template Search

```bash
curl -X POST https://hotstack.faa.zone/api/templates/search \
  -H "Content-Type: application/json" \
  -d '{
    "businessIntent": "SaaS startup for project management",
    "category": "saas",
    "limit": 5
  }' | jq
```

### 5.7 Test Complete Deployment Flow

```bash
# Create test file
echo "Tech startup focusing on AI-powered recycling solutions" > test-business.txt

# Upload and deploy
curl -X POST https://hotstack.faa.zone/api/collapse \
  -F "file=@test-business.txt" \
  -F "prompt=SaaS startup for recycling" \
  -F "license=MASTERED" | jq
```

**Expected Response**:
```json
{
  "success": true,
  "buildId": "build-1732449600000-abc123",
  "elapsedTime": 47,
  "withinTarget": true,
  "deployment": {
    "url": "https://hotstack.faa.zone/file/deployments/build-1732449600000-abc123/index.html",
    "key": "deployments/build-1732449600000-abc123/index.html"
  },
  "template": {
    "source": "github",
    "name": "landing-modern.html",
    "repo": "codenest",
    "repoUrl": "https://github.com/heyns1000/codenest",
    "fileUrl": "https://github.com/heyns1000/codenest/blob/main/templates/landing-modern.html"
  },
  "licenseVault": {
    "verified": true,
    "license": "MASTERED"
  }
}
```

**✅ SUCCESS CRITERIA**:
- `template.source` should be `"github"` (not `"fallback"`)
- `elapsedTime` should be < 180 seconds
- `withinTarget` should be `true`
- Deployment URL should be accessible

---

## 📊 Template Source Priority

The system uses this priority when selecting templates:

1. **GitHub Repositories** (Primary)
   - 83+ repositories scanned
   - Most up-to-date templates
   - Version controlled

2. **Google Drive** (Secondary)
   - Codenest_drive_data folder
   - Legacy templates
   - Backup source

3. **Fallback Generator** (Last Resort)
   - Generic HTML template
   - Used only if both GitHub and Drive fail
   - Ensures system always works

---

## 🎯 New API Endpoints

### Template Scanning

```bash
# Scan GitHub repositories
POST /api/templates/scan-github

# Scan Google Drive
POST /api/templates/scan-drive

# Get template statistics
GET /api/templates/stats

# Check template sources
GET /api/templates/sources
```

### Template Search

```bash
# Search across all sources
POST /api/templates/search
Content-Type: application/json

{
  "businessIntent": "SaaS startup for project management",
  "category": "saas",           # Optional: landing-page, dashboard, ecommerce, etc.
  "industry": "technology",     # Optional: restaurant, healthcare, finance, etc.
  "techStack": "react",         # Optional: react, vue, angular, etc.
  "limit": 10                   # Optional: default 50
}
```

### Deployment

```bash
# Deploy with intelligent template selection
POST /api/collapse
Content-Type: multipart/form-data

file: [business plan file]
prompt: [optional description]
license: [optional license key]
```

### System Status

```bash
# Health check
GET /health

# Detailed system status
GET /status
```

---

## 🔍 Troubleshooting

### Issue: "GitHub token not configured"

**Solution**: Set the GITHUB_TOKEN secret:
```bash
wrangler secret put GITHUB_TOKEN
```

### Issue: "Google Drive credentials not configured"

**Solution**: Set the GOOGLE_DRIVE_CREDENTIALS secret:
```bash
wrangler secret put GOOGLE_DRIVE_CREDENTIALS
```

### Issue: "Drive scan returns empty results"

**Possible causes**:
1. Codenest_drive_data folder not shared with service account
2. Service account email incorrect
3. Folder is empty

**Solution**:
- Verify folder is shared with service account email
- Check folder contains files
- Check folder name is exactly "Codenest_drive_data"

### Issue: "GitHub scan returns 401/403"

**Possible causes**:
1. GitHub token expired
2. Token doesn't have `repo` scope
3. Token not set correctly

**Solution**:
- Regenerate token with `repo` scope
- Re-set the GITHUB_TOKEN secret

### Issue: Template source is always "fallback"

**Possible causes**:
1. No templates match business intent
2. Repositories don't contain template files
3. Template paths not in expected locations

**Solution**:
- Check scan results: `GET /api/templates/stats`
- Verify repositories contain HTML/JSX/Vue files
- Check template files are in: templates/, public/, src/, pages/

---

## 📈 Performance Expectations

- **GitHub Scan**: First scan ~20-30s, subsequent scans <1s (cached)
- **Drive Scan**: First scan ~5-10s, subsequent scans <1s (cached)
- **Template Search**: <2s
- **Complete Deployment**: <180s (target)
- **Cache Duration**: 1 hour

---

## 🔒 Security Notes

1. **Secrets Management**:
   - Never commit credentials to git
   - Use Cloudflare secrets for sensitive data
   - Rotate tokens periodically

2. **Service Account Permissions**:
   - Only grant "Viewer" access to Drive
   - No write permissions needed

3. **GitHub Token**:
   - Use minimal required scopes
   - Consider using GitHub App instead of PAT for production

4. **Rate Limiting**:
   - GitHub: 5,000 requests/hour (authenticated)
   - Drive: No hard limit, but implement caching
   - Results cached for 1 hour

---

## 🎉 Next Steps

After completing this guide:

1. ✅ Update the landing page (hotstack.faa.zone) to show:
   - Template count from stats endpoint
   - System status (GitHub + Drive)
   - Source attribution in results

2. ✅ Monitor deployment performance:
   - Track elapsed times
   - Monitor template source distribution
   - Check cache hit rates

3. ✅ Populate Google Drive with templates:
   - Organize by category (landing/, dashboard/, ecommerce/)
   - Add README files for documentation
   - Tag templates with metadata

4. ✅ Optimize GitHub repositories:
   - Create dedicated template directories
   - Add template metadata files
   - Standardize naming conventions

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Cloudflare Worker logs: `wrangler tail`
- Check endpoint responses for error details

---

**Built with ❤️ using Cloudflare Workers, GitHub API, and Google Drive API**
