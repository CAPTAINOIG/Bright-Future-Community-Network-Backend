const mongoose = require('mongoose');
const slugify = require('slugify');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    index: true,
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  sourceName: {
    type: String,
    trim: true,
    default: '',
  },
  sourceUrl: {
    type: String,
    trim: true,
    default: '',
  },
  normalizedSourceUrl: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsSource',
    default: null,
  },
  imageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  // Legacy field kept for backwards compatibility with existing articles
  image: {
    type: String,
    trim: true,
  },
  // Legacy field kept for backwards compatibility
  author: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    trim: true,
    default: 'general',
    enum: [
      'general',
      'politics',
      'education',
      'community',
      'youth',
      'health',
      'sports',
      'technology',
      'business',
      'entertainment',
      'security',
      'environment',
      'agriculture',
      'infrastructure',
      'religion',
      'opinion',
    ],
    index: true,
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true,
  },
  collectedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'archived'],
    default: 'pending',
    index: true,
  },
  featured: {
    type: Boolean,
    default: false,
    index: true,
  },
  language: {
    type: String,
    trim: true,
    default: 'en',
  },
  // Legacy fields preserved for backwards compatibility
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  comment: {
    type: String,
    trim: true,
  },
  published: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for duplicate detection using normalized URL
newsSchema.index({ normalizedSourceUrl: 1 }, {
  unique: true,
  sparse: true,
  partialFilterExpression: { normalizedSourceUrl: { $ne: '' } },
});

// Compound index for public listing queries
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ status: 1, featured: 1, publishedAt: -1 });
newsSchema.index({ status: 1, category: 1, publishedAt: -1 });

// Text index for search
newsSchema.index({ title: 'text', summary: 'text', content: 'text' });

/**
 * Generate a unique slug before saving
 */
newsSchema.pre('save', async function (next) {
  if (this.isModified('title') || this.isNew) {
    if (!this.slug) {
      let baseSlug = slugify(this.title, {
        lower: true,
        strict: true,
        trim: true,
      });

      // Ensure slug is not empty
      if (!baseSlug) {
        baseSlug = 'article';
      }

      // Truncate long slugs
      if (baseSlug.length > 120) {
        baseSlug = baseSlug.substring(0, 120);
      }

      // Append a short timestamp suffix for uniqueness
      const suffix = Date.now().toString(36);
      this.slug = `${baseSlug}-${suffix}`;
    }
  }
  next();
});

newsSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('News', newsSchema);
