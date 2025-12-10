/**
 * Common tech keywords dictionary
 */
const KEYWORDS = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php',
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js',
  // Backend
  'node', 'nodejs', 'node.js', 'express', 'django', 'flask', 'spring',
  // Databases
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sql',
  // Cloud/DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s',
  // Mobile
  'react native', 'flutter', 'swift', 'kotlin', 'ios', 'android',
  // Other
  'api', 'rest', 'graphql', 'microservices', 'agile', 'git',
];

/**
 * Extract keywords from text
 * @param {String} text - Text to extract keywords from
 * @returns {Array} - Array of matched keywords
 */
function extractKeywords(text) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const matched = new Set();
  
  for (const keyword of KEYWORDS) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Normalize variations (e.g., "node.js" -> "node")
      const normalized = keyword.replace(/\.js$/, '').replace(/\s+/g, '');
      matched.add(normalized);
    }
  }
  
  return Array.from(matched);
}

/**
 * Detect seniority level from job title
 * @param {String} title - Job title
 * @returns {String} - Seniority level
 */
function detectSeniority(title) {
  if (!title) return 'mid';
  
  const lowerTitle = title.toLowerCase();
  
  // Entry level
  if (/\b(junior|jr\.?|entry|associate|0-2 years)\b/i.test(lowerTitle)) {
    return 'entry';
  }
  
  // Senior level
  if (/\b(senior|sr\.?|lead|staff|principal)\b/i.test(lowerTitle)) {
    return 'senior';
  }
  
  // Management
  if (/\b(manager|director|vp|head of|chief)\b/i.test(lowerTitle)) {
    return 'management';
  }
  
  // Default to mid
  return 'mid';
}

module.exports = {
  extractKeywords,
  detectSeniority,
};
