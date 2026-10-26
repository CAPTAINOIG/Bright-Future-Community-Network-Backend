const newsModel = require('../models/news.model');
const newsSourceModel = require('../models/newsSource.model');
const activityModel = require('../models/activity.model');
const logger = require('../utils/logger');

class NewsService {
  //  * Get published news articles for public consumption.
  //  * Supports pagination, search, category filter, featured filter, and date sorting.
  async getPublishedNews(query = {}) {
    const { page = 1, limit = 10, search = '', category = '', featured, language, sort = 'latest' } = query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    // Public endpoint only ever exposes published articles
    const filter = { status: 'published' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { language: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      filter.category = category;
    }
    if (featured === 'true' || featured === true) {
      filter.featured = true;
    }
    if (language) {
      filter.language = language;
    }
    const sortOptions = sort === 'oldest' ? { publishedAt: 1 } : { publishedAt: -1 };
    const [news, total] = await Promise.all([
      newsModel
        .find(filter)
        .select('-normalizedSourceUrl -sourceId -__v')
        .skip(skip)
        .limit(limitNum)
        .sort(sortOptions)
        .lean(),
      newsModel.countDocuments(filter),
    ]);

    return {
      news,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
  /**
   * Get a single published article by its slug.
   */
  // This will be used in the frontend since its published news. NOTE
  async getPublishedNewsBySlug(slug) {
    if (!slug || typeof slug !== 'string') {
      const err = new Error('Invalid slug');
      err.status = 400;
      throw err;
    }
    const article = await newsModel.findOne({ slug, status: 'published' }).select('-normalizedSourceUrl -sourceId -__v').lean();
    if (!article) {
      const err = new Error('Article not found');
      err.status = 404;
      throw err;
    }
    // Increment view count (fire-and-forget)
    newsModel.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).catch(() => {});
    return article;
  }

  //  * Admin: List all articles with filtering by status, category, source, and search.
  async getAdminNews(query = {}) {
    const { page = 1, limit = 20, search = '', status = '', category = '', source = '', sort = 'latest', featured, language, author } = query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (source) {
      filter.sourceName = { $regex: source, $options: 'i' };
    }
    if (featured === 'true' || featured === true) {
      filter.featured = true;
    }
    if (language) {
      filter.language = language;
    }
    if (author) {
      filter.author = author;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { sourceName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { language: { $regex: search, $options: 'i' } },
      ];
    }
    const sortOptions = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const [news, total] = await Promise.all([
      newsModel.find(filter).skip(skip).limit(limitNum).sort(sortOptions).lean(),
      newsModel.countDocuments(filter),
    ]);
    return {
      news,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Admin: Get a single article by ID for review.
   */
  async getAdminNewsById(id) {
    const article = await newsModel.findById(id).lean();
    if (!article) {
      const err = new Error('Article not found');
      err.status = 404;
      throw err;
    }
    return article;
  }
  /**
   * Admin: Update an article's status, category, featured state, etc.
   */
  async updateAdminNews(id, updateData) {
    const allowedFields = ['status', 'category', 'featured', 'location', 'summary', 'comment'];
    const sanitized = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitized[field] = updateData[field];
      }
    }
    // Sync the legacy 'published' boolean with the status field
    if (sanitized.status === 'published') {
      sanitized.published = true;
    } else if (sanitized.status === 'rejected' || sanitized.status === 'archived') {
      sanitized.published = false;
    }
    const article = await newsModel.findByIdAndUpdate(
      id,
      { $set: sanitized },
      { new: true, runValidators: true },
    ).lean();

    if (!article) {
      const err = new Error('Article not found');
      err.status = 404;
      throw err;
    }
    // Log the activity
    if (sanitized.status) {
      await activityModel.create({
        type: 'news_published',
        content: `News article ${sanitized.status}: ${article.title}`,
        performedBy: 'Admin',
        relatedId: article._id,
      }).catch((err) => logger.warn('Failed to create activity log:', err.message));
    }

    return article;
  }

  /**
   * Admin: Get news statistics.
   */
  async getNewsStats() {
    const [pending, published, rejected, archived, total, featured] = await Promise.all([
      newsModel.countDocuments({ status: 'pending' }),
      newsModel.countDocuments({ status: 'published' }),
      newsModel.countDocuments({ status: 'rejected' }),
      newsModel.countDocuments({ status: 'archived' }),
      newsModel.countDocuments(),
      newsModel.countDocuments({ featured: true }),
    ]);

    // Source statistics
    const [totalSources, enabledSources] = await Promise.all([
      newsSourceModel.countDocuments(),
      newsSourceModel.countDocuments({ enabled: true }),
    ]);

    return {
      articles: { pending, published, rejected, archived, total, featured },
      sources: { total: totalSources, enabled: enabledSources },
    };
  }

  /**
   * List all configured news sources.
   */
  async getSources() {
    const sources = await newsSourceModel.find().sort({ createdAt: -1 }).lean();
    return sources;
  }

  /**
   * Get a single source by ID.
   */
  async getSourceById(id) {
    const source = await newsSourceModel.findById(id).lean();
    if (!source) {
      const err = new Error('News source not found');
      err.status = 404;
      throw err;
    }
    return source;
  }

  /**
   * Create a new news source.
   */
  async createSource(data) {
    const { name, feedUrl, sourceType, defaultCategory, enabled, trusted, locationFilter, topicFilters, allowedHost } = data;

    if (!name || !feedUrl) {
      const err = new Error('Name and feedUrl are required');
      err.status = 400;
      throw err;
    }

    // Auto-extract allowedHost from feedUrl if not provided
    let host = allowedHost;
    if (!host) {
      try {
        host = new URL(feedUrl).hostname;
      } catch {
        const err = new Error('Invalid feedUrl');
        err.status = 400;
        throw err;
      }
    }

    const source = await newsSourceModel.create({
      name,
      feedUrl,
      sourceType: sourceType || 'rss',
      defaultCategory: defaultCategory || 'general',
      enabled: enabled !== false,
      trusted: trusted === true,
      locationFilter: locationFilter || '',
      topicFilters: topicFilters || [],
      allowedHost: host,
    });

    return source.toJSON();
  }

  /**
   * Update a news source.
   */
  async updateSource(id, updateData) {
    const allowedFields = [
      'name', 'feedUrl', 'sourceType', 'defaultCategory',
      'enabled', 'trusted', 'locationFilter', 'topicFilters', 'allowedHost',
    ];

    const sanitized = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitized[field] = updateData[field];
      }
    }

    // Re-extract allowedHost if feedUrl changed
    if (sanitized.feedUrl && !sanitized.allowedHost) {
      try {
        sanitized.allowedHost = new URL(sanitized.feedUrl).hostname;
      } catch {
        const err = new Error('Invalid feedUrl');
        err.status = 400;
        throw err;
      }
    }

    const source = await newsSourceModel.findByIdAndUpdate(
      id,
      { $set: sanitized },
      { new: true, runValidators: true },
    ).lean();

    if (!source) {
      const err = new Error('News source not found');
      err.status = 404;
      throw err;
    }

    return source;
  }

