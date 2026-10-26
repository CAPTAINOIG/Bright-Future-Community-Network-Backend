/**
 * Test script to trigger news ingestion manually.
 * This connects to MongoDB and calls the ingestion service directly.
 *
 * Run: node scripts/testNewsIngestion.js
 */

require('dotenv').config();

const connectDB = require('../connection/mongoose.connection');
const newsIngestionService = require('../services/newsIngestion.service');
const newsSourceModel = require('../models/newsSource.model');
const newsModel = require('../models/news.model');
const logger = require('../utils/logger');

const testIngestion = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✓ MongoDB connected\n');

    // Check enabled sources
    console.log('📋 Checking configured sources...');
    const sources = await newsSourceModel.find({ enabled: true });
    console.log(`✓ Found ${sources.length} enabled source(s):\n`);
    sources.forEach((s) => {
      console.log(`   • ${s.name} (${s.feedUrl})`);
    });
    console.log('');

    // Check existing articles
    const existingCount = await newsModel.countDocuments();
    console.log(`📊 Existing articles in database: ${existingCount}\n`);

    // Run ingestion
    console.log('⏳ Starting news ingestion fetch...');
    const startTime = Date.now();
    const summary = await newsIngestionService.fetchAllSources();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Display results
    console.log('\n✅ INGESTION COMPLETE\n');
    console.log(`  Total Sources: ${summary.totalSources}`);
    console.log(`  Successful: ${summary.successfulSources}`);
    console.log(`  Failed: ${summary.failedSources}`);
    console.log(`  New Articles: ${summary.newArticles}`);
    console.log(`  Duplicates Skipped: ${summary.duplicateArticles}`);
    console.log(`  Time Elapsed: ${elapsed}s`);

    if (summary.errors && summary.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      summary.errors.forEach((err) => {
        console.log(`   • ${err.source}: ${err.error}`);
      });
    }

    // Check articles after fetch
    const newCount = await newsModel.countDocuments();
    console.log(`\n📊 Articles after ingestion: ${newCount} (added ${newCount - existingCount})`);

    // Show some samples
    const samples = await newsModel.find().sort({ collectedAt: -1 }).limit(3).lean();
    if (samples.length > 0) {
      console.log(`\n📰 Sample articles collected:`);
      samples.forEach((article, i) => {
        console.log(`\n   ${i + 1}. ${article.title}`);
        console.log(`      Source: ${article.sourceName}`);
        console.log(`      Status: ${article.status}`);
        console.log(`      Category: ${article.category}`);
      });
    }

    console.log('\n✓ Test complete');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Force exit after 120 seconds
setTimeout(() => {
  console.error('\n⚠️ Test timeout - forcing exit');
  process.exit(1);
}, 120000);

testIngestion();
