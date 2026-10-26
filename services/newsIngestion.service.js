const RssParser = require('rss-parser');
const sanitizeHtml = require('sanitize-html');
const newsModel = require('../models/news.model');
const newsSourceModel = require('../models/newsSource.model');
const config = require('../config');
const logger = require('../utils/logger');
const { normalizeUrl, validateFetchUrl } = require('../utils/urlUtils');

// Request timeout for feed fetching (15 seconds)
const FETCH_TIMEOUT_MS = 15000;

// Maximum articles to process per source per fetch cycle
const MAX_ARTICLES_PER_FETCH = 50;

const CATEGORY_KEYWORDS = {
  politics: [
    'governor', 'senator', 'election', 'political', 'government', 'policy',
    'legislation', 'parliament', 'campaign', 'minister', 'presidency',
    'oyo state government', 'house of assembly', 'council', 'lgc', 'lga',
  ],
  education: [
    'school', 'university', 'education', 'student', 'teacher', 'academic',
    'scholarship', 'lautech', 'lecture', 'exam', 'waec', 'jamb', 'neco',
    'curriculum', 'learning', 'literacy',
  ],
  community: [
    'community', 'ogbomoso', 'neighbourhood', 'development', 'social',
    'empowerment', 'ngo', 'charity', 'volunteer', 'outreach', 'welfare',
    'cooperative', 'town hall', 'community leader',
  ],
  youth: [
    'youth', 'young', 'empowerment', 'skill', 'training', 'mentoring',
    'startup', 'entrepreneurship', 'graduate', 'nysc', 'internship',
  ],
  health: [
    'health', 'hospital', 'medical', 'disease', 'doctor', 'vaccine',
    'covid', 'malaria', 'clinic', 'phc', 'epidemic', 'mental health',
  ],
  sports: [
    'sports', 'football', 'nff', 'npfl', 'atletico', 'basketball',
    'athlete', 'tournament', 'championship', 'match', 'league',
  ],
  technology: [
    'technology', 'tech', 'digital', 'software', 'app', 'internet',
    'innovation', 'startup', 'ai', 'blockchain', 'fintech',
  ],
  business: [
    'business', 'economy', 'market', 'trade', 'investment', 'cbn',
    'naira', 'stock', 'commerce', 'import', 'export', 'industry',
  ],
  entertainment: [
    'entertainment', 'movie', 'music', 'nollywood', 'concert', 'festival',
    'celebrity', 'award', 'art', 'culture',
  ],
  security: [
    'security', 'police', 'crime', 'arrest', 'robbery', 'kidnap',
    'military', 'attack', 'conflict', 'amotekun', 'vigilante',
  ],
  environment: [
    'environment', 'climate', 'flood', 'erosion', 'waste', 'pollution',
    'deforestation', 'conservation', 'sanitation',
  ],
  agriculture: [
    'agriculture', 'farming', 'crop', 'harvest', 'livestock', 'agric',
    'food security', 'irrigation', 'fertilizer',
  ],
  infrastructure: [
    'road', 'infrastructure', 'construction', 'bridge', 'electricity',
    'power', 'water supply', 'housing', 'transport',
  ],
};

// Location keywords for relevance filtering
const LOCATION_KEYWORDS = [
  'ogbomoso', 'ogbomosho', 'oyo', 'oyo state', 'ibadan', 'nigeria',
  'oke-ogun', 'saki', 'iseyin', 'eruwa', 'lanlate', 'ibarapa',
  'south-west', 'south west', 'yoruba',
];

/**
 * News ingestion service — fetches articles from configured RSS/Atom sources
 */
