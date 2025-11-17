# HotStack Test Plan

This document outlines the testing procedures for validating HotStack functionality across all features and use cases.

## Test Environment Setup

### Prerequisites
1. Node.js 20+ installed
2. Cloudflare account with Workers, R2, and D1 enabled
3. GitHub account with repository access
4. Multiple browsers for cross-browser testing (Chrome, Firefox, Safari, Edge)
5. Mobile device or emulator for mobile testing

### Configuration
1. Clone repository: `git clone https://github.com/heyns1000/hotstack.git`
2. Install dependencies: `npm install`
3. Configure wrangler.toml with your account_id and database_id
4. Initialize D1 database: `wrangler d1 execute hotstack-db --file=./schema.sql`
5. Create R2 bucket: `wrangler r2 bucket create hotstack-intake-bucket`

---

## Test Categories

### 1. Infrastructure & Configuration Tests

#### Test 1.1: Worker Route Binding
**Objective**: Verify worker responds on both domains

**Steps**:
1. Deploy worker: `npm run deploy`
2. Open https://hotstack.faa.zone/
3. Open https://fruitful.faa.zone/

**Expected Results**:
- ✅ Both URLs load without 404 errors
- ✅ hotstack.faa.zone shows HotStack landing page
- ✅ fruitful.faa.zone shows Fruitful integration page
- ✅ Response headers include CORS headers
- ✅ No SSL errors

**Pass Criteria**: All domains respond with correct content

---

#### Test 1.2: R2 Bucket Connection
**Objective**: Verify R2 bucket is accessible

**Steps**:
1. Upload test file via dashboard
2. Check Cloudflare dashboard → R2 → hotstack-intake-bucket
3. Verify file appears in bucket

**Expected Results**:
- ✅ File appears in R2 bucket
- ✅ File has correct metadata
- ✅ Manifest file is created

**Pass Criteria**: File successfully stored in R2

---

#### Test 1.3: D1 Database Connection
**Objective**: Verify D1 database is accessible

**Steps**:
1. Navigate to /auth-test
2. Create new user account
3. Verify user in database: `wrangler d1 execute hotstack-db --command="SELECT * FROM users;"`

**Expected Results**:
- ✅ User account created
- ✅ Password is hashed (60 characters)
- ✅ User appears in database query

**Pass Criteria**: Database operations succeed

---

### 2. API Endpoint Tests

#### Test 2.1: Upload Endpoint - /api/upload
**Objective**: Test file upload functionality

**Test Cases**:

**2.1.1: Basic Upload**
```bash
curl -X POST https://hotstack.faa.zone/api/upload \
  -F "file=@test.txt"
```

**Expected**: 200 OK with success response

**2.1.2: Upload with Authentication**
```bash
curl -X POST https://hotstack.faa.zone/api/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.txt"
```

**Expected**: 200 OK if token is correct, 401 if incorrect

**2.1.3: Upload Large File (>100MB)**
```bash
dd if=/dev/zero of=large.bin bs=1M count=100
curl -X POST https://hotstack.faa.zone/api/upload \
  -F "file=@large.bin"
```

**Expected**: 200 OK with proper streaming

**2.1.4: Upload Special Characters Filename**
```bash
curl -X POST https://hotstack.faa.zone/api/upload \
  -F "file=@test file (1) [copy].txt"
```

**Expected**: 200 OK, filename preserved in metadata

**Pass Criteria**: All test cases pass

---

#### Test 2.2: List Files - /api/files
**Objective**: Test file listing

**Steps**:
```bash
curl https://hotstack.faa.zone/api/files
```

**Expected Results**:
- ✅ Returns JSON array of files
- ✅ Each file has key, size, uploaded timestamp
- ✅ Count matches actual number of files

**Pass Criteria**: Correct file list returned

---

#### Test 2.3: Download File - /api/file/:filename
**Objective**: Test file download

**Test Cases**:

**2.3.1: Download Text File**
```bash
curl "https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-test.txt" \
  --output downloaded.txt
```

**Expected**: File downloads with correct content

**2.3.2: Download Binary File (PDF, Image)**
```bash
curl "https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-test.pdf" \
  --output downloaded.pdf
```

**Expected**: File downloads without corruption

**2.3.3: Check Headers**
```bash
curl -I "https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-test.txt"
```

**Expected Headers**:
- Content-Type: correct MIME type
- Content-Disposition: attachment; filename="..."
- Content-Length: correct size
- Access-Control-Allow-Origin: *

