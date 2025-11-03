# ⚡ Quick Commands Reference

One-page reference for common HotStack commands.

---

## 🚀 Initial Setup

```bash
# Extract and setup
tar -xzf hotstack-complete.tar.gz
cd hotstack-complete

# Install dependencies
npm install

# Initialize Git
git init
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hotstack.git

# First push
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 💻 Development

```bash
# Start dev server
npm run dev

# View at http://localhost:8787
```

---

## 📤 Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy specific environment
npm run deploy:production
```

---

## 🔄 Daily Workflow

```bash
# Make changes
nano src/index.js

# Test locally
npm run dev

# Commit and push (auto-deploys!)
git add .
git commit -m "Your message"
git push
```

---

## 📊 Monitoring

```bash
# View live logs
npm run tail

# Or watch logs in real-time
wrangler tail hotstack-worker
```

---

## 🐛 Debugging

```bash
# Check deployment status
git push
# Then visit: https://github.com/YOUR-USERNAME/hotstack/actions

# View worker logs
npm run tail

# Test locally
npm run dev

# Validate wrangler.toml
wrangler deploy --dry-run
```

---

## 🔧 Configuration

```bash
# Edit worker code
nano src/index.js

# Edit Cloudflare config
nano wrangler.toml

# Edit package info
nano package.json

# Edit workflow
nano .github/workflows/deploy.yml
```

---

## 📦 R2 Bucket Management

```bash
# List buckets (via dashboard)
# https://dash.cloudflare.com

# Create bucket (if needed)
wrangler r2 bucket create hotstack-bucket

# List objects
wrangler r2 object list hotstack-bucket

# Download object
wrangler r2 object get hotstack-bucket/filename.txt
```

---

## 🔑 Secrets Management

```bash
# Add secret locally
echo "VALUE" | wrangler secret put SECRET_NAME

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

---

## 🌐 Testing Endpoints

```bash
# Upload file
curl -X POST https://hotstack.faa.zone/upload \
  -F "file=@test.txt"

# List files
curl https://hotstack.faa.zone/files

# Get file
curl https://hotstack.faa.zone/file/test.txt

# Delete file
curl -X DELETE https://hotstack.faa.zone/file/test.txt

# Queue status
curl https://hotstack.faa.zone/queue/status

# Process file
curl -X POST https://hotstack.faa.zone/process \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.txt","action":"process"}'
```

---

## 🔄 Git Commands

```bash
# Check status
git status

# View changes
git diff

# Add all changes
git add .

# Commit
git commit -m "Your message"

# Push (triggers deployment)
git push

# Pull latest
git pull

# View history
git log --oneline

# Create branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name

# Undo last commit (keep changes)
git reset --soft HEAD^

# Discard all changes
git reset --hard HEAD
```

---

## 📁 File Structure

```
hotstack/
├── .github/workflows/deploy.yml   # Auto-deploy
├── src/index.js                   # Worker code
├── wrangler.toml                  # Config
├── package.json                   # Dependencies
├── README.md                      # Docs
├── SETUP.md                       # Setup guide
└── .gitignore                     # Git rules
```

---

## 🆘 Emergency Commands

```bash
# Roll back to previous version
git revert HEAD
git push

# Force redeploy
git commit --allow-empty -m "Redeploy"
git push

# Check worker status
curl -I https://hotstack.faa.zone

# View Cloudflare dashboard
open https://dash.cloudflare.com
```

---

## 📚 Quick Links

- **Live Site:** https://hotstack.faa.zone
- **GitHub:** https://github.com/YOUR-USERNAME/hotstack
- **Actions:** https://github.com/YOUR-USERNAME/hotstack/actions
- **CF Dashboard:** https://dash.cloudflare.com
- **CF Workers:** https://dash.cloudflare.com/workers
- **CF R2:** https://dash.cloudflare.com/r2
- **API Tokens:** https://dash.cloudflare.com/profile/api-tokens

---

## 💡 Pro Tips

```bash
# Watch file changes and auto-restart dev server
npm run dev -- --local-protocol=https

# Deploy with custom message
git commit -m "feat: add new feature"

# View detailed logs with timestamps
wrangler tail --format pretty

# Test before deploying
npm run dev
# Test thoroughly, then push

# Quick commit
git add . && git commit -m "Quick update" && git push
```

---

**📝 Bookmark this page for quick reference!**
