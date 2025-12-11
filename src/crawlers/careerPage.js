const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { extractKeywords } = require('../utils/keywords');
const companies = require('../data/companies.json');

/**
 * Career Page Crawler
 * Scrapes job listings directly from company career pages
 */
class CareerPageCrawler {
  constructor(config) {
    this.rateLimit = config?.rateLimit || 5000; // 5 seconds between requests
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.companies = companies;
  }

  /**
   * Fetch page with error handling
   */
  async fetchPage(url) {
    try {
      logger.debug(`Fetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        timeout: 15000,
        maxRedirects: 5,
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        logger.error(`Error fetching ${url}: ${error.response.status} ${error.response.statusText}`);
      } else {
        logger.error(`Error fetching ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generic parser for career pages
   * Uses common patterns found on most career sites
   */
  parseJobListings(html, companyName) {
    const $ = cheerio.load(html);
    const jobs = [];

    // Common selectors for job listings across different career pages
    const selectors = [
      // Generic job listing patterns
      '[data-job-id]',
      '.job-listing',
      '.job-item',
      '.career-item',
      '.position',
      '.opening',
      '[class*="job"]',
      '[class*="position"]',
      '[class*="career"]',
      'article[class*="job"]',
      'div[class*="JobCard"]',
      'li[class*="job"]',
    ];

    let jobElements = $();
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        jobElements = elements;
        logger.debug(`Found ${elements.length} jobs using selector: ${selector}`);
        break;
      }
    }

    // If no structured elements found, try to find job titles directly
    if (jobElements.length === 0) {
      logger.debug('No structured job elements found, searching for job titles');
      jobElements = $('h2, h3, h4').filter((i, el) => {
        const text = $(el).text().toLowerCase();
        return (
          text.includes('engineer') ||
          text.includes('developer') ||
          text.includes('analyst') ||
          text.includes('manager') ||
          text.includes('designer') ||
          text.includes('scientist')
        );
      }).parent();
    }

    jobElements.each((index, element) => {
      try {
        const $el = $(element);
        
        // Try to extract title
        let title = $el.find('h1, h2, h3, h4, [class*="title"], [class*="Title"]').first().text().trim();
        if (!title) {
          title = $el.find('a').first().text().trim();
        }
        if (!title) {
          title = $el.text().split('\n')[0].trim();
        }

        // Try to extract location
        let location = $el.find('[class*="location"], [class*="Location"]').first().text().trim();
        if (!location) {
          // Look for common location patterns in text
          const text = $el.text();
          const locationMatch = text.match(/(Remote|Hybrid|[A-Z][a-z]+,\s*[A-Z]{2}|[A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})/);
          location = locationMatch ? locationMatch[0] : 'Not specified';
        }

        // Try to extract URL
        let jobUrl = $el.find('a').first().attr('href');
        if (jobUrl && !jobUrl.startsWith('http')) {
          // Make relative URLs absolute
          const baseUrl = new URL(this.companies.find(c => c.name === companyName)?.careerUrl || '');
          jobUrl = new URL(jobUrl, baseUrl.origin).href;
        }

        // Only add if we have at least a title
        if (title && title.length > 5) {
          jobs.push({
            title,
            company: companyName,
            location: location || 'Not specified',
            url: jobUrl || 'URL not found',
          });
        }
      } catch (error) {
        logger.debug('Error parsing job element:', error.message);
      }
    });

    return jobs;
  }

  /**
   * Crawl career pages for jobs
   */
  async crawl(searchParams, saveCallback) {
    const { keywords = [], maxCompanies = 10 } = searchParams;
    let totalJobsFound = 0;

    // Filter companies if keywords provided
    let companiesToCrawl = this.companies.slice(0, maxCompanies);

    logger.info(`Starting career page crawl for ${companiesToCrawl.length} companies`);

    for (const company of companiesToCrawl) {
      try {
        logger.info(`Crawling ${company.name} career page...`);
        
        // Fetch career page
        const html = await this.fetchPage(company.careerUrl);
        
        // Parse job listings
        const jobs = this.parseJobListings(html, company.name);
        
        logger.info(`${company.name}: Found ${jobs.length} jobs`);

        // Filter by keywords if provided
        let filteredJobs = jobs;
        if (keywords && keywords.length > 0) {
          filteredJobs = jobs.filter(job => {
            const titleLower = job.title.toLowerCase();
            return keywords.some(keyword => 
              titleLower.includes(keyword.toLowerCase())
            );
          });
          if (filteredJobs.length < jobs.length) {
            logger.info(`${company.name}: ${filteredJobs.length} jobs match keywords`);
          }
        }

        // Save each job
        for (const job of filteredJobs) {
          const jobKeywords = extractKeywords(job.title);
          
          const jobData = {
            url: job.url,
            title: job.title,
            company: job.company,
            location: job.location,
            keywords: jobKeywords,
            source: 'career_page',
            remotePolicy: company.remotePolicy,
          };

          try {
            await saveCallback(jobData);
            totalJobsFound++;
          } catch (error) {
            logger.error(`Error saving job: ${error.message}`);
          }
        }

        // Rate limiting between companies
        await this.sleep(this.rateLimit);
        
      } catch (error) {
        logger.error(`Error crawling ${company.name}: ${error.message}`);
        // Continue to next company
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

module.exports = CareerPageCrawler;
