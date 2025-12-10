/**
 * Keyword extraction and seniority detection utilities
 */

// Common tech keywords dictionary (case-insensitive)
const TECH_KEYWORDS = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'go', 'golang', 'rust',
  'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'scala',
  
  // Frontend Technologies
  'react', 'vue', 'angular', 'nextjs', 'next.js', 'svelte', 'html', 'css',
  
  // Backend Technologies
  'node', 'nodejs', 'node.js', 'express', 'django', 'flask', 'spring',
  'fastapi', 'rails',
  
  // Databases
  'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'jenkins',
  'terraform', 'ansible',
  
  // Mobile
  'ios', 'android', 'react native', 'flutter',
  
  // Other
  'api', 'rest', 'graphql', 'microservices', 'agile', 'git', 'linux'
];

/**
 * Extract tech keywords from job title or description
 * @param {string} text - Text to extract keywords from
 * @returns {Array<string>} - Array of unique keywords found
 */
function extractKeywords(text) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const foundKeywords = new Set();
  
  for (const keyword of TECH_KEYWORDS) {
    // Use word boundary regex to avoid false positives
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Normalize some variations
      let normalized = keyword;
      if (keyword === 'nodejs' || keyword === 'node.js') normalized = 'node';
      if (keyword === 'nextjs' || keyword === 'next.js') normalized = 'next';
      if (keyword === 'golang') normalized = 'go';
      if (keyword === 'postgres') normalized = 'postgresql';
      if (keyword === 'k8s') normalized = 'kubernetes';
      
      foundKeywords.add(normalized);
    }
  }
  
  return Array.from(foundKeywords);
}

/**
 * Detect seniority level from job title
 * @param {string} title - Job title
 * @returns {string} - Seniority level: 'entry', 'mid', 'senior', 'staff', 'management'
 */
function detectSeniority(title) {
  if (!title) return 'mid';
  
  const lowerTitle = title.toLowerCase();
  
  // Management
  if (/(manager|director|vp|head of|chief)/i.test(lowerTitle)) {
    return 'management';
  }
  
  // Staff/Principal
  if (/(staff|principal|architect)/i.test(lowerTitle)) {
    return 'staff';
  }
  
  // Senior
  if (/(senior|sr\.|lead)/i.test(lowerTitle)) {
    return 'senior';
  }
  
  // Entry level
  if (/(junior|jr\.|entry|associate|intern)/i.test(lowerTitle)) {
    return 'entry';
  }
  
  // Default to mid-level
  return 'mid';
}

module.exports = {
  extractKeywords,
  detectSeniority
};
