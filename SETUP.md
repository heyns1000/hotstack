# 🚀 HotStack Setup Guide

Complete step-by-step guide to get HotStack running with auto-deployment.

## ⏱️ Time Required: 10 minutes

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ GitHub account
- ✅ Cloudflare account
- ✅ Node.js 20+ installed
- ✅ Git installed

---

## 🔧 Step 1: Create GitHub Repository (2 minutes)

1. **Go to GitHub**
   - URL: https://github.com/new

2. **Fill in repository details:**
   ```
   Repository name: hotstack
   Description: HotStack File Orchestration System
   Visibility: Public or Private (your choice)
   ```

3. **Create repository**
   - Click "Create repository" button
   - Leave "Initialize with README" UNCHECKED

4. **Copy the repository URL**
   - It will look like: `https://github.com/YOUR-USERNAME/hotstack.git`
   - Keep this handy for Step 4

---

## 🔑 Step 2: Get Cloudflare API Token (3 minutes)

1. **Go to Cloudflare Dashboard**
   - URL: https://dash.cloudflare.com/profile/api-tokens

2. **Create API Token**
   - Click "Create Token"
   - Select "Edit Cloudflare Workers" template
   - Or use "Custom token" with these permissions:
     ```
     Account Settings - Read
     Workers Scripts - Edit
     Workers R2 Storage - Edit
     ```

3. **Configure token**
   - Zone Resources: `Include` → `All zones`
   - Account Resources: `Include` → Your account
   - Click "Continue to summary"
   - Click "Create Token"

4. **Copy the token**
   - **IMPORTANT**: Copy it NOW - you won't see it again!
   - Save it temporarily in a secure note

5. **Get your Account ID**
   - Your account ID: `ad41fcfe1a84b27c62cc5cc9d590720e`
   - (Already in wrangler.toml)

---

## 🔐 Step 3: Add GitHub Secrets (2 minutes)

1. **Go to your GitHub repository**
   - URL: `https://github.com/YOUR-USERNAME/hotstack/settings/secrets/actions`

2. **Add CLOUDFLARE_API_TOKEN**
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Paste the API token from Step 2
   - Click "Add secret"

3. **Add CLOUDFLARE_ACCOUNT_ID**
   - Click "New repository secret"
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: `ad41fcfe1a84b27c62cc5cc9d590720e`
   - Click "Add secret"

---

## 📦 Step 4: Push Code to GitHub (3 minutes)

1. **Extract the project**
   ```bash
   # If you downloaded the tarball
   tar -xzf hotstack-complete.tar.gz
   cd hotstack-complete
   
   # Or if you have the folder already
   cd hotstack-complete
   ```

2. **Initialize Git**
   ```bash
   git init
   git branch -M main
   ```

3. **Add your GitHub repository as remote**
   ```bash
   # Replace YOUR-USERNAME with your GitHub username
   git remote add origin https://github.com/YOUR-USERNAME/hotstack.git
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Initial commit - HotStack setup"
   git push -u origin main
   ```

5. **Watch the magic happen!**
   - Go to: `https://github.com/YOUR-USERNAME/hotstack/actions`
   - You'll see the deployment workflow running
   - It takes about 2 minutes to complete

---

## ✅ Step 5: Verify Deployment (1 minute)

1. **Check GitHub Actions**
   - URL: `https://github.com/YOUR-USERNAME/hotstack/actions`
   - Latest workflow should show ✅ green checkmark

2. **Check Cloudflare Dashboard**
   - URL: https://dash.cloudflare.com
   - Navigate to Workers & Pages
   - You should see `hotstack-worker` deployed

3. **Test the application**
   - URL: https://hotstack.faa.zone
   - You should see the upload interface
   - Try uploading a file!

---

## 🎉 Success Checklist

- ✅ GitHub repository created
- ✅ Cloudflare API token created
- ✅ GitHub secrets added
- ✅ Code pushed to GitHub
- ✅ GitHub Actions workflow completed
- ✅ Worker deployed to Cloudflare
- ✅ Application accessible at hotstack.faa.zone

---

## 🔄 Making Updates (Future)

Now that everything is set up, making updates is super easy:

```bash
# 1. Make your changes
nano src/index.js

# 2. Commit
git add .
git commit -m "Updated feature X"

# 3. Push (auto-deploys!)
git push

# 4. Wait 2 minutes - changes are live!
```

---

## 🐛 Troubleshooting

### GitHub Actions fails with "Invalid API token"

**Problem:** API token is incorrect or expired

**Solution:**
1. Create a new API token (Step 2)
2. Update the `CLOUDFLARE_API_TOKEN` secret in GitHub
3. Re-run the workflow

---

### Worker deployed but site not accessible

**Problem:** DNS or routing issue

**Solution:**
1. Check Cloudflare DNS settings
2. Verify `hotstack.faa.zone` exists in DNS
3. Check worker route in `wrangler.toml`
4. Wait 5 minutes for DNS propagation

---

### Files not uploading

**Problem:** R2 bucket not properly bound

**Solution:**
1. Check Cloudflare dashboard for R2 buckets
2. Verify `hotstack-bucket` exists
3. Check binding in `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "HOTSTACK_BUCKET"
   bucket_name = "hotstack-bucket"
   ```
4. Redeploy

---

### GitHub Actions workflow not triggering

**Problem:** Workflow file not in correct location

**Solution:**
1. Verify file exists at: `.github/workflows/deploy.yml`
2. Check file permissions
3. Try pushing a new commit
4. Manually trigger workflow from GitHub Actions tab

---

## 📞 Need Help?

- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **GitHub Actions:** https://docs.github.com/en/actions
- **Community:** https://community.cloudflare.com/

---

## 🎯 Next Steps

Now that your HotStack is running:

1. **Customize the interface**
   - Edit `src/index.js` → `getHTML()` function
   - Change colors, text, add features

2. **Add authentication**
   - Implement API key validation
   - Add user management

3. **Enable queue processing**
   - Uncomment queue section in `wrangler.toml`
   - Create queue consumer worker

4. **Add file processing**
   - Image resizing
   - PDF generation
   - File conversion

5. **Set up monitoring**
   - Add logging
   - Set up alerts
   - Track usage metrics

---

**🔥 You're all set! Welcome to HotStack!**
