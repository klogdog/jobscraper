const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { extractKeywords, detectSeniority } = require('../utils/keywords');

/**
 * Indeed job board crawler
 * Scrapes job listings from Indeed.com
 */
class IndeedCrawler {
  constructor() {
    this.name = 'indeed';
    this.baseUrl = 'https://www.indeed.com';
    this.rateLimit = parseInt(process.env.RATE_LIMIT_DELAY) || 3000;
  }

  /**
   * Build Indeed search URL
   * @param {string} keywords - Search keywords
   * @param {string} location - Location
   * @returns {string} - Full search URL
   */
  buildSearchUrl(keywords, location) {
    const query = encodeURIComponent(keywords);
    const loc = encodeURIComponent(location);
    return `${this.baseUrl}/jobs?q=${query}&l=${loc}`;
  }

  /**
   * Delay execution for rate limiting
   * @param {number} ms - Milliseconds to wait
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch and parse a single page
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} - Parsed HTML and job data
   */
  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000
      });
      
      return { success: true, html: response.data };
    } catch (error) {
      logger.error(`Failed to fetch page ${url}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse job listings from HTML
   * @param {string} html - HTML content
   * @returns {Array<Object>} - Array of job objects
   */
  parseJobs(html) {
    const $ = cheerio.load(html);
    const jobs = [];

    // Indeed uses different selectors, try multiple
    const jobCards = $('.job_seen_beacon, .resultContent, .cardOutline');
    
    logger.debug(`Found ${jobCards.length} job cards on page`);

    jobCards.each((index, element) => {
      try {
        const $card = $(element);
        
        // Extract job title
        const titleElement = $card.find('h2.jobTitle span, h2.jobTitle a span, .jobTitle').first();
        const title = titleElement.text().trim();
        
        // Extract company name
        const company = $card.find('.companyName, [data-testid="company-name"]').first().text().trim();
        
        // Extract location
        const location = $card.find('.companyLocation, [data-testid="text-location"]').first().text().trim();
        
        // Extract job URL
        const linkElement = $card.find('h2.jobTitle a, .jcs-JobTitle').first();
        let jobUrl = linkElement.attr('href');
        
        if (jobUrl) {
          // Convert relative URL to absolute
          if (jobUrl.startsWith('/')) {
            jobUrl = `${this.baseUrl}${jobUrl}`;
          }
          
          // Clean up URL (remove tracking parameters)
          try {
            const urlObj = new URL(jobUrl);
            jobUrl = `${urlObj.origin}${urlObj.pathname}`;
          } catch (e) {
            // Keep original URL if parsing fails
          }
        }
        
        // Only add if we have required fields
        if (title && company && jobUrl) {
          jobs.push({
            title,
            company,
            location: location || 'Not specified',
            job_url: jobUrl,
            source: this.name
          });
        }
      } catch (error) {
        logger.debug(`Error parsing job card ${index}:`, error.message);
      }
    });

    return jobs;
  }

  /**
   * Crawl Indeed for jobs
   * @param {Object} searchParams - Search parameters
   * @param {Function} saveCallback - Callback to save job data
   * @returns {Promise<number>} - Number of jobs found
   */
  async crawl(searchParams, saveCallback) {
    const { keywords, locations, maxPages = 2 } = searchParams;
    let totalJobsFound = 0;

    logger.info(`Starting Indeed crawler for keywords: ${keywords.join(', ')}`);

    for (const keyword of keywords) {
      for (const location of locations) {
        logger.info(`Searching for "${keyword}" in "${location}"`);

        for (let page = 0; page < maxPages; page++) {
          const startIndex = page * 10; // Indeed uses 10 results per page
          let searchUrl = this.buildSearchUrl(keyword, location);
          
          // Add pagination parameter
          if (startIndex > 0) {
            searchUrl += `&start=${startIndex}`;
          }

          logger.info(`Fetching page ${page + 1}/${maxPages}: ${searchUrl}`);

          // Fetch the page
          const result = await this.fetchPage(searchUrl);
          
          if (!result.success) {
            logger.warn(`Failed to fetch page ${page + 1}, skipping...`);
            break; // Stop pagination for this search if fetch fails
          }

          // Parse jobs from the page
          const jobs = this.parseJobs(result.html);
          logger.info(`Found ${jobs.length} jobs on page ${page + 1}`);

          // Process each job
          for (const job of jobs) {
            // Extract keywords from title
            const keywords = extractKeywords(job.title);
            
            // Detect seniority level
            const seniorityLevel = detectSeniority(job.title);

            // Prepare job data with extracted information
            const jobData = {
              ...job,
              keywords,
              seniority_level: seniorityLevel
            };

            // Save to database via callback
            if (saveCallback) {
              await saveCallback(jobData);
            }

            totalJobsFound++;
          }

          // Rate limiting: wait between page requests
          if (page < maxPages - 1) {
            logger.debug(`Rate limiting: waiting ${this.rateLimit}ms before next page`);
            await this.sleep(this.rateLimit);
          }
        }

        // Rate limiting between different searches
        logger.debug(`Rate limiting: waiting ${this.rateLimit}ms before next search`);
        await this.sleep(this.rateLimit);
      }
    }

    logger.info(`Indeed crawler completed. Total jobs found: ${totalJobsFound}`);
    return totalJobsFound;
  }
}

module.exports = IndeedCrawler;
