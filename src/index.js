/**
 * HotStack File Orchestration System
 * Worker for hotstack.faa.zone
 * 
 * Features:
 * - File upload interface (drag & drop)
 * - R2 bucket integration
 * - Queue processing system
 * - Backend integration with Replit
 * - User authentication with D1 database
 */

import {
  createUser,
  authenticateUser,
  verifySession,
  deleteSession,
  logAudit,
  getUserById
} from './db/users.js';

// Session configuration
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const hostname = url.hostname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Authentication endpoints
      if (path === '/api/auth/signup' && request.method === 'POST') {
        return await handleSignup(request, env, corsHeaders);
      }

      if (path === '/api/auth/signin' && request.method === 'POST') {
        return await handleSignin(request, env, corsHeaders);
      }

      if (path === '/api/auth/signout' && request.method === 'POST') {
        return await handleSignout(request, env, corsHeaders);
      }

      if (path === '/api/auth/me' && request.method === 'GET') {
        return await handleGetMe(request, env, corsHeaders);
      }

      // Route: Upload file to R2
      if (path === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env, corsHeaders);
      }

      // Route: List files in R2
      if (path === '/files' && request.method === 'GET') {
        return await handleListFiles(env, corsHeaders);
      }

      // Route: Get specific file from R2
      if (path.startsWith('/file/') && request.method === 'GET') {
        const filename = path.slice(6);
        return await handleGetFile(filename, env, corsHeaders);
      }

      // Route: Delete file from R2
      if (path.startsWith('/file/') && request.method === 'DELETE') {
        const filename = path.slice(6);
        return await handleDeleteFile(filename, env, corsHeaders);
      }

      // Route: Queue processing status
      if (path === '/queue/status' && request.method === 'GET') {
        return await handleQueueStatus(env, corsHeaders);
      }

      // Route: Process file via queue
      if (path === '/process' && request.method === 'POST') {
        return await handleProcessFile(request, env, corsHeaders);
      }

      // Route: Landing page
      if (path === '/' || path === '/index.html') {
        // Serve fruitful page for fruitful.faa.zone
        if (hostname.includes('fruitful')) {
          return new Response(getFruitfulHTML(), {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders,
            },
          });
        }
        
        // Serve hotstack page for hotstack.faa.zone
        return new Response(getLandingPageHTML(), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders,
          },
        });
      }

      // Route: Dashboard
      if (path === '/dashboard') {
        return new Response(getDashboardHTML(), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders,
          },
        });
      }

      // Route: Auth test page
      if (path === '/auth-test' || path === '/auth-test.html') {
        return new Response(getAuthTestHTML(), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders,
          },
        });
      }

      // Route: Auth client JavaScript
      if (path === '/js/auth.js') {
        return new Response(getAuthClientJS(), {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            ...corsHeaders,
          },
        });
      }

      // 404 for unknown routes
      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },

  // Queue handler for processing messages
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const data = message.body;
        console.log('Processing queue message:', data);
        
        // Process the queue message
        if (data.filename) {
          console.log(`Queue processing file: ${data.filename}`);
          // Additional processing logic can be added here
        }
        
        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        // Retry failed messages
        message.retry();
      }
    }
  },
};

/**
 * Extract session ID from cookie or Authorization header
 */
function getSessionId(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get client IP address
 */
function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         'unknown';
}

/**
 * Handle user signup
 */
async function handleSignup(request, env, corsHeaders) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await createUser(env.DB, email, password, username);

    // Log audit
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('User-Agent');
    await logAudit(env.DB, user.id, 'signup', null, ipAddress, userAgent);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    const statusCode = error.message === 'User already exists' ? 409 : 400;
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle user signin
 */
