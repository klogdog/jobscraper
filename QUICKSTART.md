# Quick Start Guide

This guide will help you get the Job Scraper running in under 5 minutes.

## Option 1: Docker (Recommended)

The easiest way to run the Job Scraper is using Docker Compose, which will set up both the application and PostgreSQL database.

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Clone and navigate to the repository**
   ```bash
   git clone https://github.com/klogdog/jobscraper.git
   cd jobscraper
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   The defaults work fine for Docker. You can customize if needed.

3. **Start the services**
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Pull the PostgreSQL image
   - Build the Job Scraper image
   - Initialize the database with the schema
   - Start both containers

4. **View logs**
   ```bash
   docker-compose logs -f jobscraper
   ```
   
   You should see:
   - Database connection successful
   - Scheduler started
   - Crawler running (if `RUN_IMMEDIATELY=true`)
   - Jobs being discovered and saved

5. **Check the database**
   ```bash
   docker-compose exec postgres psql -U postgres -d resumebuilder -c "SELECT COUNT(*) FROM job_repository;"
   ```

### Stopping

```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

## Option 2: Local Development

If you want to run the application locally without Docker.

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Steps

1. **Clone and navigate to the repository**
   ```bash
   git clone https://github.com/klogdog/jobscraper.git
   cd jobscraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   ```bash
   # Create database
   createdb resumebuilder
   
   # Load schema
   psql resumebuilder < src/db/schema.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=resumebuilder
   DB_PORT=5432
   ```

5. **Run the application**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## What Happens Next?

Once running, the Job Scraper will:

1. **Test the database connection** - Ensures PostgreSQL is accessible
2. **Start the scheduler** - Sets up cron jobs for:
   - Daily crawling at 9 AM (configurable via `CRAWL_SCHEDULE`)
   - Daily cleanup at 2 AM (configurable via `CLEANUP_SCHEDULE`)
3. **Run initial crawl** - If `RUN_IMMEDIATELY=true` (default), runs immediately on startup
4. **Discover jobs** - Searches Indeed.com for configured keywords and locations
5. **Extract metadata** - Pulls out tech keywords and seniority levels
6. **Save to database** - Stores jobs in PostgreSQL with deduplication

## Verifying It Works

### Check logs for successful crawl
Look for messages like:
```
[INFO] Starting crawler job...
[INFO] Found 10 jobs on page 1
[INFO] Crawl completed. Total jobs found: 45
```

### Query the database
```bash
# With Docker
docker-compose exec postgres psql -U postgres -d resumebuilder -c "SELECT title, company, location FROM job_repository LIMIT 5;"

# Local
psql resumebuilder -c "SELECT title, company, location FROM job_repository LIMIT 5;"
```

### Check statistics
```bash
docker-compose exec postgres psql -U postgres -d resumebuilder -c "
SELECT 
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
  COUNT(DISTINCT company) as unique_companies
FROM job_repository;
"
```

## Customizing Search Parameters

Edit `src/config.js` to customize what jobs to search for:

```javascript
searchConfigs: [
  {
    keywords: ['software engineer', 'full stack developer'],
    locations: ['Remote', 'San Francisco'],
  },
  {
    keywords: ['backend engineer'],
    locations: ['Remote', 'New York'],
  },
  // Add more configurations
]
```

Restart the application after making changes:
```bash
docker-compose restart jobscraper
```

## Common Issues

### Can't connect to database
- **Docker**: Ensure `DB_HOST=postgres` in `.env`
- **Local**: Ensure PostgreSQL is running and credentials are correct

### No jobs found
- Indeed may have changed their HTML structure
- Check logs for parsing errors
- The crawler waits 3 seconds between requests for rate limiting

### Application exits immediately
- Check logs: `docker-compose logs jobscraper`
- Verify database connection
- Ensure `.env` file exists

## Next Steps

- Check out the full [README.md](README.md) for detailed documentation
- Review the database schema in `src/db/schema.sql`
- Customize search parameters in `src/config.js`
- Integrate with your resume builder application

## Support

For issues or questions, please open an issue on GitHub:
https://github.com/klogdog/jobscraper/issues
