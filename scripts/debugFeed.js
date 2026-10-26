/**
 * Debug script to inspect feed item structure.
 */

require('dotenv').config();
const RssParser = require('rss-parser');

const parser = new RssParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'BFCN-NewsAggregator/1.0 (+https://bfcn.org)',
  },
  maxRedirects: 3,
});

const debugFeed = async () => {
  try {
    const feeds = [
      'https://www.premiumtimesng.com/feed',
      'https://punchng.com/feed',
      'https://dailypost.ng/feed',
    ];

    for (const feedUrl of feeds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Feed: ${feedUrl}`);
      console.log('='.repeat(60));

      try {
        const feed = await parser.parseURL(feedUrl);
        console.log(`✓ Feed title: ${feed.title}`);
        console.log(`✓ Items: ${feed.items.length}`);

        if (feed.items.length > 0) {
          console.log(`\n📋 First item structure:`);
          const item = feed.items[0];
          
          console.log(`  title type: ${typeof item.title}`);
          console.log(`  title value: ${String(item.title).substring(0, 100)}`);
          console.log(`  link: ${item.link}`);
          console.log(`  guid: ${item.guid}`);
          console.log(`  pubDate: ${item.pubDate}`);
          console.log(`  isoDate: ${item.isoDate}`);
          console.log(`  content length: ${(item.content || '').length}`);
          console.log(`  contentSnippet length: ${(item.contentSnippet || '').length}`);
        }
      } catch (err) {
        console.error(`✗ Error: ${err.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
};

setTimeout(() => {
  console.error('\n⚠️ Timeout - forcing exit');
  process.exit(1);
}, 60000);

debugFeed();
