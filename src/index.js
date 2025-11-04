/**
 * HotStack File Orchestration System
 * Worker for hotstack.faa.zone
 * 
 * Features:
 * - File upload interface (drag & drop)
 * - R2 bucket integration
 * - Queue processing system
 * - Backend integration with Replit
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

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
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 HotStack</h1>
        <p class="subtitle">File Orchestration System - Dashboard</p>

        <div style="text-align: center; margin-bottom: 20px;">
            <a href="/" style="display: inline-block; background: #764ba2; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">← Back to Landing</a>
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
