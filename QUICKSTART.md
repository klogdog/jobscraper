# Quick Start Guide

## Testing Locally (without Docker)

### Prerequisites
1. PostgreSQL 15+ installed and running
2. Node.js 18+ installed

### Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Create the database:**
```bash
createdb resumebuilder
```

3. **Initialize the schema:**
```bash
psql -d resumebuilder -f src/db/schema.sql
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials if needed
```

5. **Run the crawler:**
```bash
npm start
```

The crawler will:
- Run an initial crawl immediately on startup
- Schedule daily crawls at 9 AM
- Schedule cleanup at 2 AM daily

### Check Results

```sql
-- Connect to database
psql -d resumebuilder

-- View discovered jobs
SELECT id, title, company, location, keywords, source 
FROM job_repository 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 10;

-- Count jobs by source
SELECT source, COUNT(*) as count
FROM job_repository
WHERE is_active = true
GROUP BY source;

-- Search for React jobs
SELECT title, company, location
FROM job_repository
WHERE is_active = true
  AND 'react' = ANY(keywords)
LIMIT 10;
```

## Testing with Docker

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Create environment file:**
```bash
cp .env.example .env
```

2. **Start the stack:**
```bash
docker compose up --build
```

This will:
- Start PostgreSQL container
- Initialize the database schema
- Start the job scraper
- Run an initial crawl

3. **View logs:**
```bash
docker compose logs -f job-bot
```

4. **Access database:**
```bash
docker compose exec postgres psql -U postgres -d resumebuilder
```

5. **Stop the stack:**
```bash
docker compose down
```

## Customizing Search Parameters

Edit `src/config.js`:

```javascript
crawler: {
  searchKeywords: ['software engineer', 'backend developer', 'data engineer'],
  searchLocations: ['Remote', 'San Francisco', 'New York'],
  maxPages: 3,  // Increase to crawl more pages (10 jobs per page)
  rateLimit: 5000,  // Increase delay if getting rate limited
}
```

## Troubleshooting

### Issue: Database connection failed
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -l | grep resumebuilder`

### Issue: No jobs found
- Indeed may be blocking or changing their HTML structure
- Check the crawler logs for parsing errors
- Verify the search terms return results on Indeed.com manually
- Try increasing `maxPages` in config

### Issue: Rate limiting errors
- Increase `rateLimit` in `src/config.js` (default is 3000ms)
- Reduce `maxPages` to crawl fewer pages
- Reduce number of search terms

### Issue: Docker build fails
- Ensure Docker is running: `docker ps`
- Try clearing cache: `docker system prune -a`
- Rebuild: `docker compose build --no-cache`

## Production Deployment

For production deployment to cloud (GCP, AWS):

1. Use managed PostgreSQL (Cloud SQL, RDS)
2. Set environment variables in cloud service
3. Use container registry (GCR, ECR)
4. Deploy to Cloud Run, ECS, or Kubernetes
5. Set up monitoring and alerting
6. Configure backup and disaster recovery

See the full implementation plan in `plan.txt` for detailed deployment instructions.
