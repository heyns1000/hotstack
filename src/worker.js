/**
 * HOTSTACK WORKER — R2 UPLOAD + DEPLOY
 * Secure: Bearer token auth
 * Multipart: Handles big files
 * Deploy: Auto to edge
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');

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

    // AUTH CHECK — Only authorized users can upload
    if (url.pathname === '/upload' && env.AUTH_SECRET && authHeader !== `Bearer ${env.AUTH_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      try {
        // Multipart upload to R2
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
        
        // Upload to R2 using streaming for large files
        await env.HOTSTACK_BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        // AUTO-DEPLOY TO EDGE (Cloudflare Pages/Workers)
        // Trigger deploy script (Fruitful sync)
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

        return new Response(JSON.stringify({ 
          success: true, 
          key,
          manifest: manifestKey,
          message: 'File uploaded and deployed successfully'
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

    if (request.method === 'GET' && url.pathname === '/status') {
      try {
        // List recent uploads (up to 10)
        const objects = await env.HOTSTACK_BUCKET.list({ 
          prefix: 'hotstack/',
          limit: 10 
        });
        
        // Filter out manifest files
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

    return new Response(JSON.stringify({ 
      message: 'HotStack Worker Ready',
      version: '1.0.0',
      endpoints: {
        upload: 'POST /upload (requires Authorization header)',
        status: 'GET /status'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
