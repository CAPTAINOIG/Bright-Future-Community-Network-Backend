const cron = require('node-cron');
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const newsIngestionService = require('./newsIngestion.service');

/**
 * Scheduled news collection job.
 * Runs on a configurable interval and fetches from all enabled sources.
 * Only starts after the database connection is ready.
 */
class NewsSchedulerService {
  constructor() {
    this._task = null;
    this._isInitialized = false;
    this._lastRunSummary = null;
  }

  /**
   * Initialize the scheduler. Call once after DB is connected.
   */
  init() {
    if (this._isInitialized) {
      logger.warn('News scheduler: Already initialized.');
      return;
    }

    // Only start if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      logger.warn('News scheduler: Database not connected. Scheduler will not start.');
      logger.warn('News scheduler: The scheduler will attempt to start once the database is ready.');

      // Listen for future connection
      mongoose.connection.once('connected', () => {
        logger.info('News scheduler: Database connected, starting scheduler now.');
        this._startCron();
      });
      return;
    }

    this._startCron();
  }

  /**
   * Start the cron job based on the configured interval.
   */
  _startCron() {
    const intervalMinutes = config.news?.fetchIntervalMinutes || 30;

    // Validate interval
    const interval = Math.max(5, Math.min(1440, parseInt(intervalMinutes) || 30));

    // Build cron expression: run every N minutes
    const cronExpression = `*/${interval} * * * *`;

    if (!cron.validate(cronExpression)) {
      logger.error(`News scheduler: Invalid cron expression: ${cronExpression}`);
      return;
    }

    this._task = cron.schedule(cronExpression, async () => {
      await this._runFetchJob();
    }, {
      scheduled: true,
      timezone: config.news?.timezone || 'Africa/Lagos',
    });

    this._isInitialized = true;

    logger.info(`News scheduler: Started (every ${interval} minutes, timezone: ${config.news?.timezone || 'Africa/Lagos'}).`);
    console.log(`📰 News scheduler started: fetching every ${interval} minutes.`);

    // Run an initial fetch 30 seconds after startup to populate on first deploy
    setTimeout(async () => {
      logger.info('News scheduler: Running initial fetch after startup...');
      await this._runFetchJob();
    }, 30000);
  }

  /**
   * Execute a fetch job (used by both cron and manual trigger).
   */
  async _runFetchJob() {
    try {
      logger.info('News scheduler: Fetch job started.');
      const summary = await newsIngestionService.fetchAllSources();
      this._lastRunSummary = summary;
    } catch (err) {
      logger.error('News scheduler: Fetch job failed:', err.message);
      this._lastRunSummary = {
        error: err.message,
        completedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Trigger a manual fetch (called from admin endpoint).
   * @returns {Object} Fetch summary
   */
  async triggerManualFetch() {
    logger.info('News scheduler: Manual fetch triggered by admin.');
    const summary = await newsIngestionService.fetchAllSources();
    this._lastRunSummary = summary;
    return summary;
  }

  /**
   * Stop the scheduler (for graceful shutdown).
   */
  stop() {
    if (this._task) {
      this._task.stop();
      this._task = null;
      this._isInitialized = false;
      logger.info('News scheduler: Stopped.');
    }
  }

  /**
   * Get the last run summary.
   */
  get lastRunSummary() {
    return this._lastRunSummary;
  }

  /**
   * Check if the scheduler is currently initialized.
   */
  get isInitialized() {
    return this._isInitialized;
  }
}

module.exports = new NewsSchedulerService();
