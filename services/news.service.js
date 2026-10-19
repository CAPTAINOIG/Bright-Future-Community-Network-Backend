const newsModel = require("../models/news.model");
const activityModel = require("../models/activity.model");

class NewsService {
  async createNews(newsData) {
    const { title, content, author, image, published } = newsData;

    const news = await newsModel.create({
      title,
      content,
      author,
      image,
      published,
    });

    await activityModel.create({
      type: 'news_published',
      content: `New post published: ${title}`,
      performedBy: author,
      relatedId: news._id,
    });

    return news.toJSON();
  }

  async getAllNews(query = {}) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
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
