

### Optimize Database for Time-Series (Native PostgreSQL)

#### 1 Create Performance Indexes
Run this SQL in Supabase SQL Editor (Database → SQL Editor → New query):

```sql
CREATE INDEX IF NOT EXISTS idx_pnode_stats_timestamp_brin 
  ON pnode_stats USING BRIN (timestamp);

CREATE INDEX IF NOT EXISTS idx_pnode_stats_pnode_time_brin 
  ON pnode_stats USING BRIN (pnode_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_pnode_stats_timestamp_desc 
  ON pnode_stats (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_pnode_stats_pnode_timestamp 
  ON pnode_stats (pnode_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_network_stats_timestamp_desc
  ON network_stats (timestamp DESC);
```

#### 2 Create Materialized Views for Fast Analytics
```sql
-- Hourly aggregated stats (much faster than querying raw data)
-- Note: Views will be empty until you have data - that's normal!
CREATE MATERIALIZED VIEW IF NOT EXISTS pnode_stats_hourly AS
SELECT
  pnode_id,
  date_trunc('hour', timestamp) AS hour,
  AVG(cpu_percent) AS avg_cpu,
  MIN(cpu_percent) AS min_cpu,
  MAX(cpu_percent) AS max_cpu,
  AVG(storage_usage_percent) AS avg_storage_usage,
  MAX(storage_used) AS max_storage_used,
  MAX(uptime) AS max_uptime,
  AVG(health_score) AS avg_health_score,
  COUNT(*) AS sample_count
FROM pnode_stats
GROUP BY pnode_id, date_trunc('hour', timestamp);

-- Daily aggregated stats (for longer-term charts)
CREATE MATERIALIZED VIEW IF NOT EXISTS pnode_stats_daily AS
SELECT
  pnode_id,
  date_trunc('day', timestamp) AS day,
  AVG(cpu_percent) AS avg_cpu,
  AVG(storage_usage_percent) AS avg_storage_usage,
  MAX(storage_used) AS max_storage_used,
  MAX(uptime) AS max_uptime,
  AVG(health_score) AS avg_health_score,
  COUNT(*) AS sample_count
FROM pnode_stats
GROUP BY pnode_id, date_trunc('day', timestamp);
```

#### 2.1 Create Indexes on Materialized Views (Run AFTER views are created)
```sql
-- Index on hourly view (non-unique, will add after first data refresh)
CREATE INDEX IF NOT EXISTS idx_pnode_stats_hourly_pnode_hour 
  ON pnode_stats_hourly (pnode_id, hour DESC);

CREATE INDEX IF NOT EXISTS idx_pnode_stats_hourly_hour 
  ON pnode_stats_hourly (hour DESC);

-- Index on daily view
CREATE INDEX IF NOT EXISTS idx_pnode_stats_daily_pnode_day 
  ON pnode_stats_daily (pnode_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_pnode_stats_daily_day 
  ON pnode_stats_daily (day DESC);
```

#### 3 Create Helper Functions
```sql
-- Function to refresh materialized views (call this after bulk inserts)
CREATE OR REPLACE FUNCTION refresh_pnode_stats_views()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh without CONCURRENTLY for initial refresh (faster)
  -- Use CONCURRENTLY in production after first refresh
  REFRESH MATERIALIZED VIEW pnode_stats_hourly;
  REFRESH MATERIALIZED VIEW pnode_stats_daily;
  
  -- Log refresh
  RAISE NOTICE 'Materialized views refreshed at %', NOW();
END;
$$;

-- Function to cleanup old data (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_pnode_stats()
RETURNS TABLE(deleted_stats BIGINT, deleted_network_stats BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_deleted BIGINT;
  network_deleted BIGINT;
  cutoff_date TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff date
  cutoff_date := NOW() - INTERVAL '90 days';
  
  -- Delete old pnode_stats
  DELETE FROM pnode_stats 
  WHERE timestamp < cutoff_date;
  GET DIAGNOSTICS stats_deleted = ROW_COUNT;
  
  -- Delete old network_stats
  DELETE FROM network_stats 
  WHERE timestamp < cutoff_date;
  GET DIAGNOSTICS network_deleted = ROW_COUNT;
  
  -- Log cleanup
  RAISE NOTICE 'Cleaned up % pnode_stats and % network_stats rows older than %', 
    stats_deleted, network_deleted, cutoff_date;
  
  RETURN QUERY SELECT stats_deleted, network_deleted;
END;
$$;

-- Function to get latest stats for all pNodes (common query)
CREATE OR REPLACE FUNCTION get_latest_pnode_stats()
RETURNS TABLE(
  pnode_id UUID,
  pubkey VARCHAR(44),
  ip_address VARCHAR(45),
  version VARCHAR(20),
  status TEXT,
  storage_used BIGINT,
  cpu_percent DOUBLE PRECISION,
  health_score INTEGER,
  last_updated TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.pubkey,
    p.ip_address,
    p.version,
    p.status::TEXT,
    p.storage_used,
    p.cpu_percent,
    p.health_score,
    p.last_seen_at
  FROM pnodes p
  ORDER BY p.last_seen_at DESC;
$$;
```

#### 4 Verify Optimizations
```sql
-- Check index sizes (should be reasonable)
SELECT 
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('pnode_stats', 'pnodes', 'network_stats')
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```


