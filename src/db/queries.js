const { pool } = require('./connection');
const logger = require('../utils/logger');

/**
 * Insert or update a job in the repository
 * @param {Object} jobData - Job data object
 * @returns {Promise<Object>} - Result of the operation
 */
async function upsertJob(jobData) {
  const { job_url, title, company, location, keywords, source } = jobData;
  
  const query = `
    INSERT INTO job_repository (
      job_url, title, company, location, keywords, source, last_verified
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (job_url) DO UPDATE SET
      last_verified = NOW(),
      is_active = true,
      keywords = EXCLUDED.keywords
    RETURNING id;
  `;
  
  try {
    const result = await pool.query(query, [
      job_url,
      title,
      company,
      location,
      keywords,
      source
    ]);
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    logger.error('Error upserting job:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search for jobs by keywords and location
 * @param {Array<string>} keywords - Array of keywords to search for
 * @param {string} location - Location to filter by (optional)
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of job objects
 */
async function searchJobs(keywords, location = '%', limit = 50) {
  const query = `
    SELECT * FROM job_repository
    WHERE is_active = true
      AND keywords && $1::text[]
      AND location ILIKE $2
    ORDER BY last_verified DESC
    LIMIT $3;
  `;
  
  try {
    const result = await pool.query(query, [keywords, location, limit]);
    return result.rows;
  } catch (error) {
    logger.error('Error searching jobs:', error);
    return [];
  }
}

/**
 * Mark jobs as inactive if not verified in 7 days
 * @returns {Promise<number>} - Number of jobs marked inactive
 */
async function markInactive() {
  const query = `
    UPDATE job_repository
    SET is_active = false
    WHERE last_verified < NOW() - INTERVAL '7 days'
      AND is_active = true;
  `;
  
  try {
    const result = await pool.query(query);
    logger.info(`Marked ${result.rowCount} jobs as inactive`);
    return result.rowCount;
  } catch (error) {
    logger.error('Error marking jobs inactive:', error);
    return 0;
  }
}

/**
 * Get statistics about the job repository
 * @returns {Promise<Object>} - Statistics object
 */
async function getStats() {
  const query = `
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
      COUNT(DISTINCT company) as unique_companies,
      COUNT(DISTINCT source) as sources
    FROM job_repository;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting stats:', error);
    return null;
  }
}

module.exports = {
  upsertJob,
  searchJobs,
  markInactive,
  getStats
};