async function handleSignin(request, env, corsHeaders) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const result = await authenticateUser(env.DB, email, password);

    // Log audit
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('User-Agent');
    await logAudit(env.DB, result.user.id, 'signin', null, ipAddress, userAgent);

    // Set session cookie
    const cookieHeader = `session=${result.sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;

    return new Response(JSON.stringify({
      success: true,
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
      user: result.user
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
        ...corsHeaders 
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message === 'Invalid credentials' ? 'Invalid email or password' : error.message
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle user signout
 */
async function handleSignout(request, env, corsHeaders) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify session to get user ID for audit log
    const session = await verifySession(env.DB, sessionId);
    if (session) {
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('User-Agent');
      await logAudit(env.DB, session.user.id, 'signout', null, ipAddress, userAgent);
    }

    await deleteSession(env.DB, sessionId);

    // Clear session cookie
    const cookieHeader = 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

    return new Response(JSON.stringify({
      success: true,
      message: 'Signed out successfully'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
        ...corsHeaders 
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Signout failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Get current user info
 */
async function handleGetMe(request, env, corsHeaders) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const session = await verifySession(env.DB, sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get full user details
    const user = await getUserById(env.DB, session.user.id);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get user info'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle file upload to R2 bucket
 */
async function handleUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const filename = file.name;
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2 bucket
    await env.HOTSTACK_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        size: arrayBuffer.byteLength.toString(),
      },
    });

    // Send to queue for processing (if queue is configured)
    if (env.HOTSTACK_QUEUE) {
      await env.HOTSTACK_QUEUE.send({
        filename,
        size: arrayBuffer.byteLength,
        contentType: file.type,
        timestamp: Date.now(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      filename,
      size: arrayBuffer.byteLength,
      message: 'File uploaded successfully',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Upload failed', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * List all files in R2 bucket
 */
async function handleListFiles(env, corsHeaders) {
  try {
    const listed = await env.HOTSTACK_BUCKET.list();
    
    const files = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      httpMetadata: obj.httpMetadata,
    }));

    return new Response(JSON.stringify({
      files,
      count: files.length,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to list files', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Get a specific file from R2 bucket
 */
async function handleGetFile(filename, env, corsHeaders) {
  try {
    const object = await env.HOTSTACK_BUCKET.get(filename);

    if (!object) {
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const headers = {
      'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
      'Content-Length': object.size,
      ...corsHeaders,
    };

    return new Response(object.body, { headers });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve file', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Delete a file from R2 bucket
 */
async function handleDeleteFile(filename, env, corsHeaders) {
  try {
    await env.HOTSTACK_BUCKET.delete(filename);

    return new Response(JSON.stringify({
      success: true,
      message: `File ${filename} deleted successfully`,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to delete file', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Get queue processing status
 */
async function handleQueueStatus(env, corsHeaders) {
  return new Response(JSON.stringify({
    queueEnabled: !!env.HOTSTACK_QUEUE,
    timestamp: Date.now(),
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Process file via queue system
 */
async function handleProcessFile(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { filename, action } = body;

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if file exists
    const object = await env.HOTSTACK_BUCKET.get(filename);
    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Send to queue for processing
    if (env.HOTSTACK_QUEUE) {
      await env.HOTSTACK_QUEUE.send({
        filename,
        action: action || 'process',
        timestamp: Date.now(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'File queued for processing',
      filename,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Processing failed', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Fruitful page HTML with HotStack section
 */
function getFruitfulHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fruitful | HotStack™</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #1a1a1c;
            color: #ffffff;
            line-height: 1.6;
        }
        .header {
            background: rgba(26, 27, 32, 0.95);
            backdrop-filter: blur(20px);
            padding: 1.5rem 2rem;
            border-bottom: 1px solid rgba(255, 204, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffcc00 0%, #ff9900 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }
        .hero {
            text-align: center;
            padding: 6rem 2rem 4rem;
            background: linear-gradient(180deg, #1a1a1c 0%, #2a2a2c 100%);
        }
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #ffcc00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 1.3rem;
            color: #aaa;
            margin-bottom: 2rem;
        }
        .hotstack-section {
            max-width: 1200px;
            margin: 4rem auto;
            padding: 0 2rem;
        }
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #ffcc00;
            text-align: center;
        }
        .section-subtitle {
            text-align: center;
            font-size: 1.2rem;
            color: #aaa;
            margin-bottom: 3rem;
        }
        .auth-container {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 204, 0, 0.2);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 3rem;
            backdrop-filter: blur(10px);
        }
        .auth-status {
            text-align: center;
            padding: 1.5rem;
            border-radius: 8px;
            background: rgba(255, 204, 0, 0.1);
            margin-bottom: 1.5rem;
        }
        .upload-zone {
            border: 3px dashed rgba(255, 204, 0, 0.3);
            border-radius: 12px;
            padding: 4rem 2rem;
            text-align: center;
            background: rgba(255, 204, 0, 0.05);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .upload-zone:hover,
        .upload-zone.drag-over {
            border-color: #ffcc00;
            background: rgba(255, 204, 0, 0.1);
            transform: translateY(-2px);
        }
        .upload-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .btn {
            background: linear-gradient(135deg, #ffcc00 0%, #ff9900 100%);
            color: #1a1a1c;
            border: none;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-block;
            text-decoration: none;
            margin: 0.5rem;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 204, 0, 0.3);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
        .status-message {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            display: none;
        }
        .status-message.success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4caf50;
        }
        .status-message.error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            color: #f44336;
        }
        input {
            width: 100%;
            padding: 1rem;
            margin: 0.5rem 0;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 204, 0, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin: 4rem 0;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 204, 0, 0.2);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: #ffcc00;
            background: rgba(255, 204, 0, 0.1);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .feature-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #ffcc00;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🍊 Fruitful | HotStack™</div>
    </div>

    <div class="hero">
        <h1>Welcome to Fruitful</h1>
        <p>Powered by HotStack™ Technology</p>
    </div>

    <div class="hotstack-section">
        <h2 class="section-title">🔥 HotStack™</h2>
        <p class="section-subtitle">Omnidrop Your Digital Presence</p>

        <div class="auth-container">
            <div class="auth-status" id="authStatus">
                <div id="notAuthenticated">
                    <p>Please sign in to use HotStack™</p>
                    <input type="email" id="emailInput" placeholder="Email" />
                    <input type="password" id="passwordInput" placeholder="Password" />
                    <input type="text" id="usernameInput" placeholder="Username (for signup)" />
                    <div>
                        <button class="btn" onclick="handleSignup()">Sign Up</button>
                        <button class="btn btn-secondary" onclick="handleSignin()">Sign In</button>
                    </div>
                </div>
                <div id="authenticated" style="display: none;">
                    <p>Welcome, <span id="userName"></span>!</p>
                    <button class="btn btn-secondary" onclick="handleSignout()">Sign Out</button>
                </div>
            </div>

            <div id="uploadSection" style="display: none;">
                <div class="upload-zone" id="dropZone">
                    <div class="upload-icon">📁</div>
                    <h3>Drag & Drop Files Here</h3>
                    <p>or click to browse</p>
                    <input type="file" id="fileInput" style="display: none;" />
                </div>
                <div class="status-message" id="statusMessage"></div>
            </div>
        </div>

        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">🚀</div>
                <div class="feature-title">Instant Upload</div>
                <p>Lightning-fast file uploads to R2 storage</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <div class="feature-title">Secure Auth</div>
                <p>D1 database with bcrypt password hashing</p>
            </div>
            <div class="feature-card">
                <div-icon">⚡</div>
                <div class="feature-title">Real-time</div>
                <p>Queue processing for instant updates</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🌐</div>
                <div class="feature-title">Edge Network</div>
                <p>Deployed on Cloudflare's global network</p>
            </div>
        </div>
    </div>

    <script src="/js/auth.js"></script>
    <script>
        let currentUser = null;

        // Check auth status on load
        async function checkAuthStatus() {
            try {
                const user = await auth.getCurrentUser();
                if (user) {
                    currentUser = user;
                    document.getElementById('notAuthenticated').style.display = 'none';
                    document.getElementById('authenticated').style.display = 'block';
                    document.getElementById('userName').textContent = user.username || user.email;
                    document.getElementById('uploadSection').style.display = 'block';
                }
            } catch (error) {
                console.log('Not authenticated');
            }
        }

        async function handleSignup() {
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            const username = document.getElementById('usernameInput').value;

            try {
                await auth.signup(email, password, username);
                showMessage('Account created! Signing in...', 'success');
                setTimeout(() => handleSignin(), 1000);
            } catch (error) {
                showMessage('Signup failed: ' + error.message, 'error');
            }
        }

        async function handleSignin() {
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;

            try {
                const result = await auth.signin(email, password);
                showMessage('Signed in successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                showMessage('Signin failed: ' + error.message, 'error');
            }
        }

        async function handleSignout() {
            try {
                await auth.signout();
                showMessage('Signed out successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                showMessage('Signout failed: ' + error.message, 'error');
            }
        }

        function showMessage(message, type) {
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.textContent = message;
            statusMessage.className = \`status-message \${type}\`;
            statusMessage.style.display = 'block';
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }

        // File upload handling
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                await uploadFile(files[0]);
            }
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await uploadFile(e.target.files[0]);
            }
        });

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                showMessage('Uploading...', 'success');
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    showMessage(\`File uploaded successfully! \${result.filename}\`, 'success');
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                showMessage('Upload failed: ' + error.message, 'error');
            }
        }

        // Initialize
        checkAuthStatus();
    </script>
</body>
</html>
`;
}

