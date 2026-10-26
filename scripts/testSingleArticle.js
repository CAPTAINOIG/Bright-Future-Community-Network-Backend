/**
 * Test creating a single article manually.
 */

require('dotenv').config();

const connectDB = require('../connection/mongoose.connection');
const newsModel = require('../models/news.model');
const newsSourceModel = require('../models/newsSource.model');
const logger = require('../utils/logger');
const { normalizeUrl } = require('../utils/urlUtils');

const test = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✓ Connected\n');

    // Get a source
    const source = await newsSourceModel.findOne({ name: 'Premium Times Nigeria' });
    if (!source) {
      console.error('❌ Source not found');
      process.exit(1);
    }
    console.log(`✓ Source: ${source.name}\n`);

    // Create a test article
    const testArticle = {
      title: 'TEST: Sample News Article ' + Date.now(),
      summary: 'This is a test article to verify the ingestion system works correctly.',
      content: 'This is a test article to verify the ingestion system works correctly. Lorem ipsum dolor sit amet.',
      sourceName: source.name,
      sourceUrl: 'https://example.com/test-article',
      normalizedSourceUrl: 'https://example.com/test-article',
      sourceId: source._id,
      imageUrl: '',
      category: 'general',
      location: 'Nigeria',
      publishedAt: new Date(),
      collectedAt: new Date(),
      status: 'pending',
      featured: false,
      language: 'en',
      published: false,
    };

    console.log('📝 Creating test article...');
    console.log(`   Title: ${testArticle.title}`);
    console.log(`   Normalized URL: ${testArticle.normalizedSourceUrl}`);

    try {
      const created = await newsModel.create(testArticle);
      console.log(`\n✓ Article created!`);
      console.log(`   ID: ${created._id}`);
      console.log(`   Slug: ${created.slug}`);
      console.log(`   Status: ${created.status}`);

      // Try to fetch it
      const fetched = await newsModel.findById(created._id);
      console.log(`\n✓ Article fetched from DB`);
      console.log(`   Title: ${fetched.title}`);
      console.log(`   Status: ${fetched.status}`);

      // Count articles
      const count = await newsModel.countDocuments();
      console.log(`\n✓ Total articles in DB: ${count}`);

      // Show the article
      console.log(`\n✓ Article object:`);
      console.log(JSON.stringify(fetched.toJSON(), null, 2));
    } catch (err) {
      console.error(`\n❌ Failed to create article: ${err.message}`);
      if (err.code === 11000) {
        console.error('   (Duplicate key error - normalizedSourceUrl may already exist)');
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

setTimeout(() => {
  console.error('\n⚠️ Test timeout - forcing exit');
  process.exit(1);
}, 30000);

test();
