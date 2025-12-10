# Job Scraper

Job scraping service for automated job discovery and resume tuning.

## Overview

The Job Scraper is a microservice that automatically crawls job boards (starting with Indeed.com) to discover and index job listings. It runs on a scheduled basis, storing job metadata in a PostgreSQL database for easy searching and integration with resume tuning tools.

## Features

- **Automated Job Discovery**: Crawls Indeed.com daily to discover new job listings
- **Smart Keyword Extraction**: Automatically extracts tech keywords from job titles
- **Seniority Detection**: Identifies job level (entry, mid, senior, staff, management)
- **PostgreSQL Storage**: Stores job metadata with efficient indexing
- **Rate Limiting**: Respects rate limits with configurable delays between requests
- **Docker Support**: Runs in Docker containers for easy deployment
- **Scheduled Execution**: Uses cron jobs for daily crawling and cleanup
- **Automatic Cleanup**: Marks old jobs as inactive after 7 days

## Architecture

```
src/
├── index.js              # Main entry point and scheduler
├── config.js             # Configuration management
├── db/
│   ├── schema.sql        # Database schema
│   ├── connection.js     # PostgreSQL connection pool
│   └── queries.js        # Database queries
├── crawlers/
│   └── indeed.js         # Indeed.com crawler
└── utils/
    ├── logger.js         # Simple console logger
    └── keywords.js       # Keyword extraction utilities
```

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (or use Docker Compose)
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/klogdog/jobscraper.git
   cd jobscraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   
   If you have PostgreSQL installed locally:
   ```bash
   createdb resumebuilder
   psql resumebuilder < src/db/schema.sql
   ```

5. **Run the application**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for Docker)
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f jobscraper
   ```

4. **Stop the services**
   ```bash
   docker-compose down
   ```

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `password` |
| `DB_NAME` | Database name | `resumebuilder` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level (info/debug/error) | `info` |
| `CRAWL_SCHEDULE` | Cron expression for crawling | `0 9 * * *` (9 AM daily) |
| `CLEANUP_SCHEDULE` | Cron expression for cleanup | `0 2 * * *` (2 AM daily) |
| `RATE_LIMIT_DELAY` | Delay between requests (ms) | `3000` |
| `MAX_PAGES` | Max pages to crawl per search | `2` |
| `RUN_IMMEDIATELY` | Run crawler on startup | `true` |

## Search Configuration

Customize search parameters by editing `src/config.js`:

```javascript
searchConfigs: [
  {
    keywords: ['software engineer', 'full stack developer'],
    locations: ['Remote'],
  },
  // Add more configurations...
]
```

## Database Schema

The `job_repository` table stores job metadata:

- `id`: Primary key
- `job_url`: Unique job URL
- `title`: Job title
- `company`: Company name
- `location`: Job location
- `keywords`: Array of extracted tech keywords
- `source`: Job board source (e.g., 'indeed')
- `is_active`: Active status (true/false)
- `last_verified`: Last time job was seen
- `created_at`: When job was first discovered

## How It Works

1. **Scheduled Crawling**: The scheduler runs daily at 9 AM (configurable)
2. **Job Discovery**: Crawler searches Indeed.com with configured keywords/locations
3. **Data Extraction**: Extracts job title, company, location, and URL
4. **Keyword Detection**: Automatically extracts tech keywords from titles
5. **Seniority Detection**: Identifies job level from title
6. **Database Storage**: Saves or updates jobs in PostgreSQL
7. **Cleanup**: Daily cleanup marks jobs inactive if not seen in 7 days

## API Integration

This service populates the `job_repository` table. To integrate with your application:

### Search Jobs

```sql
SELECT * FROM job_repository
WHERE is_active = true
  AND keywords && ARRAY['react', 'node']::text[]
  AND location ILIKE '%Remote%'
ORDER BY last_verified DESC
LIMIT 50;
```

### Get Job Details

```sql
SELECT * FROM job_repository
WHERE id = $1 AND is_active = true;
```

## Logging

Logs are written to console with timestamps:
- **INFO**: General operation logs (crawler start/stop, jobs found)
- **WARN**: Non-critical issues (failed page fetch)
- **ERROR**: Critical errors (database connection failure)
- **DEBUG**: Detailed debugging info (individual job processing)

Set `LOG_LEVEL=debug` for verbose logging.

## Monitoring

Check crawler health:
```bash
docker-compose logs -f jobscraper
```

View database statistics:
```sql
SELECT 
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
  COUNT(DISTINCT company) as unique_companies
FROM job_repository;
```

## Troubleshooting

### Crawler not finding jobs
- Indeed may have changed their HTML structure
- Update selectors in `src/crawlers/indeed.js`
- Check logs for parsing errors

### Database connection fails
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb resumebuilder`

### Rate limiting errors
- Increase `RATE_LIMIT_DELAY` in `.env`
- Reduce `MAX_PAGES` to crawl fewer pages

## Development

### Adding New Crawlers

1. Create new crawler in `src/crawlers/`
2. Extend the base crawler pattern from `indeed.js`
3. Implement URL building and HTML parsing
4. Add to `src/index.js` for execution

### Testing

Manual testing:
```bash
# Run crawler once
npm start

# Check database
psql resumebuilder -c "SELECT COUNT(*) FROM job_repository;"
```

## MVP Scope

This MVP implementation includes:
- ✅ Single job board crawler (Indeed.com)
- ✅ Basic PostgreSQL storage
- ✅ Simple scheduler (daily runs)
- ✅ Basic error handling and logging
- ✅ Docker containerization
- ✅ Keyword extraction and seniority detection

Post-MVP features (not included):
- LinkedIn, Greenhouse, Lever crawlers
- Advanced anti-blocking (proxy rotation)
- API endpoints (implement in main app)
- Email alerts
- Comprehensive testing suite
- CI/CD pipeline

## License

MIT

## Contact

Project Owner: klogdog
Repository: [github.com/klogdog/jobscraper](https://github.com/klogdog/jobscraper)
