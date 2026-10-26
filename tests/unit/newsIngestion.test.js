/**
 * Tests for the news ingestion service.
 * Uses mocked RSS feeds and models to avoid live network/DB calls.
 */

// Mock sanitize-html (ESM module) before everything else
jest.mock('sanitize-html', () => {
  return jest.fn((text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '');
  });
});

jest.mock('rss-parser');
jest.mock('../../models/news.model');
jest.mock('../../models/newsSource.model');
jest.mock('slugify', () => {
  return jest.fn((text, opts) => {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
});

const newsModel = require('../../models/news.model');
const newsSourceModel = require('../../models/newsSource.model');
const newsIngestionService = require('../../services/newsIngestion.service');

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the _isRunning flag
  newsIngestionService._isRunning = false;
});

// Sample RSS feed data
const createMockFeedItem = (overrides = {}) => ({
  title: 'Ogbomoso Youth Empowerment Program Launches',
  link: 'https://news.example.com/article/ogbomoso-youth-program',
  pubDate: new Date().toISOString(),
  contentSnippet: 'A new youth empowerment program has been launched in Ogbomoso to support community development.',
  content: '<p>A new youth empowerment program has been launched in Ogbomoso.</p>',
  guid: 'https://news.example.com/article/ogbomoso-youth-program',
  ...overrides,
});

const createMockSource = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test News Source',
  feedUrl: 'https://news.example.com/rss',
  sourceType: 'rss',
  defaultCategory: 'general',
  enabled: true,
  trusted: false,
  allowedHost: 'news.example.com',
  ...overrides,
});

