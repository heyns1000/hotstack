/**
 * Google Drive Template Connector
 * Integrates Google Drive templates into HotStack deployment flow
 *
 * Features:
 * - Recursive Drive folder scanning
 * - Template categorization and tagging
 * - Intelligent template search and matching
 * - Brand data injection with placeholders
 * - 1-hour result caching
 */

import { google } from 'googleapis';

/**
 * DriveConnector class - Handles all Google Drive template operations
 */
export class DriveConnector {
  constructor(credentials) {
    this.credentials = credentials;
    this.drive = null;
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Initialize Google Drive client with service account
   */
  async initialize() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: this.credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });

      const authClient = await auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });

      return { success: true, message: 'Drive connector initialized' };
    } catch (error) {
      console.error('Drive initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan Drive folder recursively for templates
   * @param {string} folderId - Drive folder ID (optional, uses root if not specified)
   * @returns {Promise<Object>} Scan results with template count and metadata
   */
  async scanTemplates(folderId = null) {
    try {
      // Check cache first
      const cacheKey = `scan_${folderId || 'root'}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      if (!this.drive) {
        await this.initialize();
      }

      const templates = [];

      // Search for Codenest_drive_data folder if no folderId provided
      let targetFolderId = folderId;
      if (!targetFolderId) {
        const folderSearch = await this.drive.files.list({
          q: "name='Codenest_drive_data' and mimeType='application/vnd.google-apps.folder'",
          fields: 'files(id, name)',
          spaces: 'drive',
        });

        if (folderSearch.data.files.length > 0) {
          targetFolderId = folderSearch.data.files[0].id;
        } else {
          return {
            success: false,
            error: 'Codenest_drive_data folder not found',
            templates: [],
            count: 0
          };
        }
      }

      // Recursively scan folder
      await this.scanFolder(targetFolderId, templates, '');

      // Categorize and tag templates
      const categorizedTemplates = templates.map(template => {
        return {
          ...template,
          category: this.categorizeTemplate(template),
          tags: this.generateTags(template),
          placeholders: this.extractPlaceholders(template)
        };
      });

      const result = {
        success: true,
        templates: categorizedTemplates,
        count: categorizedTemplates.length,
        folderId: targetFolderId,
        scannedAt: new Date().toISOString()
      };

      // Cache results
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Template scan error:', error);
      return {
        success: false,
        error: error.message,
        templates: [],
        count: 0
      };
    }
  }

  /**
   * Recursively scan a folder for template files
   */
  async scanFolder(folderId, templates, path) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
        pageSize: 1000,
        spaces: 'drive',
      });

      const files = response.data.files;

      for (const file of files) {
        const currentPath = path ? `${path}/${file.name}` : file.name;

        // If it's a folder, scan recursively
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          await this.scanFolder(file.id, templates, currentPath);
        }
        // If it's a template file (HTML, PDF, TXT, JS, CSS, etc.)
        else if (this.isTemplateFile(file.name, file.mimeType)) {
          templates.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: parseInt(file.size) || 0,
            path: currentPath,
            webViewLink: file.webViewLink,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            fromDrive: true
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${folderId}:`, error);
    }
  }

  /**
   * Check if file is a valid template file
   */
  isTemplateFile(filename, mimeType) {
    const validExtensions = ['.html', '.htm', '.pdf', '.txt', '.js', '.css', '.json', '.md'];
    const validMimeTypes = [
      'text/html',
      'application/pdf',
      'text/plain',
      'application/javascript',
      'text/javascript',
      'text/css',
      'application/json',
      'text/markdown'
    ];

    const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    const hasValidMimeType = validMimeTypes.some(type => mimeType && mimeType.includes(type));

    return hasValidExtension || hasValidMimeType;
  }

  /**
   * Categorize template by folder path and filename
   */
  categorizeTemplate(template) {
    const path = template.path.toLowerCase();
    const name = template.name.toLowerCase();

    if (path.includes('landing') || name.includes('landing')) {
      return 'landing-pages';
    } else if (path.includes('dashboard') || name.includes('dashboard')) {
      return 'dashboards';
    } else if (path.includes('ecommerce') || path.includes('shop') || name.includes('ecommerce')) {
      return 'ecommerce';
    } else if (path.includes('blog') || name.includes('blog')) {
      return 'blogs';
    } else if (path.includes('portfolio') || name.includes('portfolio')) {
      return 'portfolios';
    } else if (path.includes('app') || name.includes('app')) {
      return 'web-apps';
    } else if (path.includes('admin') || name.includes('admin')) {
      return 'admin-panels';
    } else if (path.includes('component') || name.includes('component')) {
      return 'components';
    } else {
      return 'general';
    }
  }

  /**
   * Generate tags based on content, filename, and path
   */
  generateTags(template) {
    const tags = [];
    const text = `${template.path} ${template.name}`.toLowerCase();

    // Industry tags
    const industries = {
      'restaurant': ['food', 'dining', 'menu'],
      'healthcare': ['medical', 'health', 'clinic', 'doctor'],
      'finance': ['banking', 'investment', 'finance', 'accounting'],
      'retail': ['shop', 'store', 'retail', 'ecommerce'],
      'real-estate': ['property', 'real-estate', 'realty'],
      'education': ['school', 'education', 'learning', 'course'],
      'technology': ['tech', 'software', 'saas', 'app'],
      'consulting': ['consulting', 'advisory', 'services']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(industry);
      }
    }

    // Feature tags
    if (text.includes('booking') || text.includes('reservation')) tags.push('booking');
    if (text.includes('payment') || text.includes('checkout')) tags.push('payments');
    if (text.includes('auth') || text.includes('login')) tags.push('authentication');
    if (text.includes('search')) tags.push('search');
    if (text.includes('cart')) tags.push('shopping-cart');
    if (text.includes('form') || text.includes('contact')) tags.push('forms');
    if (text.includes('gallery') || text.includes('portfolio')) tags.push('gallery');
    if (text.includes('blog') || text.includes('article')) tags.push('blog');
    if (text.includes('responsive')) tags.push('responsive');
    if (text.includes('api')) tags.push('api-integration');

    // Tech stack tags
    if (text.includes('react')) tags.push('react');
    if (text.includes('vue')) tags.push('vue');
    if (text.includes('angular')) tags.push('angular');
    if (text.includes('tailwind')) tags.push('tailwind');
    if (text.includes('bootstrap')) tags.push('bootstrap');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract placeholder variables from template name/path
   */
  extractPlaceholders(template) {
    return [
      '{{BRAND_NAME}}',
      '{{SERVICES_LIST}}',
      '{{PRIMARY_COLOR}}',
      '{{SECONDARY_COLOR}}',
      '{{CONTACT_EMAIL}}',
      '{{CONTACT_PHONE}}',
      '{{ADDRESS}}',
      '{{BUSINESS_DESCRIPTION}}',
      '{{LOGO_URL}}',
      '{{HERO_IMAGE_URL}}',
      '{{CTA_TEXT}}',
      '{{CTA_LINK}}'
    ];
  }

  /**
   * Search templates by criteria
   * @param {Object} criteria - Search criteria (industry, features, category, etc.)
   * @returns {Promise<Object>} Matching templates ranked by relevance
   */
  async searchTemplates(criteria = {}) {
    try {
      // Get all templates (from cache if available)
      const scanResult = await this.scanTemplates();

      if (!scanResult.success) {
        return scanResult;
      }

      let templates = scanResult.templates;

      // Apply filters
      if (criteria.category) {
        templates = templates.filter(t => t.category === criteria.category);
      }

      if (criteria.industry) {
        templates = templates.filter(t =>
          t.tags.includes(criteria.industry.toLowerCase())
        );
      }

      if (criteria.features && Array.isArray(criteria.features)) {
        templates = templates.filter(t =>
          criteria.features.some(feature =>
            t.tags.includes(feature.toLowerCase())
          )
        );
      }

      if (criteria.techStack) {
        templates = templates.filter(t =>
          t.tags.includes(criteria.techStack.toLowerCase())
        );
      }

      // Search by business intent (keyword matching)
      if (criteria.businessIntent) {
        const intent = criteria.businessIntent.toLowerCase();
        templates = templates.map(template => {
          let score = 0;
          const searchText = `${template.name} ${template.path} ${template.tags.join(' ')}`.toLowerCase();

          // Score based on keyword matches
          const keywords = intent.split(/\s+/);
          keywords.forEach(keyword => {
            if (searchText.includes(keyword)) {
              score += 1;
            }
          });

          // Boost score for exact category matches
          if (intent.includes(template.category)) {
            score += 5;
          }

          return { ...template, relevanceScore: score };
        }).filter(t => t.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      return {
        success: true,
        templates: templates.slice(0, criteria.limit || 50),
        count: templates.length,
        criteria: criteria,
        searchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Template search error:', error);
      return {
        success: false,
        error: error.message,
        templates: [],
        count: 0
      };
    }
  }

  /**
   * Get template content from Drive
   * @param {string} templateId - Drive file ID
   * @returns {Promise<Object>} Template content
   */
  async getTemplateContent(templateId) {
    try {
      const cacheKey = `content_${templateId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }

      if (!this.drive) {
        await this.initialize();
      }

      const response = await this.drive.files.get({
        fileId: templateId,
        alt: 'media'
      }, {
        responseType: 'text'
      });

      const result = {
        success: true,
        content: response.data,
        templateId: templateId
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Get template content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Inject brand data into template placeholders
   * @param {string} content - Template content
   * @param {Object} brandData - Brand information to inject
   * @returns {string} Content with placeholders replaced
   */
  injectBrandData(content, brandData) {
    let injectedContent = content;

    const placeholderMap = {
      '{{BRAND_NAME}}': brandData.brandName || 'Your Business',
      '{{SERVICES_LIST}}': brandData.services || 'Our Services',
      '{{PRIMARY_COLOR}}': brandData.primaryColor || '#3B82F6',
      '{{SECONDARY_COLOR}}': brandData.secondaryColor || '#8B5CF6',
      '{{CONTACT_EMAIL}}': brandData.email || 'contact@example.com',
      '{{CONTACT_PHONE}}': brandData.phone || '(555) 123-4567',
      '{{ADDRESS}}': brandData.address || '123 Main St, City, State',
      '{{BUSINESS_DESCRIPTION}}': brandData.description || 'Quality services for your needs',
      '{{LOGO_URL}}': brandData.logoUrl || '/logo.png',
      '{{HERO_IMAGE_URL}}': brandData.heroImageUrl || '/hero.jpg',
      '{{CTA_TEXT}}': brandData.ctaText || 'Get Started',
      '{{CTA_LINK}}': brandData.ctaLink || '#contact'
    };

    for (const [placeholder, value] of Object.entries(placeholderMap)) {
      injectedContent = injectedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    return injectedContent;
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // Try to access Drive
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });

      return {
        status: 'connected',
        cacheSize: this.cache.size,
        message: 'Google Drive connection healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        message: 'Google Drive connection failed'
      };
    }
  }
}

/**
 * Create singleton instance for use in worker
 */
let driveConnectorInstance = null;

export function getDriveConnector(credentials) {
  if (!driveConnectorInstance && credentials) {
    driveConnectorInstance = new DriveConnector(credentials);
  }
  return driveConnectorInstance;
}