/**
 * Landing page HTML with HotStack branding
 */
function getLandingPageHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotStack™ - Omnidrop Your Digital Presence</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow: hidden;
            position: relative;
        }

        #particleCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }

        .container {
            background: rgba(20, 20, 30, 0.95);
            border-radius: 30px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 50px rgba(255, 215, 0, 0.2);
            padding: 60px 50px;
            max-width: 700px;
            width: 100%;
            position: relative;
            z-index: 1;
            border: 2px solid rgba(255, 215, 0, 0.3);
        }

        h1 {
            color: #FFD700;
            margin-bottom: 10px;
            font-size: 3.5em;
            text-align: center;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .fire-emoji {
            display: inline-block;
            animation: flicker 2s infinite;
        }

        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .tagline {
            color: #FFD700;
            margin-bottom: 30px;
            font-size: 1.3em;
            text-align: center;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .countdown {
            text-align: center;
            margin-bottom: 40px;
            font-size: 2.5em;
            color: #FFD700;
            font-weight: bold;
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
            font-family: 'Courier New', monospace;
        }

        .features {
            margin: 30px 0;
            color: #fff;
        }

        .feature-item {
            margin: 15px 0;
            display: flex;
            align-items: center;
            font-size: 1.1em;
        }

        .feature-item::before {
            content: '⚡';
            margin-right: 15px;
            font-size: 1.3em;
            color: #FFD700;
        }

        .upload-area {
            border: 3px dashed #FFD700;
            border-radius: 20px;
            padding: 50px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 215, 0, 0.05);
            margin: 30px 0;
        }

        .upload-area:hover {
            border-color: #FFA500;
            background: rgba(255, 215, 0, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
        }

        .upload-area.dragover {
            border-color: #FFA500;
            background: rgba(255, 215, 0, 0.2);
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }

        .upload-text {
            color: #FFD700;
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .upload-hint {
            color: #aaa;
            font-size: 0.95em;
        }

        #fileInput {
            display: none;
        }

        .btn {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #1a1a2e;
            border: none;
            padding: 15px 35px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 700;
            transition: all 0.3s ease;
            display: inline-block;
            text-decoration: none;
            margin-top: 20px;
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
        }

        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
        }

        .btn-center {
            text-align: center;
        }

        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
        }

        .status.success {
            background: rgba(0, 255, 0, 0.2);
            color: #0f0;
            border: 1px solid #0f0;
        }

        .status.error {
            background: rgba(255, 0, 0, 0.2);
            color: #f00;
            border: 1px solid #f00;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 215, 0, 0.3);
            border-top: 3px solid #FFD700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <canvas id="particleCanvas"></canvas>

    <div class="container">
        <h1><span class="fire-emoji">🔥</span> HotStack™</h1>
        <p class="tagline">Omnidrop Your Digital Presence</p>

        <div class="countdown" id="countdown">03:00</div>

        <div class="features">
            <div class="feature-item">Lightning-fast file uploads</div>
            <div class="feature-item">Unlimited storage capacity</div>
            <div class="feature-item">Instant global distribution</div>
            <div class="feature-item">Enterprise-grade security</div>
        </div>

        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📦</div>
            <div class="upload-text">Drop files here or click to upload</div>
            <div class="upload-hint">Any file type, any size</div>
        </div>

        <input type="file" id="fileInput" multiple>

        <div id="status"></div>

        <div class="btn-center">
            <a href="/dashboard" class="btn">Enter Dashboard →</a>
        </div>
    </div>

    <script>
        // Countdown timer (3 minutes)
        let timeLeft = 180; // 3 minutes in seconds
        const countdownEl = document.getElementById('countdown');

        function updateCountdown() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownEl.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            
            if (timeLeft > 0) {
                timeLeft--;
            } else {
                timeLeft = 180; // Reset to 3 minutes
            }
        }

        setInterval(updateCountdown, 1000);

        // Particle animation
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height - canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedY = Math.random() * 2 + 1;
                this.speedX = Math.random() * 1 - 0.5;
                this.opacity = Math.random() * 0.5 + 0.3;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;

                if (this.y > canvas.height) {
                    this.y = -10;
                    this.x = Math.random() * canvas.width;
                }
            }

            draw() {
                ctx.fillStyle = \`rgba(255, 215, 0, \${this.opacity})\`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            requestAnimationFrame(animateParticles);
        }

        animateParticles();

        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const status = document.getElementById('status');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            handleFiles(files);
        });

        async function handleFiles(files) {
            for (let file of files) {
                await uploadFile(file);
            }
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            showStatus('Uploading...', 'loading');

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    showStatus(\`✅ \${file.name} uploaded successfully!\`, 'success');
                } else {
                    showStatus(\`❌ Upload failed: \${result.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`❌ Upload error: \${error.message}\`, 'error');
            }
        }

        function showStatus(message, type) {
            status.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
            if (type !== 'loading') {
                setTimeout(() => status.innerHTML = '', 3000);
            }
        }
    </script>
</body>
</html>
  `;
}