**Pass Criteria**: All downloads succeed with correct headers

---

#### Test 2.4: Delete File - /api/file/:filename
**Objective**: Test file deletion

**Steps**:
```bash
curl -X DELETE "https://hotstack.faa.zone/api/file/hotstack%2F1699999999999-test.txt"
```

**Expected Results**:
- ✅ Returns success message
- ✅ File removed from R2
- ✅ Manifest file also removed
- ✅ Subsequent GET returns 404

**Pass Criteria**: File successfully deleted

---

#### Test 2.5: Status Endpoint - /api/status
**Objective**: Test recent uploads listing

**Steps**:
```bash
curl https://hotstack.faa.zone/api/status
```

**Expected Results**:
- ✅ Returns last 10 uploads
- ✅ Filters out manifest files
- ✅ Includes timestamp and size

**Pass Criteria**: Correct recent files returned

---

#### Test 2.6: CORS Preflight - OPTIONS
**Objective**: Test CORS preflight requests

**Steps**:
```bash
curl -X OPTIONS https://hotstack.faa.zone/api/upload \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"
```

**Expected Results**:
- ✅ 200 OK response
- ✅ Access-Control-Allow-Origin: *
- ✅ Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- ✅ Access-Control-Allow-Headers: Content-Type, Authorization

**Pass Criteria**: CORS headers present on all endpoints

---

### 3. Authentication Tests

#### Test 3.1: User Signup
**Objective**: Test user registration

**Test Cases**:

**3.1.1: Valid Signup**
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePass123",
    "username": "testuser"
  }'
```

**Expected**: 201 Created, user created

**3.1.2: Duplicate Email**
```bash
# Create same user twice
```

**Expected**: 409 Conflict, "User already exists"

**3.1.3: Invalid Email**
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "securePass123"
  }'
```

**Expected**: 400 Bad Request, "Invalid email format"

**3.1.4: Short Password**
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "short"
  }'
```

**Expected**: 400 Bad Request, "Password must be at least 8 characters"

**Pass Criteria**: All validation rules enforced

---

#### Test 3.2: User Signin
**Objective**: Test user authentication

**Test Cases**:

**3.2.1: Valid Signin**
```bash
curl -i -X POST https://hotstack.faa.zone/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePass123"
  }'
```

**Expected**:
- 200 OK
- Returns sessionId and user info
- Set-Cookie header with session cookie

**3.2.2: Invalid Password**
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpass"
  }'
```

**Expected**: 401 Unauthorized, "Invalid email or password"

**3.2.3: Non-existent User**
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password"
  }'
```

**Expected**: 401 Unauthorized, "Invalid email or password"

**Pass Criteria**: Only valid credentials succeed

---

#### Test 3.3: Get Current User
**Objective**: Test authenticated endpoint

**Steps**:
1. Sign in to get session ID
2. Call /api/auth/me with session
```bash
curl https://hotstack.faa.zone/api/auth/me \
  -H "Authorization: Bearer SESSION_ID"
```

**Expected Results**:
- ✅ Returns user information
- ✅ Includes id, email, username, timestamps
- ✅ Does not include password_hash

**Pass Criteria**: User info returned correctly

---

#### Test 3.4: User Signout
**Objective**: Test session invalidation

**Steps**:
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signout \
  -H "Authorization: Bearer SESSION_ID"
```

**Expected Results**:
- ✅ Returns success message
- ✅ Session removed from database
- ✅ Set-Cookie clears cookie
- ✅ Subsequent /api/auth/me fails

**Pass Criteria**: Session properly invalidated

---

### 4. Frontend Feature Tests

#### Test 4.1: Drag & Drop Upload
**Objective**: Test drag and drop functionality

**Steps**:
1. Open https://hotstack.faa.zone/dashboard
2. Drag file from desktop onto upload zone
3. Drop file

**Expected Results**:
- ✅ Upload zone highlights on dragover
- ✅ Progress bar appears
- ✅ Progress updates in real-time
- ✅ Success message shows
- ✅ File appears in recent files list
- ✅ Status console logs upload

**Pass Criteria**: Drag & drop works smoothly

---

#### Test 4.2: Multi-file Upload
**Objective**: Test uploading multiple files

**Steps**:
1. Open dashboard
2. Click upload zone
3. Select multiple files (3-5 files)
4. Observe upload progress

**Expected Results**:
- ✅ All files upload sequentially
- ✅ Progress shown for each file
- ✅ Status console logs each upload
- ✅ All files appear in list
- ✅ Metrics update correctly

