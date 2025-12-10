const cron = require('node-cron');
const config = require('./config');
const logger = require('./utils/logger');
const pool = require('./db/connection');
const { upsertJob, markInactive } = require('./db/queries');
const IndeedCrawler = require('./crawlers/indeed');

/**
 * Run the crawler
 */
async function runCrawler() {
  logger.info('=== Starting crawler job ===');
  
  const crawler = new IndeedCrawler({ rateLimit: config.crawler.rateLimit });
  
  const searchParams = {
    keywords: config.crawler.searchKeywords,
    locations: config.crawler.searchLocations,
    maxPages: config.crawler.maxPages,
  };
  
  try {
    const jobsFound = await crawler.crawl(searchParams, saveJobToDatabase);
    logger.info(`=== Crawl completed. Jobs found: ${jobsFound} ===`);
  } catch (error) {
    logger.error('Crawl failed:', error);
  }
}

/**
 * Save job to database
 */
async function saveJobToDatabase(jobData) {
  try {
    await upsertJob(jobData);
    logger.debug(`Saved job: ${jobData.title} at ${jobData.company}`);
  } catch (error) {
    logger.error('Error saving job to database:', error.message);
    throw error;
  }
}

/**
 * Cleanup old jobs
 */
async function cleanupOldJobs() {
  logger.info('=== Starting cleanup job ===');
  
  try {
    const count = await markInactive();
    logger.info(`=== Cleanup completed. Marked ${count} jobs as inactive ===`);
  } catch (error) {
    logger.error('Cleanup failed:', error);
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Main entry point
 */
async function main() {
  logger.info('=== Job Scraper Starting ===');
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Search keywords: ${config.crawler.searchKeywords.join(', ')}`);
  logger.info(`Search locations: ${config.crawler.searchLocations.join(', ')}`);
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    logger.error('Cannot start without database connection');
    process.exit(1);
  }
  
  // Schedule crawler to run daily at 9 AM
  logger.info(`Scheduling crawler: ${config.scheduler.crawlSchedule}`);
  cron.schedule(config.scheduler.crawlSchedule, runCrawler);
  
  // Schedule cleanup to run daily at 2 AM
  logger.info(`Scheduling cleanup: ${config.scheduler.cleanupSchedule}`);
  cron.schedule(config.scheduler.cleanupSchedule, cleanupOldJobs);
  
  // Run once on startup for testing
  logger.info('Running initial crawl...');
  await runCrawler();
  
  logger.info('=== Scheduler started. Press Ctrl+C to exit ===');
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connection...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connection...');
  await pool.end();
  process.exit(0);
});

// Start the application
main().catch((error) => {
  logger.error('Application error:', error);
  process.exit(1);
});