describe('NewsIngestionService', () => {
  describe('sanitizeText', () => {
    test('should strip HTML tags', () => {
      const result = newsIngestionService.sanitizeText('<p>Hello <b>world</b></p>');
      expect(result).toBe('Hello world');
    });

    test('should handle null/undefined input', () => {
      expect(newsIngestionService.sanitizeText(null)).toBe('');
      expect(newsIngestionService.sanitizeText(undefined)).toBe('');
    });

    test('should decode HTML entities', () => {
      const result = newsIngestionService.sanitizeText('Tom &amp; Jerry');
      expect(result).toBe('Tom & Jerry');
    });

    test('should collapse multiple whitespace', () => {
      const result = newsIngestionService.sanitizeText('Hello    world   test');
      expect(result).toBe('Hello world test');
    });
  });

  describe('extractSummary', () => {
    test('should extract from contentSnippet first', () => {
      const item = { contentSnippet: 'Snippet text', content: 'Full content' };
      const result = newsIngestionService.extractSummary(item);
      expect(result).toBe('Snippet text');
    });

    test('should fall back to content if no snippet', () => {
      const item = { content: '<p>Content text</p>' };
      const result = newsIngestionService.extractSummary(item);
      expect(result).toBe('Content text');
    });

    test('should truncate long summaries', () => {
      const longText = 'A'.repeat(2000);
      const item = { contentSnippet: longText };
      const result = newsIngestionService.extractSummary(item);
      expect(result.length).toBeLessThanOrEqual(1500);
      expect(result).toContain('...');
    });

    test('should handle empty items gracefully', () => {
      expect(newsIngestionService.extractSummary({})).toBe('');
    });
  });

  describe('categorize', () => {
    test('should categorize education-related articles', () => {
      const result = newsIngestionService.categorize(
        'LAUTECH Students Win National Award',
        'Students from the university excelled.',
        'general',
      );
      expect(result).toBe('education');
    });

    test('should categorize politics-related articles', () => {
      const result = newsIngestionService.categorize(
        'Governor Announces New Policy',
        'The state government unveiled a new initiative.',
        'general',
      );
      expect(result).toBe('politics');
    });

    test('should categorize community/youth articles', () => {
      const result = newsIngestionService.categorize(
        'Ogbomoso Community Development Project',
        'A new community initiative starts.',
        'general',
      );
      expect(result).toBe('community');
    });

    test('should fall back to defaultCategory when no keywords match', () => {
      const result = newsIngestionService.categorize(
        'Lorem Ipsum Dolor Sit Amet',
        'Consectetur adipiscing elit sed do eiusmod.',
        'entertainment',
      );
      expect(result).toBe('entertainment');
    });
  });

  describe('detectLocation', () => {
    test('should detect Ogbomoso', () => {
      expect(newsIngestionService.detectLocation('News from Ogbomoso', '')).toBe('Ogbomoso');
    });

    test('should detect Oyo State', () => {
      expect(newsIngestionService.detectLocation('Oyo State government announces', '')).toBe('Oyo State');
    });

    test('should detect Nigeria', () => {
      expect(newsIngestionService.detectLocation('Nigeria budget 2026', '')).toBe('Nigeria');
    });

    test('should return empty string when no location found', () => {
      expect(newsIngestionService.detectLocation('Random article title', 'No location.')).toBe('');
    });
  });

  describe('parseDate', () => {
    test('should parse valid ISO dates', () => {
      const result = newsIngestionService.parseDate(new Date().toISOString());
      expect(result).toBeInstanceOf(Date);
    });

    test('should return null for null/empty input', () => {
      expect(newsIngestionService.parseDate(null)).toBeNull();
      expect(newsIngestionService.parseDate('')).toBeNull();
    });

    test('should return null for dates too far in the past', () => {
      const result = newsIngestionService.parseDate('2020-01-01T00:00:00Z');
      expect(result).toBeNull();
    });
  });

  describe('extractImage', () => {
    test('should extract from enclosure', () => {
      const item = {
        enclosure: { url: 'https://example.com/image.jpg', type: 'image/jpeg' },
      };
      expect(newsIngestionService.extractImage(item)).toBe('https://example.com/image.jpg');
    });

    test('should extract from content HTML img tag', () => {
      const item = {
        content: '<p>Text</p><img src="https://example.com/photo.png" />',
      };
      expect(newsIngestionService.extractImage(item)).toBe('https://example.com/photo.png');
    });

    test('should return empty string when no image found', () => {
      expect(newsIngestionService.extractImage({})).toBe('');
      expect(newsIngestionService.extractImage({ content: '<p>No image</p>' })).toBe('');
    });
  });

  describe('fetchAllSources', () => {
    test('should report when no sources are configured', async () => {
      newsSourceModel.find.mockResolvedValue([]);

      const result = await newsIngestionService.fetchAllSources();
      expect(result.totalSources).toBe(0);
      expect(result.message).toContain('No enabled news sources');
    });

    test('should handle source fetch failures independently', async () => {
      const source1 = createMockSource({ name: 'Source 1', feedUrl: 'https://source1.example.com/rss', allowedHost: 'source1.example.com' });
      const source2 = createMockSource({ name: 'Source 2', feedUrl: 'https://source2.example.com/rss', allowedHost: 'source2.example.com' });

      newsSourceModel.find.mockResolvedValue([source1, source2]);

      // Mock the parser to fail on source1 and succeed on source2
      const mockParseURL = jest.fn();
      mockParseURL
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          items: [createMockFeedItem()],
        });

      newsIngestionService.parser = { parseURL: mockParseURL };

      // Mock findOne for duplicate check
      newsModel.findOne.mockResolvedValue(null);
      newsModel.create.mockResolvedValue({ _id: 'new-id' });
      newsSourceModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await newsIngestionService.fetchAllSources();

      expect(result.failedSources).toBe(1);
      expect(result.successfulSources).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('Source 1');
    });

    test('should prevent concurrent runs', async () => {
      newsSourceModel.find.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve([]), 200));
      });

      const promise1 = newsIngestionService.fetchAllSources();
      const promise2 = newsIngestionService.fetchAllSources();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      const results = [result1, result2];
      const skipped = results.find((r) => r.skipped);
      expect(skipped).toBeDefined();
      expect(skipped.reason).toBe('Already running');
    });
  });

  describe('processItem', () => {
    test('should skip items without title', async () => {
      const item = createMockFeedItem({ title: '' });
      const source = createMockSource();
      const result = await newsIngestionService.processItem(item, source, false);
      expect(result).toBe('skipped');
    });

    test('should skip items without link', async () => {
      const item = createMockFeedItem({ link: '', guid: '' });
      const source = createMockSource();
      const result = await newsIngestionService.processItem(item, source, false);
      expect(result).toBe('skipped');
    });

    test('should detect duplicate articles', async () => {
      const item = createMockFeedItem();
      const source = createMockSource();

      newsModel.findOne.mockResolvedValue({ _id: 'existing-id' });

      const result = await newsIngestionService.processItem(item, source, false);
      expect(result).toBe('duplicate');
    });

    test('should create new article with pending status by default', async () => {
      const item = createMockFeedItem();
      const source = createMockSource({ trusted: false });

      newsModel.findOne.mockResolvedValue(null);
      newsModel.create.mockResolvedValue({ _id: 'new-id' });

      const result = await newsIngestionService.processItem(item, source, false);
      expect(result).toBe('new');

      const createCall = newsModel.create.mock.calls[0][0];
      expect(createCall.status).toBe('pending');
      expect(createCall.title).toBeTruthy();
      expect(createCall.sourceUrl).toBeTruthy();
    });

    test('should auto-publish from trusted sources when enabled', async () => {
      const item = createMockFeedItem();
      const source = createMockSource({ trusted: true });

      newsModel.findOne.mockResolvedValue(null);
      newsModel.create.mockResolvedValue({ _id: 'new-id' });

      const result = await newsIngestionService.processItem(item, source, true);
      expect(result).toBe('new');

      const createCall = newsModel.create.mock.calls[0][0];
      expect(createCall.status).toBe('published');
    });

    test('should NOT auto-publish from untrusted sources even when auto-publish is on', async () => {
      const item = createMockFeedItem();
      const source = createMockSource({ trusted: false });

      newsModel.findOne.mockResolvedValue(null);
      newsModel.create.mockResolvedValue({ _id: 'new-id' });

      const result = await newsIngestionService.processItem(item, source, true);
      expect(result).toBe('new');

      const createCall = newsModel.create.mock.calls[0][0];
      expect(createCall.status).toBe('pending');
    });

    test('should handle duplicate key errors gracefully', async () => {
      const item = createMockFeedItem();
      const source = createMockSource();

      newsModel.findOne.mockResolvedValue(null);
      const dupError = new Error('Duplicate key');
      dupError.code = 11000;
      newsModel.create.mockRejectedValue(dupError);

      const result = await newsIngestionService.processItem(item, source, false);
      expect(result).toBe('duplicate');
    });
  });
});
