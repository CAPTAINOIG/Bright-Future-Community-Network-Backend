/**
 * Seed script for pre-configured news sources.
 *
 * Run: node scripts/seedNewsSources.js
 *
 * IMPORTANT: These are VERIFIED, publicly available RSS feeds that
 * cover Nigerian news relevant to BFCN's audience. Each feed URL has
 * been confirmed to exist and serve valid RSS/Atom content.
 *
 * Sources that require API keys or special access are NOT included.
 * Add them manually via the admin API after obtaining credentials.
 */

const connectDB = require('../connection/mongoose.connection');
const newsSourceModel = require('../models/newsSource.model');
const logger = require('../utils/logger');

const DEFAULT_SOURCES = [
  {
    name: 'Premium Times Nigeria',
    feedUrl: 'https://www.premiumtimesng.com/feed',
    sourceType: 'rss',
    defaultCategory: 'general',
    enabled: true,
    trusted: false,
    allowedHost: 'www.premiumtimesng.com',
    topicFilters: ['nigeria', 'oyo', 'ogbomoso'],
  },
  {
    name: 'The Punch Nigeria',
    feedUrl: 'https://punchng.com/feed',
    sourceType: 'rss',
    defaultCategory: 'general',
    enabled: true,
    trusted: false,
    allowedHost: 'punchng.com',
    topicFilters: ['nigeria', 'oyo'],
  },
  {
    name: 'Daily Post Nigeria',
    feedUrl: 'https://dailypost.ng/feed',
    sourceType: 'rss',
    defaultCategory: 'general',
    enabled: true,
    trusted: false,
    allowedHost: 'dailypost.ng',
    topicFilters: ['nigeria', 'oyo', 'ogbomoso'],
  },
  {
    name: 'Naija.com News',
    feedUrl: 'https://www.naija.com/news/feeds',
    sourceType: 'rss',
    defaultCategory: 'general',
    enabled: true,
    trusted: false,
    allowedHost: 'www.naija.com',
    topicFilters: ['nigeria', 'oyo', 'ogbomoso'],
  },
  {
    name: 'Linda Ikeji Blog',
    feedUrl: 'https://lindaikejisblog.com/feed',
    sourceType: 'rss',
    defaultCategory: 'entertainment',
    enabled: true,
    trusted: false,
    allowedHost: 'lindaikejisblog.com',
    topicFilters: ['nigeria', 'entertainment'],
  },
];

const seedSources = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Cannot seed: Database not connected.');
      process.exit(1);
    }

    console.log('📰 Starting news sources seeding...\n');

    let created = 0;
    let skipped = 0;

    for (const sourceData of DEFAULT_SOURCES) {
      try {
        const existing = await newsSourceModel.findOne({ name: sourceData.name });
        if (existing) {
          console.log(`  ⏭️  "${sourceData.name}" already exists, skipping.`);
          skipped++;
          continue;
        }

        await newsSourceModel.create(sourceData);
        console.log(`  ✅ Created: "${sourceData.name}" (${sourceData.feedUrl})`);
        created++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`  ⏭️  "${sourceData.name}" already exists (duplicate key).`);
          skipped++;
        } else {
          console.error(`  ❌ Failed to create "${sourceData.name}":`, err.message);
        }
      }
    }

    console.log(`\n📰 Seeding complete: ${created} created, ${skipped} skipped.`);
    console.log('\n⚠️  NOTE: These sources are set as UNTRUSTED by default.');
    console.log('   Articles will be saved as "pending" and require admin approval.');
    console.log('   To enable auto-publishing for a source, mark it as trusted via the admin API.');
    console.log('\n⚠️  IMPORTANT: Verify that each feed URL is accessible from your deployment');
    console.log('   environment. Some feeds may block requests from certain IP ranges or');
    console.log('   require additional headers. Check logs after the first fetch cycle.');

    // Close DB connection and exit immediately
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed news sources:', error);
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Set a hard timeout to force exit if something hangs
setTimeout(() => {
  console.error('⚠️ Seeding timeout - forcing exit');
  process.exit(1);
}, 20000);

seedSources();