**Pass Criteria**: Multiple files upload successfully

---

#### Test 4.3: XHR Progress Bar
**Objective**: Test real-time progress indication

**Steps**:
1. Open /intake page
2. Upload large file (>10MB)
3. Watch progress bar

**Expected Results**:
- ✅ Progress bar shows 0% initially
- ✅ Progress updates smoothly (0-100%)
- ✅ Percentage text updates
- ✅ Bytes uploaded/total displayed
- ✅ Completes at 100%

**Pass Criteria**: Accurate progress tracking

---

#### Test 4.4: Instant File Listing
**Objective**: Test file list updates

**Steps**:
1. Open dashboard
2. Note current file count
3. Upload new file
4. Observe file list

**Expected Results**:
- ✅ File appears in list immediately after upload
- ✅ No page refresh needed
- ✅ Metrics update automatically
- ✅ File details shown correctly

**Pass Criteria**: List updates automatically

---

#### Test 4.5: Real-time Metrics
**Objective**: Test metrics dashboard

**Steps**:
1. Open dashboard
2. Note metrics (total uploads, storage, recent)
3. Upload file
4. Delete file
5. Observe metrics

**Expected Results**:
- ✅ Total uploads increments after upload
- ✅ Storage used increases
- ✅ Recent activity updates
- ✅ Metrics decrease after delete

**Pass Criteria**: Metrics accurately reflect state

---

#### Test 4.6: Status Console
**Objective**: Test live logging

**Steps**:
1. Open dashboard
2. Perform various actions:
   - Upload file
   - Delete file
   - Click hub cards
3. Observe console

**Expected Results**:
- ✅ Each action logged with timestamp
- ✅ Different event types shown (UPLOAD, DELETE, etc.)
- ✅ Console scrolls with new entries
- ✅ Last 10 entries kept

**Pass Criteria**: All actions logged correctly

---

#### Test 4.7: Delete Modal
**Objective**: Test delete confirmation

**Steps**:
1. Open dashboard with files
2. Click delete button on a file
3. Observe modal
4. Click Cancel
5. Click Delete again
6. Click Confirm

**Expected Results**:
- ✅ Modal appears with file name
- ✅ Warning message displayed
- ✅ Cancel closes modal without delete
- ✅ Confirm deletes file
- ✅ Status console logs deletion
- ✅ File removed from list

**Pass Criteria**: Delete confirmation works correctly

---

### 5. Mobile & Accessibility Tests

#### Test 5.1: Mobile Responsive Design
**Objective**: Test mobile layout

**Devices to Test**:
- iPhone 12/13/14 (Safari)
- Samsung Galaxy S21/S22 (Chrome)
- iPad (Safari)

**Steps**:
1. Open all pages on mobile device
2. Test all functionality

**Expected Results**:
- ✅ Layout adjusts to screen size
- ✅ Text readable without zoom
- ✅ Buttons easily tappable
- ✅ Upload zone works with touch
- ✅ Modals fit on screen
- ✅ No horizontal scrolling

**Pass Criteria**: All features work on mobile

---

#### Test 5.2: Keyboard Navigation
**Objective**: Test keyboard-only usage

**Steps**:
1. Open dashboard
2. Navigate using only Tab, Enter, Escape
3. Attempt all operations

**Expected Results**:
- ✅ Can tab through all interactive elements
- ✅ Focus indicators visible
- ✅ Enter activates buttons
- ✅ Escape closes modals
- ✅ No keyboard traps

**Pass Criteria**: Full keyboard access

---

#### Test 5.3: Screen Reader (Basic)
**Objective**: Test screen reader compatibility

**Tools**: VoiceOver (Mac), NVDA (Windows), TalkBack (Android)

**Steps**:
1. Enable screen reader
2. Navigate through dashboard
3. Test form inputs

**Expected Results**:
- ✅ All elements announced
- ✅ Button purposes clear
- ✅ Form fields labeled
- ✅ Status messages announced
- ✅ Modal content accessible

**Pass Criteria**: Screen reader can navigate effectively

---

### 6. Cross-Browser Tests

**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Test Matrix**: Run Tests 4.1-4.7 on each browser

**Expected Results**:
- ✅ All features work consistently
- ✅ UI renders correctly
- ✅ No JavaScript errors
- ✅ File operations succeed

**Pass Criteria**: All browsers pass all tests

---

### 7. Performance Tests

#### Test 7.1: Large File Upload
**Objective**: Test file size limits

**Steps**:
1. Create test files: 100MB, 500MB, 1GB
2. Upload each size
3. Monitor progress and completion

