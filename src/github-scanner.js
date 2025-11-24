/**
 * GitHub Template Scanner
 * Scans heyns1000 GitHub repositories for usable templates
 *
 * Discovers templates from 83+ repositories across various categories:
 * - Landing pages, dashboards, e-commerce sites
 * - SaaS applications, portfolios, admin panels
 * - React, Vue, HTML templates
 */

const GITHUB_CONFIG = {
  username: 'heyns1000',
  priorityRepos: [
    'codenest',
    'hotstack',
    'buildnest',
    'fruitful',
    'samfox',
    'universal-fleet-auto-pilot'
  ],
  templateExtensions: ['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte'],
  templatePaths: ['templates/', 'public/', 'src/', 'dist/', 'pages/', 'components/'],
  excludePaths: ['node_modules/', '.git/', 'test/', 'tests/', '__tests__/']
};

/**
 * GitHubScanner class - Discovers templates from GitHub repositories
 */
export class GitHubScanner {
  constructor(token) {
    this.token = token;
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Scan all repositories for templates
   * @returns {Promise<Object>} Scan results with template count and metadata
   */
  async scanRepositories() {
    try {
      // Check cache first
      const cached = this.getFromCache('scan_all_repos');
      if (cached) {
        return { ...cached, fromCache: true };
      }

      console.log('🔍 Scanning GitHub repositories...');

      // 1. List all repositories
      const repos = await this.listRepositories();
      console.log(`📦 Found ${repos.length} repositories`);

      // 2. Prioritize repositories
      const prioritized = this.prioritizeRepositories(repos);

      // 3. Scan each repository for templates
      const allTemplates = [];
      let scannedCount = 0;

      for (const repo of prioritized) {
        try {
          const templates = await this.scanRepository(repo);
          if (templates.length > 0) {
            allTemplates.push(...templates);
            console.log(`✅ ${repo.name}: ${templates.length} templates`);
          }
          scannedCount++;

          // Rate limiting: pause every 10 repos
          if (scannedCount % 10 === 0) {
            await this.sleep(1000);
          }
        } catch (error) {
          console.error(`❌ Error scanning ${repo.name}:`, error.message);
        }
      }

      // 4. Categorize and enrich templates
      const enrichedTemplates = allTemplates.map(template => ({
        ...template,
        tags: this.generateTags(template),
        category: this.inferCategory(template)
      }));

      const result = {
        success: true,
        source: 'github',
        repositories: repos.length,
        scannedRepositories: scannedCount,
        templatesFound: enrichedTemplates.length,
        templates: enrichedTemplates,
        categories: this.groupByCategory(enrichedTemplates),
        scannedAt: new Date().toISOString()
      };

      // Cache results
      this.setCache('scan_all_repos', result);

      return result;
    } catch (error) {
      console.error('GitHub scan error:', error);
      return {
        success: false,
        error: error.message,
        templates: [],
        count: 0
      };
    }
  }

  /**
   * List all repositories for user
   */
  async listRepositories() {
    const repos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) { // Limit to 5 pages (500 repos max)
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_CONFIG.username}/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HotStack-Template-Scanner'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      repos.push(...data);

      hasMore = data.length === 100;
      page++;
    }

