# HotStack Troubleshooting Guide

This guide helps diagnose and resolve common issues with the HotStack File Orchestration System.

## Table of Contents
- [Configuration Issues](#configuration-issues)
- [Upload Problems](#upload-problems)
- [Authentication Issues](#authentication-issues)
- [Download Problems](#download-problems)
- [CORS Errors](#cors-errors)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Configuration Issues

### Worker Routes Not Working

**Symptoms**:
- 404 errors when accessing hotstack.faa.zone or fruitful.faa.zone
- Worker not responding to requests

**Solution**:
1. Verify routes are configured in `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "hotstack.faa.zone/*"
   zone_name = "faa.zone"
   
   [[routes]]
   pattern = "fruitful.faa.zone/*"
   zone_name = "faa.zone"
   ```

2. Check DNS settings in Cloudflare dashboard:
   - Ensure A/AAAA records exist for hotstack.faa.zone and fruitful.faa.zone
   - Verify proxy status is enabled (orange cloud)

3. Deploy the worker:
   ```bash
   npm run deploy
   ```

4. Test the routes:
   ```bash
   curl -I https://hotstack.faa.zone/
   curl -I https://fruitful.faa.zone/
   ```

### R2 Bucket Not Accessible

**Symptoms**:
- Error: "HOTSTACK_BUCKET is not defined"
- Upload fails with 500 error

**Solution**:
1. Verify R2 bucket exists:
   ```bash
   wrangler r2 bucket list
   ```

2. Create bucket if missing:
   ```bash
   wrangler r2 bucket create hotstack-intake-bucket
   ```

3. Check binding in `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "HOTSTACK_BUCKET"
   bucket_name = "hotstack-intake-bucket"
   ```

4. Redeploy:
   ```bash
   npm run deploy
   ```

### D1 Database Not Configured

**Symptoms**:
- Authentication endpoints return "Database not configured"
- Error: "DB is not defined"

**Solution**:
1. Create D1 database:
   ```bash
   wrangler d1 create hotstack-db
   ```

2. Note the database_id from output and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "hotstack-db"
   database_id = "YOUR_DATABASE_ID"
   ```

3. Initialize database schema:
   ```bash
   wrangler d1 execute hotstack-db --file=./schema.sql
   ```

4. Verify tables were created:
   ```bash
   wrangler d1 execute hotstack-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

5. Redeploy:
   ```bash
   npm run deploy
   ```

---

## Upload Problems

### Upload Fails with 401 Unauthorized

**Symptoms**:
- Upload returns "Unauthorized" error
- File does not appear in bucket

**Solution**:
1. Check if AUTH_SECRET is configured:
   ```bash
   wrangler secret list
   ```

2. If AUTH_SECRET exists, provide it in upload request:
   ```bash
   curl -X POST https://hotstack.faa.zone/api/upload \
     -H "Authorization: Bearer YOUR_SECRET" \
     -F "file=@test.txt"
   ```

3. To remove authentication requirement, delete the secret:
   ```bash
   wrangler secret delete AUTH_SECRET
   ```

4. Redeploy after removing secret:
   ```bash
   npm run deploy
   ```

### Upload Fails with 400 Bad Request

**Symptoms**:
- Error: "No file provided"
- FormData appears correct

**Solution**:
1. Ensure Content-Type is multipart/form-data
2. Check that form field is named "file":
   ```javascript
   const formData = new FormData();
   formData.append('file', fileInput.files[0]);
   ```

3. Test with cURL to verify server accepts uploads:
   ```bash
   curl -X POST https://hotstack.faa.zone/api/upload \
     -F "file=@test.txt"
   ```

### Large File Upload Times Out

**Symptoms**:
- Upload starts but never completes
- Network timeout after several minutes

**Solution**:
1. Check file size (R2 supports up to 5TB per object)
2. Verify streaming is enabled (should be by default)
3. Check network connectivity and firewall rules
4. Test with smaller file to isolate issue
5. Consider breaking very large files into chunks

### Progress Bar Not Working

**Symptoms**:
- Progress bar shows 0% or doesn't update
- Upload completes but no progress indication

**Solution**:
1. Verify XMLHttpRequest is used (not fetch):
   ```javascript
   const xhr = new XMLHttpRequest();
   
   xhr.upload.addEventListener('progress', (e) => {
     if (e.lengthComputable) {
       const percent = Math.round((e.loaded / e.total) * 100);
       updateProgressBar(percent);
     }
   });
   
   xhr.open('POST', '/api/upload');
   xhr.send(formData);
   ```

2. Check browser console for JavaScript errors
3. Test in different browsers (Chrome, Firefox, Safari)

---

## Authentication Issues

### Cannot Sign Up New User

**Symptoms**:
- Error: "User already exists"
- Error: "Database not configured"

**Solution**:
1. Verify D1 database is configured (see Database section)
2. Check if user already exists:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="SELECT email FROM users WHERE email='user@example.com';"
   ```

3. Delete existing user if needed:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="DELETE FROM users WHERE email='user@example.com';"
   ```

4. Verify password meets requirements (min 8 characters)
5. Check email format is valid

### Session Expired or Invalid

**Symptoms**:
- Error: "Invalid or expired session"
- User logged out automatically

**Solution**:
1. Sessions expire after 7 days - normal behavior
2. Check session in database:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="SELECT id, expires_at FROM sessions WHERE id='SESSION_ID';"
   ```

3. Clean up expired sessions:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="DELETE FROM sessions WHERE expires_at < datetime('now');"
   ```

4. Ask user to sign in again

### Password Hash Mismatch

**Symptoms**:
- Error: "Invalid credentials" despite correct password
- Cannot sign in after signup

**Solution**:
1. Verify bcryptjs is installed:
   ```bash
   npm list bcryptjs
   ```

2. Reinstall if missing:
   ```bash
   npm install bcryptjs
   ```

3. Check password_hash column in database:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="SELECT email, LENGTH(password_hash) FROM users;"
   ```
   (Hash should be 60 characters)

4. Reset user password by deleting and recreating account

### Cookie Not Being Set

**Symptoms**:
- Session cookie not appearing in browser
- User not staying logged in

**Solution**:
1. Verify HTTPS is used (cookies with Secure flag require HTTPS)
2. Check SameSite and domain settings
3. Test in incognito/private window
4. Check browser console for cookie warnings
5. Verify response includes Set-Cookie header:
   ```bash
   curl -i -X POST https://hotstack.faa.zone/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"test1234"}'
   ```

---

## Download Problems

### File Not Found (404)

**Symptoms**:
- Error: "File not found"
- File appears in list but cannot download

**Solution**:
1. Verify file exists in R2:
   ```bash
   wrangler r2 object get hotstack-intake-bucket/FILENAME
   ```

2. Check file key format (should include "hotstack/" prefix)
3. Ensure filename is URL-encoded:
   ```javascript
   const encodedFilename = encodeURIComponent(filename);
   fetch(`/api/file/${encodedFilename}`);
   ```

4. Test with cURL:
   ```bash
   curl "https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-test.txt"
   ```

### Download Starts But Corrupts

**Symptoms**:
- File downloads but cannot be opened
- Downloaded file size differs from original

**Solution**:
1. Verify Content-Type header is correct
2. Check that response includes Content-Length
3. Ensure no text transformations are applied
4. Test with different browsers
5. Compare checksums:
   ```bash
   # Upload
   md5sum original.pdf
   
   # Download
   curl https://hotstack.faa.zone/api/file/FILE_KEY > downloaded.pdf
   md5sum downloaded.pdf
   ```

### Filename Shows as Encoded String

**Symptoms**:
- Download filename is "hotstack%2F1699999999999-test.txt"
- Original filename not preserved

**Solution**:
1. Verify Content-Disposition header is set correctly:
   ```javascript
   'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`
   ```

2. Check custom metadata for original name:
   ```bash
   wrangler r2 object get hotstack-intake-bucket/FILE_KEY --metadata
   ```

3. Ensure originalName is stored during upload

---

## CORS Errors

### Browser Blocks Request (CORS Error)

**Symptoms**:
- Error: "No 'Access-Control-Allow-Origin' header"
- Request works with cURL but not in browser

**Solution**:
1. Verify CORS headers are set on all responses:
   ```javascript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   };
   ```

2. Test OPTIONS preflight:
   ```bash
   curl -X OPTIONS https://hotstack.faa.zone/api/upload \
     -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST"
   ```

3. Check response includes CORS headers:
   ```bash
   curl -I https://hotstack.faa.zone/api/files
   ```

4. For specific origins, update CORS policy:
   ```javascript
   'Access-Control-Allow-Origin': 'https://yourapp.com',
   ```

### Preflight Request Fails

**Symptoms**:
- OPTIONS request returns 404
- POST/DELETE requests never sent

**Solution**:
1. Ensure OPTIONS handler exists for all endpoints:
   ```javascript
   if (request.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
   ```

2. Verify Access-Control-Allow-Headers includes all needed headers
3. Check browser console for specific preflight errors

### Corporate Firewall Blocks CORS

**Symptoms**:
- Works from home but not at office
- Specific headers are stripped

**Solution**:
1. Contact IT department about CORS policy
2. Use VPN to bypass firewall
3. Consider deploying backend behind firewall
4. Test with different ports (if firewall allows)

---

## Database Issues

### Database Schema Not Initialized

**Symptoms**:
- Error: "no such table: users"
- Authentication endpoints fail

**Solution**:
1. Initialize schema from SQL file:
   ```bash
   wrangler d1 execute hotstack-db --file=./schema.sql
   ```

2. Verify tables exist:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

3. Expected tables:
   - users
   - sessions
   - user_preferences
   - audit_logs

### Database Connection Fails

**Symptoms**:
- Error: "Failed to connect to database"
- Intermittent database errors

**Solution**:
1. Check D1 binding in wrangler.toml
2. Verify database ID is correct
3. Test database connection:
   ```bash
   wrangler d1 execute hotstack-db --command="SELECT 1;"
   ```

4. Check Cloudflare status page for D1 outages
5. Redeploy worker

### Audit Logs Not Recording

**Symptoms**:
- audit_logs table is empty
- No errors but no logs appearing

**Solution**:
1. Verify audit_logs table exists:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="SELECT COUNT(*) FROM audit_logs;"
   ```

2. Check logAudit function is being called
3. Verify IP and user agent are captured correctly
4. Test manually:
   ```bash
   wrangler d1 execute hotstack-db \
     --command="INSERT INTO audit_logs (user_id, action, ip_address) VALUES (1, 'test', '127.0.0.1');"
   ```

---

## Performance Issues

### Slow File Uploads

**Solution**:
1. Check network speed: `ping hotstack.faa.zone`
2. Test upload speed to other services
3. Verify streaming is enabled (default)
4. Check server location (Cloudflare edge network)
5. Consider using Cloudflare's upload acceleration

### Dashboard Loads Slowly

**Solution**:
1. Check browser console for errors
2. Minimize particle count in animation
3. Reduce file list page size
4. Implement pagination for large lists
5. Cache static assets

### File List Takes Long Time

**Solution**:
1. Implement pagination:
   ```javascript
   const listed = await env.HOTSTACK_BUCKET.list({ 
     limit: 50,
     cursor: nextCursor 
   });
   ```

2. Add indexes to database queries
3. Cache frequently accessed data
4. Consider using Cloudflare KV for metadata

---

## Deployment Issues

### GitHub Actions Deploy Fails

**Symptoms**:
- Workflow fails with "Unauthorized"
- Deploy step exits with error

**Solution**:
1. Verify CLOUDFLARE_API_TOKEN is set in GitHub secrets:
   - Go to Settings → Secrets and variables → Actions
   - Check CLOUDFLARE_API_TOKEN exists

2. Verify token has correct permissions:
   - Workers R/W
   - Account Settings Read
   - D1 Read/Write

3. Generate new API token if needed:
   - https://dash.cloudflare.com/profile/api-tokens
   - Use "Edit Cloudflare Workers" template

4. Test token locally:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token"
   npm run deploy
   ```

### Deploy Succeeds But Changes Not Live

**Solution**:
1. Clear browser cache
2. Wait 1-2 minutes for edge propagation
3. Test with cURL to bypass cache:
   ```bash
   curl -H "Cache-Control: no-cache" https://hotstack.faa.zone/
   ```

4. Check deployment logs:
   ```bash
   npm run tail
   ```

5. Verify correct worker is deployed:
   ```bash
   wrangler deployments list
   ```

### Local Development Not Working

**Symptoms**:
- `npm run dev` fails
- Wrangler errors

**Solution**:
1. Verify Node.js version (requires 20+):
   ```bash
   node --version
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Update Wrangler:
   ```bash
   npm install -D wrangler@latest
   ```

4. Check wrangler.toml syntax
5. Run with verbose logging:
   ```bash
   wrangler dev --log-level debug
   ```

---

## Edge Cases

### Special Characters in Filenames

**Issue**: Files with special characters (spaces, unicode, etc.) may cause issues

**Solution**:
- Always URL-encode filenames in URLs
- Store original name in metadata
- Use encodeURIComponent() in JavaScript
- Test with various character sets

### Concurrent Uploads

**Issue**: Multiple simultaneous uploads may cause rate limiting

**Solution**:
- Implement client-side queue
- Add retry logic with exponential backoff
- Monitor rate limits in Cloudflare dashboard

### Daylight Saving Time Issues

**Issue**: Timestamps may be inconsistent across DST changes

**Solution**:
- Always use UTC timestamps (ISO 8601 format)
- Store as TEXT in SQLite
- Use datetime('now') for current time

### Mobile Safari Upload Issues

**Issue**: File uploads may fail on iOS Safari

**Solution**:
- Test accept attribute on file input
- Verify Content-Type is set correctly
- Check iOS version (older versions have bugs)
- Consider using native app wrapper

---

## Getting Help

If you continue to experience issues:

1. **Check Logs**:
   ```bash
   npm run tail
   ```

2. **Review Documentation**:
   - API_DOCUMENTATION.md
   - README.md
   - Cloudflare Workers docs

3. **Test Endpoints**:
   - Use API_DOCUMENTATION.md examples
   - Test with cURL before JavaScript
   - Check browser console

4. **Community Support**:
   - Cloudflare Community Forums
   - GitHub Issues
   - Stack Overflow

5. **Debug Checklist**:
   - [ ] Check browser console for errors
   - [ ] Verify network requests in DevTools
   - [ ] Test with cURL to isolate client/server issue
   - [ ] Check worker logs with `wrangler tail`
   - [ ] Verify environment variables and secrets
   - [ ] Test in incognito/private window
   - [ ] Try different browser/device
   - [ ] Check Cloudflare dashboard for errors
   - [ ] Verify DNS and routing configuration
   - [ ] Review recent code changes

---

*Last Updated: November 2024*
