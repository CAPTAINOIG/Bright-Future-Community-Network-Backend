/**
 * Tests for the news service (public + admin API methods).
 */

jest.mock('../../models/news.model');
jest.mock('../../models/newsSource.model');
jest.mock('../../models/activity.model');

const newsModel = require('../../models/news.model');
const newsSourceModel = require('../../models/newsSource.model');
const activityModel = require('../../models/activity.model');
const newsService = require('../../services/news.service');

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper to create a chainable query mock
const createQueryMock = (resolveValue) => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolveValue),
  };
  return chain;
};

describe('NewsService', () => {
  describe('getPublishedNews', () => {
    test('should return paginated published articles', async () => {
      const mockArticles = [
        { _id: '1', title: 'Article 1', status: 'published' },
        { _id: '2', title: 'Article 2', status: 'published' },
      ];

      const query = createQueryMock(mockArticles);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(2);

      const result = await newsService.getPublishedNews({ page: 1, limit: 10 });

      expect(result.news).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    test('should filter by category', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getPublishedNews({ category: 'education' });

      const filterArg = newsModel.find.mock.calls[0][0];
      expect(filterArg.status).toBe('published');
      expect(filterArg.category).toBe('education');
    });

    test('should filter featured articles', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getPublishedNews({ featured: 'true' });

      const filterArg = newsModel.find.mock.calls[0][0];
      expect(filterArg.featured).toBe(true);
    });

    test('should enforce maximum page limit of 50', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getPublishedNews({ limit: 500 });

      expect(query.limit).toHaveBeenCalledWith(50);
    });

    test('should apply search filter', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getPublishedNews({ search: 'ogbomoso' });

      const filterArg = newsModel.find.mock.calls[0][0];
      expect(filterArg.$or).toBeDefined();
      expect(filterArg.$or).toHaveLength(3);
    });
  });

  describe('getPublishedNewsBySlug', () => {
    test('should return article by slug', async () => {
      const mockArticle = { _id: '1', title: 'Test', slug: 'test-article', status: 'published' };

      const query = createQueryMock(mockArticle);
      newsModel.findOne.mockReturnValue(query);
      newsModel.findByIdAndUpdate.mockReturnValue({ catch: jest.fn() });

      const result = await newsService.getPublishedNewsBySlug('test-article');
      expect(result.slug).toBe('test-article');
    });

    test('should throw 404 for non-existent slug', async () => {
      const query = createQueryMock(null);
      newsModel.findOne.mockReturnValue(query);

      await expect(newsService.getPublishedNewsBySlug('nonexistent'))
        .rejects.toThrow('Article not found');
    });

    test('should throw 400 for invalid slug', async () => {
      await expect(newsService.getPublishedNewsBySlug(null))
        .rejects.toThrow('Invalid slug');
    });
  });

  describe('getAdminNews', () => {
    test('should filter by status', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getAdminNews({ status: 'pending' });

      const filterArg = newsModel.find.mock.calls[0][0];
      expect(filterArg.status).toBe('pending');
    });

    test('should filter by source name', async () => {
      const query = createQueryMock([]);
      newsModel.find.mockReturnValue(query);
      newsModel.countDocuments.mockResolvedValue(0);

      await newsService.getAdminNews({ source: 'Premium Times' });

      const filterArg = newsModel.find.mock.calls[0][0];
      expect(filterArg.sourceName).toBeDefined();
    });
  });

  describe('updateAdminNews', () => {
    test('should only allow whitelisted fields', async () => {
      const mockArticle = { _id: '1', title: 'Test', status: 'published' };
      newsModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockArticle),
      });
      activityModel.create.mockResolvedValue({});

      await newsService.updateAdminNews('1', {
        status: 'published',
        title: 'Hacked Title',
        sourceUrl: 'http://evil.com',
      });

      const updateArg = newsModel.findByIdAndUpdate.mock.calls[0][1].$set;
      expect(updateArg.status).toBe('published');
      expect(updateArg.title).toBeUndefined();
      expect(updateArg.sourceUrl).toBeUndefined();
    });

    test('should sync published boolean with status', async () => {
      const mockArticle = { _id: '1', title: 'Test', status: 'published' };
      newsModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockArticle),
      });
      activityModel.create.mockResolvedValue({});

      await newsService.updateAdminNews('1', { status: 'published' });

      const updateArg = newsModel.findByIdAndUpdate.mock.calls[0][1].$set;
      expect(updateArg.published).toBe(true);
    });

    test('should throw 404 for non-existent article', async () => {
      newsModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(newsService.updateAdminNews('nonexistent', { status: 'published' }))
        .rejects.toThrow('Article not found');
    });
  });

  describe('getNewsStats', () => {
    test('should return article and source counts', async () => {
      newsModel.countDocuments
        .mockResolvedValueOnce(5)   // pending
        .mockResolvedValueOnce(20)  // published
        .mockResolvedValueOnce(3)   // rejected
        .mockResolvedValueOnce(2)   // archived
        .mockResolvedValueOnce(30)  // total
        .mockResolvedValueOnce(1);  // featured

      newsSourceModel.countDocuments
        .mockResolvedValueOnce(4)   // total sources
        .mockResolvedValueOnce(3);  // enabled sources

      const result = await newsService.getNewsStats();

      expect(result.articles.pending).toBe(5);
      expect(result.articles.published).toBe(20);
      expect(result.articles.total).toBe(30);
      expect(result.sources.total).toBe(4);
      expect(result.sources.enabled).toBe(3);
    });
  });

  describe('Source Management', () => {
    test('should create source with auto-extracted hostname', async () => {
      newsSourceModel.create.mockResolvedValue({
        _id: 'src-1',
        name: 'Test',
        feedUrl: 'https://rss.example.com/feed.xml',
        allowedHost: 'rss.example.com',
        toJSON: function () { return this; },
      });

      const result = await newsService.createSource({
        name: 'Test',
        feedUrl: 'https://rss.example.com/feed.xml',
      });

      const createArg = newsSourceModel.create.mock.calls[0][0];
      expect(createArg.allowedHost).toBe('rss.example.com');
    });

    test('should require name and feedUrl', async () => {
      await expect(newsService.createSource({ name: '' }))
        .rejects.toThrow('Name and feedUrl are required');
    });

    test('should delete source by ID', async () => {
      newsSourceModel.findByIdAndDelete.mockResolvedValue({ _id: 'src-1' });

      const result = await newsService.deleteSource('src-1');
      expect(result.message).toContain('deleted');
    });

    test('should throw 404 when deleting non-existent source', async () => {
      newsSourceModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(newsService.deleteSource('nonexistent'))
        .rejects.toThrow('News source not found');
    });
  });
});
