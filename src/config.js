/**
 * Application configuration
 * Loads settings from environment variables with defaults
 */

require('dotenv').config();

const config = {
  // Database configuration
  database: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'resumebuilder',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
  },

  // Application settings
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Crawler settings
  crawler: {
    schedules: {
      crawl: process.env.CRAWL_SCHEDULE || '0 9 * * *', // Daily at 9 AM
      cleanup: process.env.CLEANUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    },
    rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 3000,
    maxPages: parseInt(process.env.MAX_PAGES) || 2,
  },

  // Search configurations
  searchConfigs: [
    {
      keywords: ['software engineer', 'full stack developer'],
      locations: ['Remote'],
    },
    {
      keywords: ['backend engineer', 'backend developer'],
      locations: ['Remote'],
    },
    {
      keywords: ['frontend engineer', 'frontend developer'],
      locations: ['Remote'],
    },
  ],
};

module.exports = config;