    return repos;
  }

  /**
   * Prioritize repositories for scanning
   */
  prioritizeRepositories(repos) {
    const priority = [];
    const normal = [];

    for (const repo of repos) {
      if (GITHUB_CONFIG.priorityRepos.includes(repo.name)) {
        priority.push(repo);
      } else {
        normal.push(repo);
      }
    }

    // Priority repos first, then sort normal repos by update date
    return [
      ...priority,
      ...normal.sort((a, b) =>
        new Date(b.updated_at) - new Date(a.updated_at)
      )
    ];
  }

  /**
   * Scan a single repository for templates
   */
  async scanRepository(repo) {
    const templates = [];

    // Get repository tree
    const tree = await this.getRepositoryTree(repo.full_name, repo.default_branch);

    if (!tree) {
      return templates;
    }

    // Filter template files
    for (const item of tree) {
      if (item.type === 'blob' && this.isTemplateFile(item.path)) {
        templates.push({
          id: item.sha,
          name: this.getFileName(item.path),
          path: item.path,
          repo: repo.name,
          repoFullName: repo.full_name,
          url: `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${item.path}`,
          repoUrl: repo.html_url,
          fileUrl: `${repo.html_url}/blob/${repo.default_branch}/${item.path}`,
          source: 'github',
          size: item.size || 0,
          sha: item.sha,
          language: repo.language,
          repoDescription: repo.description,
          stars: repo.stargazers_count || 0,
          updatedAt: repo.updated_at
        });
      }
    }

    return templates;
  }

  /**
   * Get repository tree (all files)
   */
  async getRepositoryTree(repoFullName, branch) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HotStack-Template-Scanner'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.tree || [];
    } catch (error) {
      console.error(`Error getting tree for ${repoFullName}:`, error);
      return null;
    }
  }

  /**
   * Check if file is a template file
   */
  isTemplateFile(path) {
    // Exclude certain paths
    if (GITHUB_CONFIG.excludePaths.some(exclude => path.includes(exclude))) {
      return false;
    }

    // Check if in template paths
    const inTemplatePath = GITHUB_CONFIG.templatePaths.some(templatePath =>
      path.includes(templatePath)
    );

    // Check file extension
    const hasValidExtension = GITHUB_CONFIG.templateExtensions.some(ext =>
      path.toLowerCase().endsWith(ext)
    );

    // Either in template path OR has valid extension
    return (inTemplatePath && hasValidExtension) ||
           (hasValidExtension && this.looksLikeTemplate(path));
  }

  /**
   * Check if path looks like a template
   */
  looksLikeTemplate(path) {
    const lower = path.toLowerCase();
    const indicators = [
      'template', 'landing', 'dashboard', 'page', 'layout',
      'home', 'index', 'main', 'app', 'site'
    ];

    return indicators.some(indicator => lower.includes(indicator));
  }

  /**
   * Get filename from path
   */
  getFileName(path) {
    return path.split('/').pop();
  }

  /**
   * Infer template category
   */
  inferCategory(template) {
    const combined = `${template.repo} ${template.path} ${template.repoDescription || ''}`.toLowerCase();

    if (combined.includes('landing') || combined.includes('home')) {
      return 'landing-page';
    } else if (combined.includes('dashboard') || combined.includes('admin')) {
      return 'dashboard';
    } else if (combined.includes('ecommerce') || combined.includes('shop') || combined.includes('store')) {
      return 'ecommerce';
    } else if (combined.includes('saas') || combined.includes('platform')) {
      return 'saas';
    } else if (combined.includes('blog') || combined.includes('article')) {
      return 'blog';
    } else if (combined.includes('portfolio') || combined.includes('showcase')) {
      return 'portfolio';
    } else if (combined.includes('app')) {
      return 'web-app';
    } else if (combined.includes('component')) {
      return 'component';
    } else {
      return 'general';
    }
  }

  /**
   * Generate tags for template
   */
  generateTags(template) {
    const tags = [];
    const text = `${template.repo} ${template.path} ${template.repoDescription || ''} ${template.language || ''}`.toLowerCase();

    // Industry tags
    const industries = {
      'restaurant': ['food', 'dining', 'menu', 'restaurant'],
      'healthcare': ['medical', 'health', 'clinic', 'doctor', 'healthcare'],
      'finance': ['banking', 'investment', 'finance', 'accounting', 'fintech'],
      'retail': ['shop', 'store', 'retail', 'ecommerce'],
      'real-estate': ['property', 'real-estate', 'realty', 'housing'],
      'education': ['school', 'education', 'learning', 'course', 'university'],
      'technology': ['tech', 'software', 'saas', 'startup'],
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
    if (text.includes('gallery')) tags.push('gallery');
    if (text.includes('blog')) tags.push('blog');
    if (text.includes('responsive')) tags.push('responsive');
    if (text.includes('api')) tags.push('api');

    // Tech stack tags
    if (text.includes('react') || template.path.includes('.jsx') || template.path.includes('.tsx')) {
      tags.push('react');
    }
    if (text.includes('vue') || template.path.includes('.vue')) {
      tags.push('vue');
    }
    if (text.includes('angular')) tags.push('angular');
    if (text.includes('svelte') || template.path.includes('.svelte')) {
      tags.push('svelte');
    }
    if (text.includes('tailwind')) tags.push('tailwind');
    if (text.includes('bootstrap')) tags.push('bootstrap');
    if (text.includes('typescript') || template.path.includes('.tsx') || template.path.includes('.ts')) {
      tags.push('typescript');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Group templates by category
   */
  groupByCategory(templates) {
    const categories = {};

    for (const template of templates) {
      const category = template.category || 'general';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    }

    return categories;
  }

  /**
   * Search templates by criteria
   */
  async searchTemplates(criteria = {}) {
    try {
      // Get all templates
      const scanResult = await this.scanRepositories();

      if (!scanResult.success) {
        return scanResult;
      }

      let templates = scanResult.templates;

      // Apply filters
      if (criteria.category) {
        templates = templates.filter(t => t.category === criteria.category);
      }

      if (criteria.repo) {
        templates = templates.filter(t => t.repo.toLowerCase().includes(criteria.repo.toLowerCase()));
      }

      if (criteria.industry) {
        templates = templates.filter(t =>
          t.tags.includes(criteria.industry.toLowerCase())
        );
      }

      if (criteria.techStack) {
        templates = templates.filter(t =>
          t.tags.includes(criteria.techStack.toLowerCase())
        );
      }

      // Search by business intent
      if (criteria.businessIntent) {
        const intent = criteria.businessIntent.toLowerCase();
        templates = templates.map(template => {
          let score = 0;
          const searchText = `${template.name} ${template.path} ${template.repo} ${template.repoDescription || ''} ${template.tags.join(' ')}`.toLowerCase();

          // Score based on keyword matches
          const keywords = intent.split(/\s+/);
          keywords.forEach(keyword => {
            const matches = (searchText.match(new RegExp(keyword, 'g')) || []).length;
            score += matches;
          });

          // Boost score for exact category matches
          if (intent.includes(template.category)) {
            score += 10;
          }

          // Boost score for repo name matches
          if (template.repo.toLowerCase().includes(intent)) {
            score += 5;
          }

          // Boost score for stars (popularity)
          score += Math.min(template.stars / 10, 5);

          return { ...template, relevanceScore: score };
        }).filter(t => t.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      return {
        success: true,
        source: 'github',
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
   * Get template content from GitHub
   */
  async getTemplateContent(template) {
    try {
      const response = await fetch(template.url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'HotStack-Template-Scanner'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status}`);
      }

      const content = await response.text();

      return {
        success: true,
        content: content,
        template: template
      };
    } catch (error) {
      console.error('Get template content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Inject brand data into template
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

    // Replace placeholders
    for (const [placeholder, value] of Object.entries(placeholderMap)) {
      injectedContent = injectedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    // Also try to inject into common HTML patterns
    injectedContent = this.injectIntoCommonPatterns(injectedContent, brandData);

    return injectedContent;
  }

  /**
   * Inject brand data into common HTML patterns
   */
  injectIntoCommonPatterns(content, brandData) {
    let modified = content;

    // Try to replace common title patterns
    if (brandData.brandName) {
      modified = modified.replace(
        /<title>.*?<\/title>/i,
        `<title>${brandData.brandName}</title>`
      );

      modified = modified.replace(
        /<h1[^>]*>.*?<\/h1>/i,
        `<h1>${brandData.brandName}</h1>`
      );
    }

    // Try to replace description meta tags
    if (brandData.description) {
      modified = modified.replace(
        /<meta\s+name=["']description["']\s+content=["'].*?["']/i,
        `<meta name="description" content="${brandData.description}"`
      );
    }

    return modified;
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
   * Sleep utility for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_CONFIG.username}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HotStack-Template-Scanner'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const user = await response.json();

      return {
        status: 'connected',
        username: user.login,
        publicRepos: user.public_repos,
        cacheSize: this.cache.size,
        message: 'GitHub connection healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        message: 'GitHub connection failed'
      };
    }
  }
}

/**
 * Create singleton instance
 */
let gitHubScannerInstance = null;

export function getGitHubScanner(token) {
  if (!gitHubScannerInstance && token) {
    gitHubScannerInstance = new GitHubScanner(token);
  }
  return gitHubScannerInstance;
}
