-- Job Repository Table
-- Stores metadata for all discovered jobs
CREATE TABLE IF NOT EXISTS job_repository (
    id SERIAL PRIMARY KEY,
    job_url VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    company VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    keywords TEXT[],
    source VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_repo_active ON job_repository(is_active);
CREATE INDEX IF NOT EXISTS idx_job_repo_keywords ON job_repository USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_job_repo_company ON job_repository(company);
CREATE INDEX IF NOT EXISTS idx_job_repo_source ON job_repository(source);
CREATE INDEX IF NOT EXISTS idx_job_repo_last_verified ON job_repository(last_verified);