class NewsIngestionService {
  constructor() {
    this.parser = new RssParser({
      timeout: FETCH_TIMEOUT_MS,
      headers: {
        'User-Agent': 'BFCN-NewsAggregator/1.0 (+https://bfcn.org)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      maxRedirects: 3,
    });

    this._isRunning = false;
  }

  /**
   * Fetch and ingest articles from all enabled sources.
   * Returns a summary of the run.
   */
  async fetchAllSources() {
    if (this._isRunning) {
      logger.warn('News ingestion: A fetch job is already running, skipping.');
      return { skipped: true, reason: 'Already running' };
    }

    this._isRunning = true;
    const startTime = Date.now();

    const summary = {
      totalSources: 0,
      successfulSources: 0,
      failedSources: 0,
      newArticles: 0,
      duplicateArticles: 0,
      errors: [],
      startedAt: new Date().toISOString(),
    };

    try {
      const sources = await newsSourceModel.find({ enabled: true });
      summary.totalSources = sources.length;

      if (sources.length === 0) {
        logger.info('News ingestion: No enabled sources configured.');
        summary.message = 'No enabled news sources configured. Add sources via the admin API.';
        return summary;
      }

      logger.info(`News ingestion: Starting fetch for ${sources.length} source(s).`);

      // Process each source independently
      for (const source of sources) {
        try {
          const result = await this.fetchSource(source);
          summary.newArticles += result.newArticles;
          summary.duplicateArticles += result.duplicates;
          summary.successfulSources++;
        } catch (err) {
          summary.failedSources++;
          summary.errors.push({
            source: source.name,
            error: err.message,
          });
          logger.error(`News ingestion: Failed to fetch source "${source.name}":`, err.message);

          // Update source with error info
          await newsSourceModel.findByIdAndUpdate(source._id, {
            lastFetchError: err.message,
            $inc: { consecutiveFailures: 1 },
          });
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      summary.completedAt = new Date().toISOString();
      summary.elapsedSeconds = parseFloat(elapsed);

      logger.info(
        `News ingestion complete: ${summary.successfulSources}/${summary.totalSources} sources, ` +
        `${summary.newArticles} new articles, ${summary.duplicateArticles} duplicates, ` +
        `${summary.failedSources} failures, ${elapsed}s elapsed.`
      );

      return summary;
    } finally {
      this._isRunning = false;
    }
  }

  /**
   * Fetch and process articles from a single source.
   * @param {Object} source - NewsSource document
   * @returns {{ newArticles: number, duplicates: number }}
   */
  async fetchSource(source) {
    // Validate the feed URL before fetching
    const allowedHosts = source.allowedHost ? [source.allowedHost] : [];
    const urlCheck = validateFetchUrl(source.feedUrl, allowedHosts);
    if (!urlCheck.valid) {
      throw new Error(`Unsafe feed URL: ${urlCheck.reason}`);
    }

    logger.info(`News ingestion: Fetching "${source.name}" from ${source.feedUrl}`);

    let feed;
    try {
      feed = await this.parser.parseURL(source.feedUrl);
    } catch (err) {
      throw new Error(`Feed parse error: ${err.message}`);
    }

    if (!feed || !feed.items || !Array.isArray(feed.items)) {
      throw new Error('Feed returned no items');
    }

    const items = feed.items.slice(0, MAX_ARTICLES_PER_FETCH);
    let newArticles = 0;
    let duplicates = 0;

    const autoPublish = config.news?.autoPublish === true || config.news?.autoPublish === 'true';

    for (const item of items) {
      try {
        const result = await this.processItem(item, source, autoPublish);
        if (result === 'new') {
          newArticles++;
        } else if (result === 'duplicate') {
          duplicates++;
        }
      } catch (err) {
        // Log but don't crash the whole source on a single item error
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn(`News ingestion: Error processing item from "${source.name}": ${errorMessage}`);
      }
    }

    // Update source statistics
    await newsSourceModel.findByIdAndUpdate(source._id, {
      lastFetchedAt: new Date(),
      lastFetchError: null,
      consecutiveFailures: 0,
      $inc: {
        fetchCount: 1,
        articlesCollected: newArticles,
      },
    });

    logger.info(
      `News ingestion: "${source.name}" — ${newArticles} new, ${duplicates} duplicates ` +
      `(of ${items.length} items).`
    );

    return { newArticles, duplicates };
  }

  /**
   * Process a single RSS/Atom feed item into a news article.
   * @param {Object} item - RSS feed item
   * @param {Object} source - NewsSource document
   * @param {boolean} autoPublish - Whether to auto-publish from trusted sources
   * @returns {'new' | 'duplicate' | 'skipped'}
   */
  async processItem(item, source, autoPublish) {
    // Safely extract title and link
    let title = '';
    let link = '';

    try {
      title = this.sanitizeText(item.title);
      link = item.link || item.guid || '';
    } catch (err) {
      logger.debug(`News ingestion: Failed to extract basic fields from item:`, err.message);
      return 'skipped';
    }

    // Must have a title and link
    if (!title || title.length < 5) {
      return 'skipped';
    }

    if (!link) {
      return 'skipped';
    }

    // Normalize URL for dedup
    const normalized = normalizeUrl(link);
    if (!normalized) {
      return 'skipped';
    }

    // Check for existing article with same normalized URL
    const existing = await newsModel.findOne({ normalizedSourceUrl: normalized });
    if (existing) {
      return 'duplicate';
    }

    // Extract data safely
    let summary = '';
    let imageUrl = '';
    let publishedAt = null;
    let category = source.defaultCategory;
    let location = '';

    try {
      summary = this.extractSummary(item);
      imageUrl = this.extractImage(item);
      publishedAt = this.parseDate(item.pubDate || item.isoDate) || new Date();
      category = this.categorize(title, summary, source.defaultCategory);
      location = this.detectLocation(title, summary);
    } catch (err) {
      logger.debug(`News ingestion: Error extracting fields from "${title}":`, err.message);
      // Continue with minimal data
    }

    // Determine publication status
    let status = 'pending';
    if (autoPublish && source.trusted) {
      status = 'published';
    }

    const articleData = {
      title,
      summary,
      content: summary, // Use summary as content for backwards compat
      sourceName: source.name,
      sourceUrl: link,
      normalizedSourceUrl: normalized,
      sourceId: source._id,
      imageUrl: imageUrl || '',
      image: imageUrl || '', // Legacy field
      author: source.name, // Legacy field — use source name
      category,
      location,
      publishedAt: publishedAt || new Date(),
      collectedAt: new Date(),
      status,
      featured: false,
      language: 'en',
      published: status === 'published', // Legacy compat
    };

    try {
      await newsModel.create(articleData);
      return 'new';
    } catch (err) {
      // Handle duplicate key errors gracefully
      if (err.code === 11000) {
        return 'duplicate';
      }
      throw err;
    }
  }

  /**
   * Sanitize text content — strip HTML, decode entities, trim whitespace.
   */
  sanitizeText(text) {
    // Ensure we're working with a string
    if (!text) {
      return '';
    }
    
    // If it's not a string, convert it carefully
    let textStr = text;
    if (typeof text !== 'string') {
      try {
        textStr = String(text);
      } catch {
        return '';
      }
    }

    try {
      // Use sanitizeHtml only if it looks like HTML
      let cleaned = textStr;
      if (textStr.includes('<')) {
        cleaned = sanitizeHtml(textStr, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }

      return cleaned
        .replace(/\s+/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    } catch (err) {
      // If sanitization fails, try basic string handling
      if (typeof textStr === 'string') {
        return textStr.replace(/\s+/g, ' ').trim();
      }
      return '';
    }
  }

  /**
   * Extract a summary/excerpt from the feed item.
   */
  extractSummary(item) {
    const raw = item.contentSnippet || item.summary || item.description || '';
    
    // Just trim whitespace, don't use sanitizeHtml for simple text
    const cleaned = String(raw)
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to reasonable length
    if (cleaned.length > 1500) {
      return cleaned.substring(0, 1497) + '...';
    }

    return cleaned;
  }

  /**
   * Extract an image URL from the feed item if available.
   */
  extractImage(item) {
    // Check enclosures (common RSS pattern)
    if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }

    // Check media content
    if (item['media:content'] && item['media:content'].$?.url) {
      return item['media:content'].$.url;
    }

    // Check media thumbnail
    if (item['media:thumbnail'] && item['media:thumbnail'].$?.url) {
      return item['media:thumbnail'].$.url;
    }

    // Try to extract from content HTML
    const content = item.content || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }

    return '';
  }

  /**
   * Parse a date string safely.
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      // Validate the date is reasonable (not in far future or past)
      const now = Date.now();
      const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
      const oneDayAhead = now + (24 * 60 * 60 * 1000);

      if (date.getTime() >= oneYearAgo && date.getTime() <= oneDayAhead) {
        return date;
      }

      // If date is slightly in the future (timezone issues), still accept it
      if (date.getTime() > oneDayAhead && date.getTime() <= now + (7 * 24 * 60 * 60 * 1000)) {
        return date;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Categorize an article based on its title and content.
   */
  categorize(title, summary, defaultCategory) {
    // Simple string matching without iteration over large arrays
    const text = `${title} ${summary}`.toLowerCase();

    if (text.includes('politics') || text.includes('government') || text.includes('election')) {
      return 'politics';
    }
    if (text.includes('education') || text.includes('school') || text.includes('student')) {
      return 'education';
    }
    if (text.includes('health') || text.includes('hospital') || text.includes('medical')) {
      return 'health';
    }
    if (text.includes('sport') || text.includes('football') || text.includes('athlete')) {
      return 'sports';
    }
    if (text.includes('entertainment') || text.includes('music') || text.includes('movie') || text.includes('nollywood')) {
      return 'entertainment';
    }
    if (text.includes('business') || text.includes('economy') || text.includes('market') || text.includes('trade')) {
      return 'business';
    }
    if (text.includes('security') || text.includes('police') || text.includes('crime')) {
      return 'security';
    }

    return defaultCategory || 'general';
  }

  /**
   * Detect location mentions in the text.
   */
  detectLocation(title, summary) {
    try {
      const text = `${title} ${summary}`.toLowerCase();

      // Defensive checks for LOCATION_KEYWORDS
      const locations = [
        'ogbomoso', 'ogbomosho', 'oyo', 'oyo state', 'ibadan', 'nigeria',
        'oke-ogun', 'saki', 'iseyin', 'eruwa', 'lanlate', 'ibarapa',
        'south-west', 'south west', 'yoruba',
      ];

      for (const location of locations) {
        if (text.includes(location.toLowerCase())) {
          // Return a nicer formatted version
          if (location === 'ogbomoso' || location === 'ogbomosho') return 'Ogbomoso';
          if (location === 'oyo' || location === 'oyo state') return 'Oyo State';
          if (location === 'ibadan') return 'Ibadan';
          if (location === 'nigeria') return 'Nigeria';
          return location.charAt(0).toUpperCase() + location.slice(1);
        }
      }

      return '';
    } catch (err) {
      logger.debug(`News ingestion: Error detecting location: ${err.message}`);
      return '';
    }
  }

  /**
   * Check if the service is currently running a fetch job
   */
  get isRunning() {
    return this._isRunning;
  }
}

module.exports = new NewsIngestionService();
