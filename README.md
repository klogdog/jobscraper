# Job Scraper

Job scraping service for Resume Builder Auto. This service automatically discovers and indexes job postings from Indeed.com to support intelligent resume tuning.

## Features

- **Daily Job Discovery**: Automatically crawls Indeed.com for job postings
- **Keyword Extraction**: Identifies tech skills and keywords from job titles
- **PostgreSQL Storage**: Stores discovered jobs in a searchable database
- **Rate Limiting**: Respectful crawling with configurable delays
- **Docker Support**: Easy deployment with Docker Compose

## Architecture

```
src/
├── index.js                    # Main entry point with scheduler
├── config.js                   # Configuration management
├── db/
│   ├── connection.js           # PostgreSQL connection pool
│   ├── schema.sql              # Database schema
│   └── queries.js              # Database queries
├── crawlers/
│   └── indeed.js               # Indeed crawler implementation
└── utils/
    ├── logger.js               # Simple console logger
    └── keywords.js             # Keyword extraction utilities
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/klogdog/jobscraper.git
cd jobscraper
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
# Create the database
createdb resumebuilder

# Run the schema
psql -d resumebuilder -f src/db/schema.sql
```

### Running Locally

Start the crawler:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Running with Docker

1. Start the entire stack:
```bash
docker-compose up --build
```

This will:
- Start a PostgreSQL database
- Initialize the schema
- Start the job scraper service
- Run an initial crawl on startup

2. Stop the stack:
```bash
docker-compose down
```

## Configuration

Edit `.env` or `src/config.js` to customize:

- **Search Keywords**: `['software engineer', 'full stack developer']`
- **Search Locations**: `['Remote']`
- **Max Pages**: `2` (pages per search)
- **Rate Limit**: `3000` ms (3 seconds between requests)
- **Crawl Schedule**: `'0 9 * * *'` (daily at 9 AM)
- **Cleanup Schedule**: `'0 2 * * *'` (daily at 2 AM)

## Database Schema

### job_repository

Stores discovered job listings:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| job_url | TEXT | Unique job posting URL |
| title | TEXT | Job title |
| company | TEXT | Company name |
| location | TEXT | Job location |
| keywords | TEXT[] | Extracted tech keywords |
| source | TEXT | Crawler source (e.g., 'indeed') |
| is_active | BOOLEAN | Whether job is still active |
| last_verified | TIMESTAMP | Last time job was seen |
| created_at | TIMESTAMP | When job was first discovered |

## Usage

The service runs on a schedule and automatically:
1. Crawls Indeed for configured search terms
2. Extracts job details and keywords
3. Stores jobs in the database
4. Marks old jobs (7+ days) as inactive

You can also query the database directly:

```sql
-- Search for React jobs
SELECT * FROM job_repository 
WHERE is_active = true 
  AND 'react' = ANY(keywords)
ORDER BY last_verified DESC;

-- View most common keywords
SELECT keyword, COUNT(*) as count
FROM job_repository, unnest(keywords) as keyword
WHERE is_active = true
GROUP BY keyword
ORDER BY count DESC
LIMIT 20;
```

## Development

### Adding New Search Terms

Edit `src/config.js`:

```javascript
crawler: {
  searchKeywords: ['software engineer', 'backend developer', 'data engineer'],
  searchLocations: ['Remote', 'San Francisco', 'New York'],
  // ...
}
```

### Adding New Keywords

Edit `src/utils/keywords.js` to add more tech keywords for extraction.

### Testing

Create a test environment file:
```bash
cp .env.example .env.test
# Update with test database credentials
```

Run a single crawl:
```bash
node src/index.js
```

## API Integration

This service populates a PostgreSQL database that can be queried by other services (e.g., Resume Builder Auto) via:

1. **Direct Database Access**: Connect to the `job_repository` table
2. **REST API** (future): Planned API endpoints for job search and scraping

## Maintenance

### Monitoring

Check logs for crawler activity:
```bash
docker-compose logs -f job-bot
```

### Database Maintenance

```sql
-- Check job count
SELECT COUNT(*) FROM job_repository WHERE is_active = true;

-- Check jobs by source
SELECT source, COUNT(*) FROM job_repository 
WHERE is_active = true 
GROUP BY source;

-- Clean up old inactive jobs
DELETE FROM job_repository 
WHERE is_active = false 
  AND last_verified < NOW() - INTERVAL '30 days';
```

## MVP Scope

This implementation includes:
- ✅ Single job board crawler (Indeed.com)
- ✅ Basic job repository storage (PostgreSQL)
- ✅ Simple scheduler (runs daily)
- ✅ Basic error handling and logging
- ✅ Docker containerization
- ✅ Keyword extraction
- ✅ Rate limiting

Future enhancements (post-MVP):
- LinkedIn, Greenhouse, Lever crawlers
- Advanced anti-blocking (proxy rotation)
- REST API endpoints
- Web dashboard
- Email alerts
- Cloud deployment (GCP/AWS)
- Comprehensive testing suite

## License

ISC

## Contributing

This is a private project for Resume Builder Auto. For questions or suggestions, contact the project owner.

