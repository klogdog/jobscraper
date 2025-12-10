/**
 * Test script for utilities
 * Tests keyword extraction and seniority detection
 */

const { extractKeywords, detectSeniority } = require('./src/utils/keywords');
const logger = require('./src/utils/logger');

logger.info('Testing Keyword Extraction and Seniority Detection');
logger.info('=================================================');

// Test cases
const testCases = [
  'Senior React Developer',
  'Full Stack Engineer - Node.js & React',
  'Junior Python Developer',
  'Staff Software Engineer (Go, Kubernetes)',
  'Backend Developer - Django & PostgreSQL',
  'Lead Frontend Engineer - Vue.js',
  'Entry Level Java Developer',
  'Principal Software Architect',
  'Engineering Manager - Cloud Infrastructure',
  'Software Engineer - AWS & TypeScript'
];

testCases.forEach(title => {
  const keywords = extractKeywords(title);
  const seniority = detectSeniority(title);
  
  logger.info('');
  logger.info(`Title: "${title}"`);
  logger.info(`  Keywords: [${keywords.join(', ')}]`);
  logger.info(`  Seniority: ${seniority}`);
});

logger.info('');
logger.info('=================================================');
logger.info('Test completed successfully!');