**Expected Results**:
- ✅ All sizes upload successfully
- ✅ No timeout errors
- ✅ Progress accurate
- ✅ Memory usage stable

**Pass Criteria**: Large files handled efficiently

---

#### Test 7.2: Concurrent Uploads
**Objective**: Test simultaneous operations

**Steps**:
1. Open dashboard in 3 browser tabs
2. Upload file in each tab simultaneously
3. Monitor all tabs

**Expected Results**:
- ✅ All uploads succeed
- ✅ No conflicts
- ✅ All files appear in R2
- ✅ Metrics update correctly

**Pass Criteria**: Concurrent operations don't interfere

---

#### Test 7.3: Dashboard Load Time
**Objective**: Measure page performance

**Steps**:
1. Clear browser cache
2. Open dashboard
3. Measure time to interactive

**Expected Results**:
- ✅ Initial load < 3 seconds
- ✅ Time to interactive < 5 seconds
- ✅ Particle animation smooth (60fps)
- ✅ File list loads quickly

**Pass Criteria**: Good performance scores

---

### 8. Error Handling Tests

#### Test 8.1: Network Interruption
**Objective**: Test upload resilience

**Steps**:
1. Start large file upload
2. Disable network mid-upload
3. Re-enable network

**Expected Results**:
- ✅ Error message displayed
- ✅ User notified of failure
- ✅ Can retry upload

**Pass Criteria**: Errors handled gracefully

---

#### Test 8.2: Invalid File Operations
**Objective**: Test error scenarios

**Test Cases**:
- Upload with no file selected
- Delete non-existent file
- Download missing file
- Authenticate with bad credentials

**Expected Results**:
- ✅ Appropriate error messages
- ✅ No crashes or hangs
- ✅ User can recover

**Pass Criteria**: All errors handled properly

---

### 9. Security Tests

#### Test 9.1: XSS Prevention
**Objective**: Test against XSS attacks

**Steps**:
1. Upload file named: `<script>alert('XSS')</script>.txt`
2. View file in dashboard
3. Download file

**Expected Results**:
- ✅ Filename displayed safely (escaped)
- ✅ No script execution
- ✅ Download works correctly

**Pass Criteria**: No XSS vulnerabilities

---

#### Test 9.2: SQL Injection (Auth)
**Objective**: Test database input validation

**Steps**:
```bash
curl -X POST https://hotstack.faa.zone/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "pass123",
    "username": "admin'; DROP TABLE users; --"
  }'
```

**Expected Results**:
- ✅ Username stored as-is (escaped)
- ✅ No SQL execution
- ✅ Tables intact

**Pass Criteria**: Prepared statements prevent injection

---

#### Test 9.3: Authentication Bypass
**Objective**: Test auth enforcement

**Steps**:
1. Access /api/auth/me without credentials
2. Try invalid session ID
3. Try expired session

**Expected Results**:
- ✅ All return 401 Unauthorized
- ✅ No information leaked
- ✅ Session validation strict

**Pass Criteria**: Authentication properly enforced

---

## Test Execution Checklist

- [ ] All infrastructure tests pass
- [ ] All API endpoint tests pass
- [ ] All authentication tests pass
- [ ] All frontend feature tests pass
- [ ] Mobile responsive tests pass
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Cross-browser tests pass
- [ ] Performance tests meet criteria
- [ ] Error handling robust
- [ ] Security tests pass
- [ ] No console errors in any test
- [ ] Documentation accurate

---

## Bug Reporting Template

**Title**: [Brief description]

**Environment**:
- Browser/Device:
- URL:
- Date/Time:

**Steps to Reproduce**:
1. ...
2. ...

**Expected Behavior**:
...

**Actual Behavior**:
...

**Screenshots**:
[Attach if applicable]

**Console Errors**:
```
[Paste any console errors]
```

**Severity**:
- [ ] Critical (blocks core functionality)
- [ ] High (major feature broken)
- [ ] Medium (feature partially broken)
- [ ] Low (cosmetic/minor issue)

---

## Testing Sign-off

**Tester Name**: _______________
**Date**: _______________
**Version Tested**: _______________

**Summary**:
- Tests Passed: _____ / _____
- Tests Failed: _____
- Bugs Found: _____

**Recommendation**:
- [ ] Ready for production
- [ ] Needs fixes before deployment
- [ ] Requires additional testing

**Notes**:
_________________________________________________
_________________________________________________

---

*Last Updated: November 2024*
