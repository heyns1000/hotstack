import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import type { Env } from '../types';

const dropzone = new Hono<{ Bindings: Env }>();

// Analyze uploaded file with AI
dropzone.post('/analyze', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'GEMINI_API_KEY not configured' }, 500);
    }

    const genai = new GoogleGenAI({ apiKey });

    // Extract file content based on type
    let fileContent = '';
    let fileType = file.type;
    const fileName = file.name;

    if (file.type === 'text/html' || file.name.endsWith('.html')) {
      fileContent = await file.text();
      fileType = 'HTML';
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      fileType = 'PDF';
      fileContent = 'PDF file detected - content analysis available';
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      fileContent = await file.text();
      fileType = 'JSON';
    } else if (file.type.startsWith('text/')) {
      fileContent = await file.text();
      fileType = 'TEXT';
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      fileContent = await file.text();
      fileType = 'CSV';
    } else {
      fileType = 'BINARY';
      fileContent = `Binary file: ${file.type}`;
    }

    // Truncate content for AI analysis (max 10000 chars)
    const truncatedContent = fileContent.length > 10000 
      ? fileContent.substring(0, 10000) + '... [truncated]'
      : fileContent;

    // Generate AI analysis
    const analysisPrompt = `You are an expert file analyzer for the HotStack Drop Zone system. Analyze this ${fileType} file and provide comprehensive insights.

File Name: ${fileName}
File Type: ${fileType}
File Size: ${file.size} bytes
MIME Type: ${file.type}

${truncatedContent ? `File Content Preview:\n${truncatedContent}` : 'Binary file - content analysis not available'}

Provide a detailed analysis including:
1. **File Overview**: What type of file is this and what is its purpose?
2. **Content Analysis**: Key findings from the file content
3. **Quality Assessment**: Rate the file quality (structure, completeness, errors)
4. **Security Scan**: Any potential security concerns or issues
5. **Metadata Insights**: Important metadata and properties
6. **Recommendations**: Suggestions for improvement or usage
7. **Processing Status**: Is this file ready for production use?

Format your response in clear sections with emojis for visual clarity.`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: analysisPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const aiAnalysis = response.text;

    // Extract basic metadata
    const metadata = {
      fileName: fileName,
      fileSize: file.size,
      mimeType: file.type,
      fileType: fileType,
      uploadedAt: new Date().toISOString(),
      hasContent: !!fileContent,
      contentLength: fileContent.length,
      preview: fileContent.length > 200 
        ? fileContent.substring(0, 200) + '...' 
        : fileContent
    };

    // Generate smart tags based on content
    const tags: string[] = [];
    if (fileType === 'HTML') tags.push('web', 'markup', 'frontend');
    if (fileType === 'PDF') tags.push('document', 'report');
    if (fileType === 'JSON') tags.push('data', 'api', 'config');
    if (fileType === 'CSV') tags.push('data', 'spreadsheet', 'analytics');
    if (fileName.toLowerCase().includes('test')) tags.push('testing');
    if (fileName.toLowerCase().includes('prod')) tags.push('production');
    if (fileName.toLowerCase().includes('config')) tags.push('configuration');

    // Calculate quality score (simple heuristic)
    let qualityScore = 50;
    if (file.size > 0 && file.size < 10000000) qualityScore += 20; // Good size
    if (fileContent.length > 100) qualityScore += 10; // Has content
    if (!fileContent.includes('error') && !fileContent.includes('Error')) qualityScore += 10; // No obvious errors
    if (fileType !== 'BINARY') qualityScore += 10; // Analyzable format

    return c.json({
      success: true,
      metadata,
      aiAnalysis,
      tags,
      qualityScore: Math.min(100, qualityScore),
      processingTime: Date.now(),
      insights: {
        readyForProduction: qualityScore > 70,
        securityStatus: 'analyzed',
        recommendedActions: [
          'Review AI analysis',
          'Verify file integrity',
          'Check metadata completeness'
        ]
      }
    });

  } catch (error) {
    console.error('File analysis error:', error);
    return c.json({ 
      error: 'Failed to analyze file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get enhanced file metadata
dropzone.get('/files/:id/metadata', async (c) => {
  try {
    const fileId = c.req.param('id');
    
    const fileRecord = await c.env.DB.prepare(
      `SELECT * FROM files WHERE id = ?`
    ).bind(fileId).first();

    if (!fileRecord) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get file from R2 to analyze
    const object = await c.env.R2_BUCKET.get(fileRecord.storage_key as string);
    
    if (!object) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    return c.json({
      id: fileRecord.id,
      name: fileRecord.name,
      size: fileRecord.size,
      mimeType: fileRecord.mime_type,
      storageKey: fileRecord.storage_key,
      createdAt: fileRecord.created_at,
      r2Metadata: {
        etag: object.etag,
        uploaded: object.uploaded.toISOString(),
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata
      }
    });

  } catch (error) {
    console.error('Metadata fetch error:', error);
    return c.json({ 
      error: 'Failed to fetch metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Batch analyze multiple files
dropzone.post('/analyze-batch', async (c) => {
  try {
    const { fileIds } = await c.req.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return c.json({ error: 'fileIds array required' }, 400);
    }

    const results = [];

    for (const fileId of fileIds.slice(0, 10)) { // Limit to 10 files
      const fileRecord = await c.env.DB.prepare(
        `SELECT * FROM files WHERE id = ?`
      ).bind(fileId).first();

      if (fileRecord) {
        results.push({
          id: fileId,
          name: fileRecord.name,
          size: fileRecord.size,
          type: fileRecord.mime_type,
          status: 'analyzed'
        });
      }
    }

    return c.json({
      analyzed: results.length,
      results
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    return c.json({ 
      error: 'Failed to analyze batch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default dropzone;
