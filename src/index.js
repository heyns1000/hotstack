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

      // Route: Upload file to R2 (support both /upload and /api/upload)
      if ((path === '/upload' || path === '/api/upload') && request.method === 'POST') {
        return await handleUpload(request, env, corsHeaders);
      }

      // Route: Upload status (recent uploads) (support both /status and /api/status)
      if ((path === '/status' || path === '/api/status') && request.method === 'GET') {
        return await handleUploadStatus(env, corsHeaders);
      }

      // Route: List files in R2 (support both /files and /api/files)
      if ((path === '/files' || path === '/api/files') && request.method === 'GET') {
        return await handleListFiles(env, corsHeaders);
      }

      // Route: Get specific file from R2 (support both /file/ and /api/file/)
      if ((path.startsWith('/file/') || path.startsWith('/api/file/')) && request.method === 'GET') {
        const filename = path.startsWith('/api/file/') ? path.slice(10) : path.slice(6);
        return await handleGetFile(filename, env, corsHeaders);
      }

      // Route: Delete file from R2 (support both /file/ and /api/file/)
      if ((path.startsWith('/file/') || path.startsWith('/api/file/')) && request.method === 'DELETE') {
        const filename = path.startsWith('/api/file/') ? path.slice(10) : path.slice(6);
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

      // Route: Build endpoint - Generate HTML from prompt and file
      if (path === '/api/build' && request.method === 'POST') {
        return await handleBuild(request, env, corsHeaders);
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

      // Route: HotStack Intake page
      if (path === '/intake' || path === '/hotstack-intake' || path === '/hotstack-intake.html') {
        return new Response(getIntakeHTML(), {
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
 * Enhanced with:
 * - Optional Bearer token authentication
 * - Multipart/streaming upload for large files
 * - Auto-deploy manifest creation
 */
async function handleUpload(request, env, corsHeaders) {
  try {
    // Optional AUTH CHECK for secure uploads
    const authHeader = request.headers.get('Authorization');
    if (env.AUTH_SECRET && authHeader !== `Bearer ${env.AUTH_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate unique key with timestamp and original filename
    const key = `hotstack/${Date.now()}-${file.name}`;
    
    // Multipart upload to R2 using streaming for large files
    // This allows handling files of any size efficiently
    await env.HOTSTACK_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size.toString(),
      },
    });

    // AUTO-DEPLOY TO EDGE - Create manifest for Fruitful sync
    const manifestKey = `${key}-manifest.json`;
    const manifest = {
      status: 'deployed',
      timestamp: new Date().toISOString(),
      path: key,
      originalName: file.name,
      size: file.size,
      contentType: file.type
    };
    
    await env.HOTSTACK_BUCKET.put(manifestKey, JSON.stringify(manifest, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    });

    // Send to queue for processing (if queue is configured)
    if (env.HOTSTACK_QUEUE) {
      await env.HOTSTACK_QUEUE.send({
        key,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
        timestamp: Date.now(),
        manifestKey,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      key,
      filename: file.name,
      size: file.size,
      manifest: manifestKey,
      message: 'File uploaded successfully',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Upload error:', error);
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
 * Get upload status - list recent uploads
 */
async function handleUploadStatus(env, corsHeaders) {
  try {
    // List recent uploads from hotstack/ prefix
    const objects = await env.HOTSTACK_BUCKET.list({ 
      prefix: 'hotstack/',
      limit: 10 
    });
    
    // Filter out manifest files and map to response format
    const files = objects.objects
      .filter(obj => !obj.key.endsWith('-manifest.json'))
      .map(obj => ({
        key: obj.key,
        uploaded: obj.uploaded,
        size: obj.size
      }));
    
    return new Response(JSON.stringify({ 
      success: true,
      files,
      count: files.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Status error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve status',
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
 * Enhanced with proper headers and encoding for downloads
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

    // Extract original filename from metadata or key
    const originalName = object.customMetadata?.originalName || filename.split('/').pop();
    
    const headers = {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`,
      'Cache-Control': 'public, max-age=3600',
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
 * Enhanced with better error handling and audit support
 */
async function handleDeleteFile(filename, env, corsHeaders) {
  try {
    // Check if file exists first
    const object = await env.HOTSTACK_BUCKET.head(filename);
    
    if (!object) {
      return new Response(JSON.stringify({
        error: 'File not found',
        filename,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Delete the file
    await env.HOTSTACK_BUCKET.delete(filename);
    
    // Also delete associated manifest file if it exists
    const manifestKey = `${filename}-manifest.json`;
    try {
      await env.HOTSTACK_BUCKET.delete(manifestKey);
    } catch (e) {
      // Manifest might not exist, that's okay
      console.log('No manifest to delete:', manifestKey);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `File ${filename} deleted successfully`,
      filename,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Delete error:', error);
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
 * Handle /api/build endpoint
 * Accepts a prompt and an uploaded file (PDF/HTML)
 * Extracts text content from the file
 * Generates a simple HTML page from a template using prompt+extracted text
 * Note: Full Cloudflare Pages deployment requires additional setup
 */
async function handleBuild(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const file = formData.get('file');

    if (!prompt || !file) {
      return new Response(JSON.stringify({ 
        error: 'Both prompt and file are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Extract text content from file
    let extractedText = '';
    const fileType = file.type;
    const fileName = file.name;

    if (fileType === 'text/html' || fileName.endsWith('.html')) {
      // For HTML files, read as text
      extractedText = await file.text();
      // Strip HTML tags to get text content
      extractedText = extractedText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For PDF files, we'd need a PDF parser library
      // For now, we'll use a placeholder since we don't have pdf-parse in Workers
      extractedText = '[PDF content extraction requires additional library - placeholder text]';
    } else {
      // For other files, try to read as text
      try {
        extractedText = await file.text();
      } catch (e) {
        extractedText = '[Binary file - unable to extract text content]';
      }
    }

    // Generate HTML from template
    const generatedHTML = generateHTMLTemplate(prompt, extractedText, fileName);

    // Store generated HTML in R2
    const key = `builds/${Date.now()}-${fileName.replace(/\.[^.]+$/, '')}.html`;
    await env.HOTSTACK_BUCKET.put(key, generatedHTML, {
      httpMetadata: {
        contentType: 'text/html',
      },
      customMetadata: {
        prompt: prompt.substring(0, 200), // Store first 200 chars of prompt
        sourceFile: fileName,
        buildDate: new Date().toISOString(),
      },
    });

    // Return response with build info
    return new Response(JSON.stringify({
      success: true,
      message: 'HTML page generated successfully',
      buildKey: key,
      sourceFile: fileName,
      extractedTextLength: extractedText.length,
      viewUrl: `/file/${key}`,
      note: 'Full Cloudflare Pages deployment requires additional configuration',
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Build error:', error);
    return new Response(JSON.stringify({ 
      error: 'Build failed', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Generate HTML template from prompt and extracted text
 */
function generateHTMLTemplate(prompt, extractedText, sourceFileName) {
  // Create a simple, clean HTML page based on the prompt and extracted content
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated from: ${sourceFileName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .prompt-section {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        .prompt-label {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
        }
        .content-section {
            margin-top: 30px;
        }
        .content-text {
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 600px;
            overflow-y: auto;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 10px;
        }
        .meta-info {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 0.9em;
            color: #666;
        }
        .meta-info p {
            margin: 5px 0;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 0.9em;
        }
        footer a {
            color: #667eea;
            text-decoration: none;
        }
        footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 Generated Content</h1>
        
        <div class="prompt-section">
            <div class="prompt-label">User Prompt</div>
            <p>${escapeHtml(prompt)}</p>
        </div>

        <div class="content-section">
            <h2>Extracted Content</h2>
            <div class="content-text">${escapeHtml(extractedText.substring(0, 5000))}${extractedText.length > 5000 ? '\n\n... (content truncated)' : ''}</div>
        </div>

        <div class="meta-info">
            <p><strong>Source File:</strong> ${escapeHtml(sourceFileName)}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Content Length:</strong> ${extractedText.length} characters</p>
        </div>

        <footer>
            <p>Generated by <a href="https://hotstack.faa.zone">HotStack™</a> - Omnidrop Your Digital Presence</p>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
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
                const response = await fetch('/api/upload', {
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
 * Landing page HTML with HotStack branding - Dark Gold Theme
 * Features dropzone with XHR upload to /api/upload and status console
 */
function getLandingPageHTML() {
  return `<!DOCTYPE html>
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
            box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 50px rgba(218, 165, 32, 0.2);
            padding: 60px 50px;
            max-width: 700px;
            width: 100%;
            position: relative;
            z-index: 1;
            border: 2px solid rgba(218, 165, 32, 0.3);
        }

        h1 {
            color: #DAA520;
            margin-bottom: 10px;
            font-size: 3.5em;
            text-align: center;
            text-shadow: 0 0 20px rgba(218, 165, 32, 0.5);
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
            color: #DAA520;
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
            color: #DAA520;
            font-weight: bold;
            text-shadow: 0 0 15px rgba(218, 165, 32, 0.7);
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
            color: #DAA520;
        }

        .upload-area {
            border: 3px dashed #DAA520;
            border-radius: 20px;
            padding: 50px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(218, 165, 32, 0.05);
            margin: 30px 0;
        }

        .upload-area:hover {
            border-color: #B8860B;
            background: rgba(218, 165, 32, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(218, 165, 32, 0.3);
        }

        .upload-area.dragover {
            border-color: #B8860B;
            background: rgba(218, 165, 32, 0.2);
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }

        .upload-text {
            color: #DAA520;
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
            background: linear-gradient(135deg, #DAA520 0%, #B8860B 100%);
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
            box-shadow: 0 5px 20px rgba(218, 165, 32, 0.4);
        }

        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(218, 165, 32, 0.6);
        }

        .btn-center {
            text-align: center;
        }

        .status-console {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            border: 1px solid rgba(218, 165, 32, 0.2);
        }

        .status-log {
            color: #DAA520;
            margin: 5px 0;
            padding: 3px 0;
        }

        .status-log.success {
            color: #4caf50;
        }

        .status-log.error {
            color: #f44336;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(218, 165, 32, 0.3);
            border-top: 3px solid #DAA520;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 15px 0;
            display: none;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #DAA520 0%, #B8860B 100%);
            width: 0%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a1a2e;
            font-weight: bold;
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

        <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill">0%</div>
        </div>

        <div class="status-console" id="statusConsole">
            <div class="status-log">[SYSTEM] Ready to upload files...</div>
        </div>

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
                ctx.fillStyle = \`rgba(218, 165, 32, \${this.opacity})\`;
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

        // Status Console Logger
        function statusLog(message, type = 'info') {
            const console = document.getElementById('statusConsole');
            const now = new Date();
            const time = now.toLocaleTimeString();
            
            const logEntry = document.createElement('div');
            logEntry.className = \`status-log \${type}\`;
            logEntry.textContent = \`[\${time}] \${message}\`;
            
            console.appendChild(logEntry);
            console.scrollTop = console.scrollHeight;
            
            // Keep only last 20 entries
            while (console.children.length > 20) {
                console.removeChild(console.firstChild);
            }
        }

        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');

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

            statusLog(\`Starting upload: \${file.name}\`, 'info');
            progressBar.style.display = 'block';

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percentComplete + '%';
                    progressFill.textContent = percentComplete + '%';
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.success) {
                            statusLog(\`✅ \${file.name} uploaded successfully!\`, 'success');
                            setTimeout(() => {
                                progressBar.style.display = 'none';
                                progressFill.style.width = '0%';
                            }, 2000);
                        } else {
                            statusLog(\`❌ Upload failed: \${result.error}\`, 'error');
                            progressBar.style.display = 'none';
                        }
                    } catch (error) {
                        statusLog(\`❌ Upload error: \${error.message}\`, 'error');
                        progressBar.style.display = 'none';
                    }
                } else {
                    statusLog(\`❌ Upload failed: HTTP \${xhr.status}\`, 'error');
                    progressBar.style.display = 'none';
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                statusLog('❌ Network error during upload', 'error');
                progressBar.style.display = 'none';
            });

            xhr.addEventListener('abort', () => {
                statusLog('❌ Upload cancelled', 'error');
                progressBar.style.display = 'none';
            });

            // Open connection and send
            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);
        }
    </script>
</body>
</html>`;
}
function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotStack™ Dashboard | File Orchestration</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --gold-primary: #FFD700;
            --gold-secondary: #FFA500;
            --dark-bg: #0d1117;
            --dark-card: #1a1b20;
            --border-gold: rgba(255, 215, 0, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--dark-bg);
            color: #e2e8f0;
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }

        /* Particle Canvas Background */
        #particleCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }

        /* Main Container */
        .dashboard-container {
            position: relative;
            z-index: 1;
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Header */
        .dashboard-header {
            background: rgba(26, 27, 32, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-gold);
            border-radius: 16px;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }

        .logo {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .fire-emoji {
            display: inline-block;
            animation: flicker 2s infinite;
        }

        @keyframes flicker {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }

        .countdown-timer {
            font-size: 2rem;
            font-weight: 700;
            color: var(--gold-primary);
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
        }

        /* Grid Layout */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        /* Cards */
        .card {
            background: var(--dark-card);
            border: 1px solid var(--border-gold);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 5px 20px rgba(0,0,0,0.6);
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.7), 0 0 25px var(--gold-secondary);
            border-color: var(--gold-primary);
        }

        .card-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--gold-primary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* Upload Zone */
        .upload-zone {
            border: 3px dashed var(--border-gold);
            border-radius: 20px;
            padding: 4rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 215, 0, 0.05);
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .upload-zone:hover,
        .upload-zone.dragover {
            border-color: var(--gold-primary);
            background: rgba(255, 215, 0, 0.15);
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(255, 215, 0, 0.3);
        }

        .upload-icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .upload-text {
            color: var(--gold-primary);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .upload-hint {
            color: #aaa;
            font-size: 1rem;
        }

        /* Status Console */
        .status-console {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border-gold);
            border-radius: 12px;
            padding: 1.5rem;
            max-height: 400px;
            overflow-y: auto;
        }

        .status-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: rgba(255, 215, 0, 0.05);
            border-left: 3px solid var(--gold-primary);
            border-radius: 6px;
            font-size: 0.9rem;
            font-family: 'Courier New', monospace;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .status-time {
            color: var(--gold-secondary);
            font-weight: 600;
        }

        /* Metrics Cards */
        .metric-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--gold-primary);
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
        }

        .metric-label {
            color: #aaa;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Global Hub Cards */
        .hub-card {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
            border: 1px solid var(--border-gold);
            border-radius: 12px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .hub-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
            border-color: var(--gold-primary);
        }

        .hub-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .hub-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--gold-primary);
            margin-bottom: 0.5rem;
        }

        .hub-description {
            color: #aaa;
            font-size: 0.85rem;
        }

        /* Buttons */
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            color: #0d1117;
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
        }

        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: var(--gold-primary);
            border: 1px solid var(--border-gold);
        }

        .btn-secondary:hover {
            background: rgba(255, 215, 0, 0.1);
        }

        /* Modal */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: none;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background: var(--dark-card);
            border: 2px solid var(--gold-primary);
            border-radius: 20px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 50px rgba(0,0,0,0.9);
            animation: scaleIn 0.3s ease-out;
        }

        @keyframes scaleIn {
            from { transform: scale(0.9); }
            to { transform: scale(1); }
        }

        .modal-header {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--gold-primary);
            margin-bottom: 1rem;
        }

        .modal-body {
            color: #e2e8f0;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }

        .modal-footer {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }

        /* File List */
        .file-item {
            background: rgba(255, 215, 0, 0.05);
            border: 1px solid var(--border-gold);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
        }

        .file-item:hover {
            background: rgba(255, 215, 0, 0.1);
            border-color: var(--gold-primary);
        }

        .file-name {
            font-weight: 600;
            color: var(--gold-primary);
        }

        .file-meta {
            color: #aaa;
            font-size: 0.85rem;
        }

        /* Progress Bar */
        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            overflow: hidden;
            margin-top: 1rem;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--gold-primary), var(--gold-secondary));
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0d1117;
            font-weight: 700;
            font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--dark-card);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--gold-primary);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--gold-secondary);
        }
    </style>
</head>
<body>
    <canvas id="particleCanvas"></canvas>

    <div class="dashboard-container">
        <!-- Header -->
        <div class="dashboard-header">
            <div class="logo">
                <span class="fire-emoji">🔥</span>
                HotStack™ Dashboard
            </div>
            <div class="countdown-timer" id="countdown">03:00</div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary" onclick="window.location.href='/'">← Home</button>
                <button class="btn btn-primary" onclick="showModal('signup')">Get Started</button>
            </div>
        </div>

        <!-- Metrics Row -->
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-title">📊 Total Uploads</div>
                <div class="metric-value" id="totalUploads">0</div>
                <div class="metric-label">Files in Storage</div>
            </div>
            <div class="card">
                <div class="card-title">💾 Storage Used</div>
                <div class="metric-value" id="storageUsed">0 MB</div>
                <div class="metric-label">R2 Bucket Usage</div>
            </div>
            <div class="card">
                <div class="card-title">⚡ Recent Activity</div>
                <div class="metric-value" id="recentCount">0</div>
                <div class="metric-label">Last Hour</div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
            <!-- Upload Zone -->
            <div class="card" style="grid-column: span 2;">
                <div class="card-title">📦 File Upload Zone</div>
                <div class="upload-zone" id="uploadZone">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">Drop files here or click to upload</div>
                    <div class="upload-hint">Any file type • Any size • Instant upload</div>
                </div>
                <input type="file" id="fileInput" multiple style="display: none;">
                <div id="uploadProgress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill">0%</div>
                    </div>
                </div>
            </div>

            <!-- Status Console -->
            <div class="card">
                <div class="card-title">🖥️ Live Status Console</div>
                <div class="status-console" id="statusConsole">
                    <div class="status-item">
                        <span class="status-time">[SYSTEM]</span> Dashboard initialized
                    </div>
                    <div class="status-item">
                        <span class="status-time">[R2]</span> Connected to hotstack-intake-bucket
                    </div>
                </div>
            </div>
        </div>

        <!-- Global Hubs -->
        <div class="card">
            <div class="card-title">🌐 Global Hubs</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div class="hub-card" onclick="showModal('analytics')">
                    <div class="hub-icon">📈</div>
                    <div class="hub-title">Analytics</div>
                    <div class="hub-description">View detailed metrics and insights</div>
                </div>
                <div class="hub-card" onclick="showModal('admin')">
                    <div class="hub-icon">⚙️</div>
                    <div class="hub-title">Admin Panel</div>
                    <div class="hub-description">Manage settings and configurations</div>
                </div>
                <div class="hub-card" onclick="showModal('account')">
                    <div class="hub-icon">👤</div>
                    <div class="hub-title">Account</div>
                    <div class="hub-description">Profile and account management</div>
                </div>
                <div class="hub-card" onclick="showModal('referral')">
                    <div class="hub-icon">🎁</div>
                    <div class="hub-title">Referrals</div>
                    <div class="hub-description">Invite friends and earn rewards</div>
                </div>
            </div>
        </div>

        <!-- Recent Files -->
        <div class="card">
            <div class="card-title">📄 Recent Files</div>
            <div id="fileList"></div>
        </div>
    </div>

    <!-- Modals -->
    <div class="modal" id="signupModal">
        <div class="modal-content">
            <div class="modal-header">🚀 Zero-Signup Access</div>
            <div class="modal-body">
                <p>Welcome to HotStack™! You can start using the platform immediately with zero-signup required.</p>
                <p style="margin-top: 1rem;">Simply drag and drop files to upload. No account needed!</p>
                <p style="margin-top: 1rem; color: var(--gold-primary);">Create an account later to unlock premium features.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('signup')">Close</button>
                <button class="btn btn-primary" onclick="closeModal('signup')">Start Uploading</button>
            </div>
        </div>
    </div>

    <div class="modal" id="analyticsModal">
        <div class="modal-content">
            <div class="modal-header">📈 Analytics Hub</div>
            <div class="modal-body">
                <p>Advanced analytics and reporting features coming soon!</p>
                <p style="margin-top: 1rem;">Track upload trends, storage usage, and performance metrics.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal('analytics')">Got it</button>
            </div>
        </div>
    </div>

    <div class="modal" id="adminModal">
        <div class="modal-content">
            <div class="modal-header">⚙️ Admin Panel</div>
            <div class="modal-body">
                <p>Administrative controls and settings will be available here.</p>
                <p style="margin-top: 1rem;">Manage users, permissions, and system configuration.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal('admin')">Got it</button>
            </div>
        </div>
    </div>

    <div class="modal" id="accountModal">
        <div class="modal-content">
            <div class="modal-header">👤 Account Management</div>
            <div class="modal-body">
                <p>Manage your profile, preferences, and account settings.</p>
                <p style="margin-top: 1rem;">Update your information and view your activity history.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal('account')">Got it</button>
            </div>
        </div>
    </div>

    <div class="modal" id="referralModal">
        <div class="modal-content">
            <div class="modal-header">🎁 Referral Program</div>
            <div class="modal-body">
                <p>Share HotStack™ with friends and earn rewards!</p>
                <p style="margin-top: 1rem;">Your referral link: <code style="color: var(--gold-primary);">https://hotstack.faa.zone?ref=YOUR_CODE</code></p>
                <p style="margin-top: 1rem;">Earn premium features for every successful referral.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="copyReferralLink()">Copy Link</button>
                <button class="btn btn-primary" onclick="closeModal('referral')">Close</button>
            </div>
        </div>
    </div>

    <script>
        // Particle Animation
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
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedY = Math.random() * 2 + 0.5;
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

        // Countdown Timer
        let timeLeft = 180;
        const countdownEl = document.getElementById('countdown');

        function updateCountdown() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownEl.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            
            if (timeLeft > 0) {
                timeLeft--;
            } else {
                timeLeft = 180;
            }
        }

        setInterval(updateCountdown, 1000);

        // Modal Functions
        function showModal(type) {
            const modal = document.getElementById(type + 'Modal');
            if (modal) {
                modal.classList.add('active');
            }
        }

        function closeModal(type) {
            const modal = document.getElementById(type + 'Modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function copyReferralLink() {
            navigator.clipboard.writeText('https://hotstack.faa.zone?ref=YOUR_CODE');
            addStatusLog('[REFERRAL] Link copied to clipboard');
        }

        // Status Console
        function addStatusLog(message) {
            const console = document.getElementById('statusConsole');
            const now = new Date();
            const time = now.toLocaleTimeString();
            
            const item = document.createElement('div');
            item.className = 'status-item';
            item.innerHTML = \`<span class="status-time">[\${time}]</span> \${message}\`;
            
            console.insertBefore(item, console.firstChild);
            
            // Keep only last 10 items
            while (console.children.length > 10) {
                console.removeChild(console.lastChild);
            }
        }

        // File Upload
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');

        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        async function handleFiles(files) {
            for (let file of files) {
                await uploadFile(file);
            }
            loadMetrics();
            loadFiles();
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            uploadProgress.style.display = 'block';
            addStatusLog(\`[UPLOAD] Starting: \${file.name}\`);

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percentComplete + '%';
                    progressFill.textContent = percentComplete + '%';
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.success) {
                            addStatusLog(\`[SUCCESS] ✅ \${file.name} uploaded\`);
                            setTimeout(() => {
                                uploadProgress.style.display = 'none';
                                progressFill.style.width = '0%';
                                progressFill.textContent = '0%';
                            }, 2000);
                        }
                    } catch (error) {
                        addStatusLog(\`[ERROR] ❌ Upload failed: \${error.message}\`);
                    }
                } else {
                    addStatusLog(\`[ERROR] ❌ HTTP \${xhr.status}\`);
                }
            });

            xhr.addEventListener('error', () => {
                addStatusLog('[ERROR] ❌ Network error');
            });

            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);
        }

        // Load Metrics
        async function loadMetrics() {
            try {
                const response = await fetch('/api/files');
                const data = await response.json();

                if (data.files) {
                    document.getElementById('totalUploads').textContent = data.files.length;
                    
                    const totalSize = data.files.reduce((sum, file) => sum + (file.size || 0), 0);
                    document.getElementById('storageUsed').textContent = formatBytes(totalSize);
                    
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    const recentFiles = data.files.filter(file => new Date(file.uploaded) > oneHourAgo);
                    document.getElementById('recentCount').textContent = recentFiles.length;
                }
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        }

        // Load Files
        async function loadFiles() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();

                const fileList = document.getElementById('fileList');

                if (data.success && data.files && data.files.length > 0) {
                    fileList.innerHTML = '';
                    data.files.forEach(file => {
                        const item = document.createElement('div');
                        item.className = 'file-item';
                        const fileName = file.key.split('/').pop();
                        item.innerHTML = \`
                            <div>
                                <div class="file-name">📄 \${fileName}</div>
                                <div class="file-meta">\${formatBytes(file.size)} • \${new Date(file.uploaded).toLocaleString()}</div>
                            </div>
                            <button class="btn btn-secondary" onclick="deleteFile('\${file.key}')">Delete</button>
                        \`;
                        fileList.appendChild(item);
                    });
                } else {
                    fileList.innerHTML = '<div style="color: #aaa; text-align: center; padding: 2rem;">No files uploaded yet</div>';
                }
            } catch (error) {
                console.error('Failed to load files:', error);
            }
        }

        // Delete File
        async function deleteFile(filename) {
            // Show delete confirmation modal
            showDeleteModal(filename);
        }

        function showDeleteModal(filename) {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = \`
                <div class="modal-content">
                    <div class="modal-header">⚠️ Confirm Delete</div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this file?</p>
                        <p style="margin-top: 1rem; color: var(--gold-primary);"><strong>\${filename.split('/').pop()}</strong></p>
                        <p style="margin-top: 1rem; color: #f44336;">This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn btn-primary" style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);" onclick="confirmDelete('\${filename}')">Delete</button>
                    </div>
                </div>
            \`;
            document.body.appendChild(modal);
        }

        async function confirmDelete(filename) {
            // Close modal
            document.querySelectorAll('.modal').forEach(m => m.remove());

            try {
                const response = await fetch(\`/api/file/\${encodeURIComponent(filename)}\`, {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    addStatusLog(\`[DELETE] 🗑️ \${filename.split('/').pop()} deleted\`);
                    loadFiles();
                    loadMetrics();
                } else {
                    addStatusLog(\`[ERROR] ❌ Delete failed: \${result.error}\`);
                }
            } catch (error) {
                addStatusLog(\`[ERROR] ❌ \${error.message}\`);
            }
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Initialize
        window.addEventListener('load', () => {
            loadMetrics();
            loadFiles();
            addStatusLog('[INIT] Dashboard loaded successfully');
        });

        // Auto-refresh metrics every 30 seconds
        setInterval(() => {
            loadMetrics();
            loadFiles();
        }, 30000);
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
  return `<!DOCTYPE html>
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
</html>`;
}

/**
 * HotStack Intake HTML page with functional progress bar
 */
function getIntakeHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotStack™ Intake - Secure File Upload</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #fff;
        }

        .container {
            background: rgba(20, 20, 30, 0.95);
            border-radius: 24px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 50px rgba(255, 215, 0, 0.2);
            padding: 50px 40px;
            max-width: 700px;
            width: 100%;
            border: 2px solid rgba(255, 215, 0, 0.3);
        }

        h1 {
            color: #FFD700;
            margin-bottom: 15px;
            font-size: 2.8em;
            text-align: center;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .subtitle {
            color: #FFD700;
            margin-bottom: 35px;
            font-size: 1.2em;
            text-align: center;
            font-weight: 500;
            letter-spacing: 0.5px;
        }

        .upload-zone {
            border: 3px dashed rgba(255, 215, 0, 0.5);
            border-radius: 20px;
            padding: 60px 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: rgba(255, 215, 0, 0.05);
            position: relative;
        }

        .upload-zone:hover {
            border-color: #FFD700;
            background: rgba(255, 215, 0, 0.15);
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(255, 215, 0, 0.3);
        }

        .upload-zone.dragover {
            border-color: #FFA500;
            background: rgba(255, 215, 0, 0.25);
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 4.5em;
            margin-bottom: 20px;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .upload-text {
            color: #FFD700;
            font-size: 1.4em;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .upload-hint {
            color: #aaa;
            font-size: 1em;
        }

        #fileInput {
            display: none;
        }

        .progress-container {
            margin-top: 30px;
            display: none;
        }

        .progress-bar-wrapper {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            height: 35px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
            border-radius: 12px;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a1a2e;
            font-weight: 700;
            font-size: 0.95em;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .progress-text {
            margin-top: 12px;
            color: #FFD700;
            font-size: 1em;
            text-align: center;
            font-weight: 500;
        }

        .file-info {
            margin-top: 20px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .file-info p {
            margin: 8px 0;
            color: #fff;
        }

        .file-info strong {
            color: #FFD700;
        }

        .status {
            margin-top: 25px;
            padding: 18px;
            border-radius: 12px;
            text-align: center;
            font-weight: 600;
            display: none;
        }

        .status.success {
            background: rgba(76, 175, 80, 0.2);
            border: 2px solid rgba(76, 175, 80, 0.5);
            color: #4caf50;
        }

        .status.error {
            background: rgba(244, 67, 54, 0.2);
            border: 2px solid rgba(244, 67, 54, 0.5);
            color: #f44336;
        }

        .auth-section {
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .auth-section label {
            display: block;
            margin-bottom: 8px;
            color: #FFD700;
            font-weight: 600;
        }

        .auth-section input {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 8px;
            color: #fff;
            font-size: 1em;
        }

        .auth-section input:focus {
            outline: none;
            border-color: #FFD700;
            background: rgba(255, 255, 255, 0.15);
        }

        .recent-uploads {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 215, 0, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(255, 215, 0, 0.2);
            display: none;
        }

        .recent-uploads h3 {
            color: #FFD700;
            margin-bottom: 15px;
        }

        .recent-item {
            padding: 10px;
            margin: 8px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            font-size: 0.9em;
        }

        .btn {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #1a1a2e;
            border: none;
            padding: 12px 28px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 700;
            transition: all 0.3s ease;
            margin-top: 15px;
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
        }

        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 HotStack™ Intake</h1>
        <p class="subtitle">Secure File Upload System</p>

        <div class="auth-section">
            <label for="authToken">Authorization Token (optional):</label>
            <input type="password" id="authToken" placeholder="Enter Bearer token if required">
        </div>

        <div class="upload-zone" id="uploadZone">
            <div class="upload-icon">📦</div>
            <div class="upload-text">Drop files here or click to upload</div>
            <div class="upload-hint">Any file type • Any size • Secure multipart upload</div>
        </div>

        <input type="file" id="fileInput" multiple>

        <div class="progress-container" id="progressContainer">
            <div class="progress-bar-wrapper">
                <div class="progress-bar" id="progressBar">0%</div>
            </div>
            <div class="progress-text" id="progressText">Preparing upload...</div>
        </div>

        <div class="file-info" id="fileInfo" style="display: none;"></div>

        <div class="status" id="status"></div>

        <button class="btn" id="statusBtn" onclick="loadRecentUploads()">View Recent Uploads</button>

        <div class="recent-uploads" id="recentUploads"></div>
    </div>

    <script>
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const fileInfo = document.getElementById('fileInfo');
        const statusDiv = document.getElementById('status');
        const authTokenInput = document.getElementById('authToken');
        const recentUploadsDiv = document.getElementById('recentUploads');

        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());

        // Drag and drop handlers
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        async function handleFiles(files) {
            for (let file of files) {
                await uploadFile(file);
            }
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            // Show progress container
            progressContainer.style.display = 'block';
            fileInfo.style.display = 'block';
            statusDiv.style.display = 'none';

            // Display file info
            fileInfo.innerHTML = \\\`
                <p><strong>File:</strong> \\\${file.name}</p>
                <p><strong>Size:</strong> \\\${formatBytes(file.size)}</p>
                <p><strong>Type:</strong> \\\${file.type || 'Unknown'}</p>
            \\\`;

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percentComplete + '%';
                    progressBar.textContent = percentComplete + '%';
                    progressText.textContent = \\\`Uploading: \\\${formatBytes(e.loaded)} / \\\${formatBytes(e.total)}\\\`;
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.success) {
                            showStatus(\\\`✅ \\\${file.name} uploaded successfully!\\\`, 'success');
                            progressText.textContent = 'Upload complete! ✓';
                            
                            // Show manifest info
                            if (result.manifest) {
                                fileInfo.innerHTML += \\\`
                                    <p><strong>Status:</strong> Deployed</p>
                                    <p><strong>Key:</strong> \\\${result.key}</p>
                                    <p><strong>Manifest:</strong> \\\${result.manifest}</p>
                                \\\`;
                            }
                        } else {
                            showStatus(\\\`❌ Upload failed: \\\${result.error}\\\`, 'error');
                        }
                    } catch (error) {
                        showStatus(\\\`❌ Upload error: \\\${error.message}\\\`, 'error');
                    }
                } else {
                    showStatus(\\\`❌ Upload failed: HTTP \\\${xhr.status}\\\`, 'error');
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                showStatus('❌ Upload failed: Network error', 'error');
            });

            xhr.addEventListener('abort', () => {
                showStatus('❌ Upload cancelled', 'error');
            });

            // Prepare request
            xhr.open('POST', '/upload', true);
            
            // Add auth token if provided
            const token = authTokenInput.value.trim();
            if (token) {
                xhr.setRequestHeader('Authorization', \\\`Bearer \\\${token}\\\`);
            }

            // Reset progress
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            progressText.textContent = 'Starting upload...';

            // Send request
            xhr.send(formData);
        }

        async function loadRecentUploads() {
            try {
                const response = await fetch('/status');
                const data = await response.json();

                if (data.success && data.files && data.files.length > 0) {
                    recentUploadsDiv.style.display = 'block';
                    recentUploadsDiv.innerHTML = '<h3>Recent Uploads</h3>';
                    
                    data.files.forEach(file => {
                        const item = document.createElement('div');
                        item.className = 'recent-item';
                        item.innerHTML = \\\`
                            📄 \\\${file.key.split('/').pop()}<br>
                            <small>Size: \\\${formatBytes(file.size)} • Uploaded: \\\${new Date(file.uploaded).toLocaleString()}</small>
                        \\\`;
                        recentUploadsDiv.appendChild(item);
                    });
                } else {
                    recentUploadsDiv.style.display = 'block';
                    recentUploadsDiv.innerHTML = '<h3>Recent Uploads</h3><p style="color: #aaa;">No recent uploads found</p>';
                }
            } catch (error) {
                showStatus(\\\`Failed to load recent uploads: \\\${error.message}\\\`, 'error');
            }
        }

        function showStatus(message, type) {
            statusDiv.textContent = message;
            statusDiv.className = \\\`status \\\${type}\\\`;
            statusDiv.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Load recent uploads on page load
        window.addEventListener('load', () => {
            console.log('HotStack Intake ready');
        });
    </script>
</body>
</html>`;
}
