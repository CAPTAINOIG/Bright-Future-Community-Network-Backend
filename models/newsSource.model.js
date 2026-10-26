const mongoose = require('mongoose');

const newsSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  feedUrl: {
    type: String,
    required: true,
    trim: true,
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['rss', 'atom', 'api'],
    default: 'rss',
  },
  defaultCategory: {
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
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  trusted: {
    type: Boolean,
    default: false,
  },
  locationFilter: {
    type: String,
    trim: true,
    default: '',
  },
  topicFilters: [{
    type: String,
    trim: true,
  }],
  lastFetchedAt: {
    type: Date,
    default: null,
  },
  lastFetchError: {
    type: String,
    default: null,
  },
  fetchCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  articlesCollected: {
    type: Number,
    default: 0,
    min: 0,
  },
  consecutiveFailures: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Allowed host for SSRF protection — must match feedUrl domain
  allowedHost: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

newsSourceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Index for quick lookup of enabled sources
newsSourceSchema.index({ enabled: 1 });

module.exports = mongoose.model('NewsSource', newsSourceSchema);