  /**
   * Delete a news source.
   */
  async deleteSource(id) {
    const source = await newsSourceModel.findByIdAndDelete(id);
    if (!source) {
      const err = new Error('News source not found');
      err.status = 404;
      throw err;
    }
    return { message: 'News source deleted successfully', id: source._id };
  }

  async createNews(newsData) {
    const { title, content, author, imageUrl, published, comment, summary, status, category } = newsData;
    const news = await newsModel.create({ title, content, author, imageUrl, published, status: published !== false ? 'published' : 'pending',
    comment, summary, status, category });
    await activityModel.create({
      type: 'news_published',
      content: `New post published: ${title}`,
      performedBy: author,
      relatedId: news._id,
    });
    return news.toJSON();
  }

  async getAllNews(query = {}) {
    const { page = 1, limit = 10, search = '', status = '', category, language, author } = query;
    const skip = (page - 1) * limit;

    const filter = {};
      if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (author) {
      filter.author = author;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { language: { $regex: search, $options: 'i' } },  
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const [news, total] = await Promise.all([
      newsModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      newsModel.countDocuments(filter),
    ]);

    return {
      news: news.map((n) => n.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNewsById(id) {
    const news = await newsModel.findById(id);
    if (!news) {
      const err = new Error('News not found');
      err.status = 404;
      throw err;
    }
    return news.toJSON();
  }

  async updateNews(id, updateData) {
    const news = await newsModel.findById(id);
    if (!news) {
      const err = new Error('News not found');
      err.status = 404;
      throw err;
    }

    Object.assign(news, updateData);
    await news.save();
    return news.toJSON();
  }

  async deleteNews(id) {
    const news = await newsModel.findByIdAndDelete(id);
    if (!news) {
      const err = new Error('News not found');
      err.status = 404;
      throw err;
    }
    return { message: 'News deleted successfully', id: news._id };
  }
}

module.exports = new NewsService();
