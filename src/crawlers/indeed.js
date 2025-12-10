const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { extractKeywords } = require('../utils/keywords');

/**
 * Indeed Job Crawler
 */
class IndeedCrawler {
  constructor(config) {
    this.rateLimit = config?.rateLimit || 3000; // 3 seconds
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Build Indeed search URL
   */
  buildSearchUrl(keywords, location, start = 0) {
    const baseUrl = 'https://www.indeed.com/jobs';
    const params = new URLSearchParams({
      q: keywords,
      l: location,
      start: start.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Fetch page with rate limiting
   */
  async fetchPage(url) {
    try {
      logger.debug(`Fetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching page: ${url}`, error.message);
      throw error;
    }
  }

  /**
   * Parse job listings from HTML
   */
  parseJobListings(html) {
    const $ = cheerio.load(html);
    const jobs = [];

    // Indeed uses different class names, try multiple selectors
    const jobCards = $('.job_seen_beacon, .resultContent, .slider_container .job_seen_beacon');
    
    logger.debug(`Found ${jobCards.length} job cards`);

    jobCards.each((index, element) => {
      try {
        const $card = $(element);
        
        // Extract job title and URL
        const titleElement = $card.find('h2.jobTitle a, h2.jobTitle span[title]');
        const titleLink = $card.find('h2.jobTitle a').first();
        
        let title = titleElement.first().attr('title') || titleElement.first().text().trim();
        let jobUrl = titleLink.attr('href');
        
        // If URL is relative, make it absolute
        if (jobUrl && jobUrl.startsWith('/')) {
          jobUrl = `https://www.indeed.com${jobUrl}`;
        }
        
        // Extract company
        const company = $card.find('.companyName').first().text().trim();
        
        // Extract location
        const location = $card.find('.companyLocation').first().text().trim();
        
        // Only add if we have required fields
        if (title && company && jobUrl) {
          jobs.push({
            title,
            company,
            location: location || 'Not specified',
            url: jobUrl,
          });
        }
      } catch (error) {
        logger.error('Error parsing job card:', error.message);
      }
    });

    return jobs;
  }

  /**
   * Crawl Indeed for jobs
   */
  async crawl(searchParams, saveCallback) {
    const { keywords, locations, maxPages = 2 } = searchParams;
    let totalJobsFound = 0;

    for (const keyword of keywords) {
      for (const location of locations) {
        logger.info(`Crawling Indeed: "${keyword}" in "${location}"`);

        for (let page = 0; page < maxPages; page++) {
          try {
            const start = page * 10; // Indeed shows 10 jobs per page
            const url = this.buildSearchUrl(keyword, location, start);
            
            // Fetch and parse page
            const html = await this.fetchPage(url);
            const jobs = this.parseJobListings(html);
            
            logger.info(`Page ${page + 1}: Found ${jobs.length} jobs`);

            // Process each job
            for (const job of jobs) {
              const jobKeywords = extractKeywords(job.title);
              
              const jobData = {
                url: job.url,
                title: job.title,
                company: job.company,
                location: job.location,
                keywords: jobKeywords,
                source: 'indeed',
              };

              // Save to database via callback
              try {
                await saveCallback(jobData);
                totalJobsFound++;
              } catch (error) {
                logger.error('Error saving job:', error.message);
              }
            }

            // Rate limiting - wait before next page
            if (page < maxPages - 1) {
              await this.sleep(this.rateLimit);
            }
          } catch (error) {
            logger.error(`Error crawling page ${page + 1}:`, error.message);
            // Continue to next page on error
          }
        }

        // Rate limiting between searches
        await this.sleep(this.rateLimit);
      }
    }

    return totalJobsFound;
  }

  /**
   * Sleep utility for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = IndeedCrawler;
