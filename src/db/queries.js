const pool = require('./connection');

/**
 * Insert or update a job in the repository
 * @param {Object} jobData - Job data to insert/update
 */
async function upsertJob(jobData) {
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
  
  const values = [
    jobData.url,
    jobData.title,
    jobData.company,
    jobData.location,
    jobData.keywords,
    jobData.source,
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error upserting job:', error);
    throw error;
  }
}

/**
 * Search for jobs by keywords and location
 * @param {Array} keywords - Array of keywords to search
 * @param {String} location - Location to filter by
 * @param {Number} limit - Maximum number of results
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
  
  const values = [keywords, location, limit];
  
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}

/**
 * Mark jobs as inactive if not verified in the last 7 days
 */
async function markInactive() {
  const query = `
    UPDATE job_repository
    SET is_active = false
    WHERE last_verified < NOW() - INTERVAL '7 days'
      AND is_active = true
    RETURNING id;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rowCount;
  } catch (error) {
    console.error('Error marking jobs inactive:', error);
    throw error;
  }
}

module.exports = {
  upsertJob,
  searchJobs,
  markInactive,
};
