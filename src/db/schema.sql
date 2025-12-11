-- Job Repository Table (main index of discovered jobs)
CREATE TABLE IF NOT EXISTS job_repository (
  id SERIAL PRIMARY KEY,
  job_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  source TEXT NOT NULL,
  remote_policy TEXT,
  is_active BOOLEAN DEFAULT true,
  last_verified TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_repo_active ON job_repository(is_active);
CREATE INDEX IF NOT EXISTS idx_job_repo_keywords ON job_repository USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_job_repo_company ON job_repository(company);
CREATE INDEX IF NOT EXISTS idx_job_repo_remote_policy ON job_repository(remote_policy);
CREATE INDEX IF NOT EXISTS idx_job_repo_created_at ON job_repository(created_at);