/**
 * Dashboard HTML interface for file management
 */
function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotStack - File Orchestration</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }

        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 0.9em;
        }

        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 15px;
            padding: 60px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #f8f9ff;
        }

        .upload-area:hover {
            border-color: #764ba2;
            background: #f0f1ff;
            transform: translateY(-2px);
        }

        .upload-area.dragover {
            border-color: #764ba2;
            background: #e8e9ff;
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }

        .upload-text {
            color: #667eea;
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .upload-hint {
            color: #999;
            font-size: 0.9em;
        }

        #fileInput {
            display: none;
        }

        .file-list {
            margin-top: 30px;
        }

        .file-item {
            background: #f8f9ff;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .file-name {
            font-weight: 600;
            color: #333;
        }

        .file-size {
            color: #999;
            font-size: 0.9em;
        }

        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #e74c3c;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
        }

        .status.success {
            background: #d4edda;
            color: #155724;
        }

        .status.error {
            background: #f8d7da;
            color: #721c24;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .back-button-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .btn-back {
            display: inline-block;
            background: #764ba2;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-back:hover {
            background: #667eea;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 HotStack</h1>
        <p class="subtitle">File Orchestration System - Dashboard</p>

        <div class="back-button-container">
            <a href="/" class="btn-back">← Back to Landing</a>
        </div>

        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📁</div>
            <div class="upload-text">Drop files here or click to upload</div>
            <div class="upload-hint">Support for any file type</div>
        </div>

        <input type="file" id="fileInput" multiple>

        <div id="status"></div>
        
        <div class="file-list" id="fileList"></div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const status = document.getElementById('status');
        const fileList = document.getElementById('fileList');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            handleFiles(files);
        });

        // Handle file upload
        async function handleFiles(files) {
            for (let file of files) {
                await uploadFile(file);
            }
            loadFiles();
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            showStatus('Uploading...', 'loading');

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    showStatus(\`✅ \${file.name} uploaded successfully!\`, 'success');
                } else {
                    showStatus(\`❌ Upload failed: \${result.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`❌ Upload error: \${error.message}\`, 'error');
            }
        }

        // Load and display files
        async function loadFiles() {
            try {
                const response = await fetch('/files');
                const data = await response.json();

                if (data.files && data.files.length > 0) {
                    fileList.innerHTML = '<h3>Your Files:</h3>';
                    data.files.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = \`
                            <div>
                                <div class="file-name">📄 \${file.key}</div>
                                <div class="file-size">\${formatBytes(file.size)}</div>
                            </div>
                            <button class="btn btn-danger" onclick="deleteFile('\${file.key}')">Delete</button>
                        \`;
                        fileList.appendChild(fileItem);
                    });
                } else {
                    fileList.innerHTML = '';
                }
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }

        // Delete file
        async function deleteFile(filename) {
            if (!confirm(\`Delete \${filename}?\`)) return;

            try {
                const response = await fetch(\`/file/\${encodeURIComponent(filename)}\`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    showStatus(\`✅ \${filename} deleted\`, 'success');
                    loadFiles();
                } else {
                    showStatus(\`❌ Delete failed: \${result.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`❌ Delete error: \${error.message}\`, 'error');
            }
        }

        function showStatus(message, type) {
            status.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
            if (type !== 'loading') {
                setTimeout(() => status.innerHTML = '', 3000);
            }
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Load files on page load
        loadFiles();
    </script>
</body>
</html>
  `;
}

/**
 * Auth client JavaScript
 */
function getAuthClientJS() {
  return `/**
 * HotStack Authentication Utilities
 * Client-side JavaScript for user authentication
 */

class AuthClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.currentUser = null;
    this.sessionId = null;
  }

  /**
   * Sign up a new user
   */
  async signup(email, password, username = null) {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/auth/signup\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in an existing user
   */
  async signin(email, password) {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/auth/signin\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signin failed');
      }

      this.sessionId = data.sessionId;
      this.currentUser = data.user;
      
      // Store session in localStorage as backup
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signout() {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/auth/signout\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${this.getSessionId()}\`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signout failed');
      }

      // Clear local state
      this.currentUser = null;
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/auth/me\`, {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${this.getSessionId()}\`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Clear invalid session
        this.currentUser = null;
        this.sessionId = null;
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        throw new Error(data.error || 'Not authenticated');
      }

      this.currentUser = data.user;
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getSessionId();
  }

  /**
   * Get session ID from memory or localStorage
   */
  getSessionId() {
    if (this.sessionId) {
      return this.sessionId;
    }
    return localStorage.getItem('sessionId');
  }

  /**
   * Get user from memory or localStorage
   */
  getUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Make an authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': \`Bearer \${sessionId}\`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If unauthorized, clear session
    if (response.status === 401) {
      this.currentUser = null;
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
    }

    return response;
  }
}

// Create global instance
const auth = new AuthClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthClient, auth };
}
`;
}

/**
 * Auth test page HTML
 */
function getAuthTestHTML() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotStack Auth Test</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }

        h1 {
            color: #667eea;
            margin-bottom: 30px;
            text-align: center;
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }

        .tab {
            flex: 1;
            padding: 10px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .tab.active {
            background: #667eea;
            color: white;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }

        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        button:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .message {
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .message.show {
            display: block;
        }

        .panel {
            display: none;
        }

        .panel.active {
            display: block;
        }

        .user-info {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }

        .user-info h3 {
            color: #667eea;
            margin-bottom: 15px;
        }

        .user-info p {
            margin: 8px 0;
            color: #333;
        }

        .user-info strong {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 HotStack Auth</h1>

        <div class="tabs">
            <button class="tab active" onclick="switchTab('signup')">Sign Up</button>
            <button class="tab" onclick="switchTab('signin')">Sign In</button>
            <button class="tab" onclick="switchTab('profile')">Profile</button>
        </div>

        <!-- Sign Up Panel -->
        <div id="signup-panel" class="panel active">
            <form id="signup-form" onsubmit="handleSignup(event)">
                <div class="form-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" required>
                </div>
                <div class="form-group">
                    <label for="signup-username">Username (optional)</label>
                    <input type="text" id="signup-username">
                </div>
                <div class="form-group">
                    <label for="signup-password">Password (min 8 characters)</label>
                    <input type="password" id="signup-password" required minlength="8">
                </div>
                <button type="submit">Create Account</button>
            </form>
        </div>

        <!-- Sign In Panel -->
        <div id="signin-panel" class="panel">
            <form id="signin-form" onsubmit="handleSignin(event)">
                <div class="form-group">
                    <label for="signin-email">Email</label>
                    <input type="email" id="signin-email" required>
                </div>
                <div class="form-group">
                    <label for="signin-password">Password</label>
                    <input type="password" id="signin-password" required>
                </div>
                <button type="submit">Sign In</button>
            </form>
        </div>

        <!-- Profile Panel -->
        <div id="profile-panel" class="panel">
            <div id="profile-loading">Loading profile...</div>
            <div id="profile-content" style="display: none;">
                <div class="user-info" id="user-info"></div>
                <button onclick="handleSignout()" style="margin-top: 20px;">Sign Out</button>
            </div>
            <div id="profile-not-auth" style="display: none;">
                <p style="text-align: center; color: #666;">Please sign in to view your profile.</p>
            </div>
        </div>

        <div id="message" class="message"></div>
    </div>

    <script src="/js/auth.js"></script>
    <script>
        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');

            // Update panels
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(\\\`\\\${tab}-panel\\\`).classList.add('active');

            // Clear message
            hideMessage();

            // Load profile if switching to profile tab
            if (tab === 'profile') {
                loadProfile();
            }
        }

        function showMessage(text, type = 'success') {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = \\\`message \\\${type} show\\\`;
            setTimeout(() => hideMessage(), 5000);
        }

        function hideMessage() {
            const messageEl = document.getElementById('message');
            messageEl.className = 'message';
        }

        async function handleSignup(event) {
            event.preventDefault();
            const email = document.getElementById('signup-email').value;
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;

            try {
                const result = await auth.signup(email, password, username || null);
                showMessage('Account created successfully! You can now sign in.', 'success');
                
                // Clear form
                event.target.reset();
                
                // Switch to signin tab after 2 seconds
                setTimeout(() => {
                    document.querySelectorAll('.tab')[1].click();
                }, 2000);
            } catch (error) {
                showMessage(error.message, 'error');
            }
        }

        async function handleSignin(event) {
            event.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;

            try {
                const result = await auth.signin(email, password);
                showMessage('Signed in successfully!', 'success');
                
                // Clear form
                event.target.reset();
                
                // Switch to profile tab
                setTimeout(() => {
                    document.querySelectorAll('.tab')[2].click();
                }, 1000);
            } catch (error) {
                showMessage(error.message, 'error');
            }
        }

        async function handleSignout() {
            try {
                await auth.signout();
                showMessage('Signed out successfully!', 'success');
                
                // Switch to signin tab
                setTimeout(() => {
                    document.querySelectorAll('.tab')[1].click();
                }, 1000);
            } catch (error) {
                showMessage(error.message, 'error');
            }
        }

        async function loadProfile() {
            const loadingEl = document.getElementById('profile-loading');
            const contentEl = document.getElementById('profile-content');
            const notAuthEl = document.getElementById('profile-not-auth');

            loadingEl.style.display = 'block';
            contentEl.style.display = 'none';
            notAuthEl.style.display = 'none';

            if (!auth.isAuthenticated()) {
                loadingEl.style.display = 'none';
                notAuthEl.style.display = 'block';
                return;
            }

            try {
                const user = await auth.getCurrentUser();
                
                document.getElementById('user-info').innerHTML = \\\`
                    <h3>Profile Information</h3>
                    <p><strong>ID:</strong> \\\${user.id}</p>
                    <p><strong>Email:</strong> \\\${user.email}</p>
                    <p><strong>Username:</strong> \\\${user.username || 'Not set'}</p>
                    <p><strong>Created:</strong> \\\${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>Last Login:</strong> \\\${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</p>
                \\\`;
                
                loadingEl.style.display = 'none';
                contentEl.style.display = 'block';
            } catch (error) {
                loadingEl.style.display = 'none';
                notAuthEl.style.display = 'block';
                showMessage(error.message, 'error');
            }
        }

        // Check authentication on load
        window.addEventListener('load', () => {
            if (auth.isAuthenticated()) {
                console.log('User is authenticated');
            }
        });
    </script>
</body>
</html>\`;
}
