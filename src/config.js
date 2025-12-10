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
    // Hardcoded search parameters for MVP
    searchKeywords: ['software engineer', 'full stack developer'],
    searchLocations: ['Remote'],
    maxPages: 2,
    rateLimit: 3000, // 3 seconds delay between requests
  },
  
  scheduler: {
    // Run daily at 9 AM
    crawlSchedule: '0 9 * * *',
    // Cleanup daily at 2 AM
    cleanupSchedule: '0 2 * * *',
  },
  
  nodeEnv: process.env.NODE_ENV || 'development',
};
