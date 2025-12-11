# Quick Start Guide

## How to Use

### 1. Start the Application

```bash
docker-compose up --build
```

This will:
- Start PostgreSQL database
- Start the job scraper
- Run an initial crawl immediately
- Schedule automatic daily crawls at 9:00 AM
- Schedule cleanup of old jobs at 2:00 AM

### 2. View Scraped Jobs

```bash
# View all jobs
docker exec -it jobscraper-postgres-1 psql -U postgres -d resumebuilder -c "SELECT id, title, company, location, source, created_at FROM jobs ORDER BY created_at DESC LIMIT 20;"

# Count total jobs
docker exec -it jobscraper-postgres-1 psql -U postgres -d resumebuilder -c "SELECT COUNT(*) FROM jobs WHERE is_active = true;"

# Search by keyword
docker exec -it jobscraper-postgres-1 psql -U postgres -d resumebuilder -c "SELECT title, company, location FROM jobs WHERE 'engineer' = ANY(keywords);"
```

### 3. View Application Logs

```bash
# Follow logs in real-time
docker-compose logs -f job-bot

# View database logs
docker-compose logs -f postgres
```

### 4. Stop the Application

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### 5. Customize Search Parameters

Edit `src/config.js` to change:
- **Search keywords**: `searchKeywords: ['software engineer', 'data scientist']`
- **Locations**: `searchLocations: ['Remote', 'New York, NY']`
- **Pages per search**: `maxPages: 3`
- **Rate limit**: `rateLimit: 5000` (milliseconds between requests)

Then restart:
```bash
docker-compose restart
```

---

## Testing Locally (without Docker)

### Prerequisites
1. PostgreSQL 15+ installed and running
2. Node.js 20+ installed

### Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Create .env file:**
```bash
cat > .env << EOF
DB_USER=postgres
DB_HOST=localhost
DB_NAME=resumebuilder
DB_PASSWORD=password
DB_PORT=5432
EOF
```

3. **Create the database:**
```bash
createdb resumebuilder
```

4. **Initialize the schema:**
```bash
psql -d resumebuilder -f src/db/schema.sql
```

5. **Run the crawler:**
```bash
npm start
```

### Check Results

```sql
-- Connect to database
psql -d resumebuilder

-- View discovered jobs
SELECT id, title, company, location, keywords, source 
FROM jobs 
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
