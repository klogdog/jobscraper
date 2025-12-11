require('dotenv').config();

module.exports = {
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'resumebuilder',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT) || 5432,
  },
  
  crawler: {
    // Search parameters for career page crawler
    searchKeywords: ['software engineer', 'full stack developer', 'backend', 'frontend'],
    maxCompanies: 10, // Number of companies to crawl per run
    rateLimit: 5000, // 5 seconds delay between requests to be respectful
  },
  
  scheduler: {
    // Run daily at 9 AM
    crawlSchedule: '0 9 * * *',
    // Cleanup daily at 2 AM
    cleanupSchedule: '0 2 * * *',
  },
  
  nodeEnv: process.env.NODE_ENV || 'development',
};
