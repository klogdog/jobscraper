/**
 * Main entry point for Job Scraper service
 * Sets up scheduler and runs crawlers
 */

const cron = require('node-cron');
const config = require('./config');
const logger = require('./utils/logger');
const { testConnection } = require('./db/connection');
const { upsertJob, markInactive, getStats } = require('./db/queries');
const IndeedCrawler = require('./crawlers/indeed');

/**
 * Save job to database callback
 * @param {Object} jobData - Job data to save
 */
async function saveJobToDatabase(jobData) {
  try {
    const result = await upsertJob(jobData);
    if (result.success) {
      logger.debug(`Saved job: ${jobData.title} at ${jobData.company}`);
    } else {
      logger.error(`Failed to save job: ${jobData.title}`, result.error);
    }
  } catch (error) {
    logger.error('Error saving job to database:', error);
  }
}

/**
 * Run all crawlers with configured search parameters
 */
async function runCrawlers() {
  logger.info('========================================');
  logger.info('Starting crawler job...');
  logger.info('========================================');
  
  const startTime = Date.now();
  let totalJobsFound = 0;

  try {
    const crawler = new IndeedCrawler();

    // Run crawler for each search configuration
    for (const searchConfig of config.searchConfigs) {
      const searchParams = {
        ...searchConfig,
        maxPages: config.crawler.maxPages
      };

      logger.info(`Running search for: ${JSON.stringify(searchParams)}`);
      
      const jobsFound = await crawler.crawl(searchParams, saveJobToDatabase);
      totalJobsFound += jobsFound;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('========================================');
    logger.info(`Crawl completed successfully!`);
    logger.info(`Total jobs found: ${totalJobsFound}`);
    logger.info(`Duration: ${duration} seconds`);
    logger.info('========================================');

    // Log statistics
    const stats = await getStats();
    if (stats) {
      logger.info('Repository Statistics:');
      logger.info(`  Total jobs: ${stats.total_jobs}`);
      logger.info(`  Active jobs: ${stats.active_jobs}`);
      logger.info(`  Unique companies: ${stats.unique_companies}`);
    }

  } catch (error) {
    logger.error('Crawl failed with error:', error);
  }
}

/**
 * Cleanup old jobs that haven't been seen in 7 days
 */
async function cleanupOldJobs() {
  logger.info('========================================');
  logger.info('Starting cleanup job...');
  logger.info('========================================');

  try {
    const count = await markInactive();
    logger.info(`Cleanup completed. Marked ${count} jobs as inactive.`);
  } catch (error) {
    logger.error('Cleanup failed with error:', error);
  }

  logger.info('========================================');
}

/**
 * Initialize the application
 */
async function init() {
  logger.info('========================================');
  logger.info('Job Scraper Service Starting...');
  logger.info('========================================');
  logger.info(`Environment: ${config.app.nodeEnv}`);
  logger.info(`Log Level: ${config.app.logLevel}`);
  
  // Test database connection
  logger.info('Testing database connection...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Log configuration
  logger.info('Crawler Configuration:');
  logger.info(`  Crawl Schedule: ${config.crawler.schedules.crawl}`);
  logger.info(`  Cleanup Schedule: ${config.crawler.schedules.cleanup}`);
  logger.info(`  Rate Limit Delay: ${config.crawler.rateLimitDelay}ms`);
  logger.info(`  Max Pages per Search: ${config.crawler.maxPages}`);
  
  logger.info('Search Configurations:');
  config.searchConfigs.forEach((cfg, index) => {
    logger.info(`  ${index + 1}. Keywords: ${cfg.keywords.join(', ')}`);
    logger.info(`     Locations: ${cfg.locations.join(', ')}`);
  });

  // Schedule crawler job
  logger.info(`Scheduling crawler job: ${config.crawler.schedules.crawl}`);
  cron.schedule(config.crawler.schedules.crawl, runCrawlers);

  // Schedule cleanup job
  logger.info(`Scheduling cleanup job: ${config.crawler.schedules.cleanup}`);
  cron.schedule(config.crawler.schedules.cleanup, cleanupOldJobs);

  logger.info('========================================');
  logger.info('Scheduler started successfully!');
  logger.info('Press Ctrl+C to exit.');
  logger.info('========================================');

  // Run crawler immediately on startup (for testing)
  if (process.env.RUN_IMMEDIATELY !== 'false') {
    logger.info('Running initial crawl on startup...');
    setTimeout(runCrawlers, 2000);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nReceived SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start the application
init().catch(error => {
  logger.error('Failed to initialize application:', error);
  process.exit(1);
});
