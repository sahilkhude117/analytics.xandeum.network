-- Migration: Add network table and optimize stats tables
-- Run this in Supabase SQL Editor

-- 1. Remove redundant columns from pnodes table (heavy stats moved to pnode_stats)
ALTER TABLE pnodes 
  DROP COLUMN IF EXISTS cpu_percent,
  DROP COLUMN IF EXISTS ram_used,
  DROP COLUMN IF EXISTS ram_total;

-- 2. Create network table (singleton for latest network state)
CREATE TABLE IF NOT EXISTS network (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'singleton',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  total_pnodes INTEGER NOT NULL DEFAULT 0,
  online_pnodes INTEGER NOT NULL DEFAULT 0,
  degraded_pnodes INTEGER NOT NULL DEFAULT 0,
  offline_pnodes INTEGER NOT NULL DEFAULT 0,
  
  total_storage_committed BIGINT NOT NULL DEFAULT 0,
  total_storage_used BIGINT NOT NULL DEFAULT 0,
  avg_storage_usage_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  avg_uptime INTEGER NOT NULL DEFAULT 0,
  network_health_score INTEGER NOT NULL DEFAULT 0
);

-- Ensure only one row can exist
CREATE UNIQUE INDEX IF NOT EXISTS network_singleton_idx ON network(id);

-- Insert initial singleton row
INSERT INTO network (
  id, 
  total_pnodes, 
  online_pnodes, 
  degraded_pnodes, 
  offline_pnodes,
  total_storage_committed,
  total_storage_used,
  avg_storage_usage_percent,
  avg_uptime,
  network_health_score
)
VALUES ('singleton', 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Update network_stats table with new columns
ALTER TABLE network_stats
  DROP COLUMN IF EXISTS total_packets,
  ADD COLUMN IF NOT EXISTS total_packets_received BIGINT,
  ADD COLUMN IF NOT EXISTS total_packets_sent BIGINT,
  ADD COLUMN IF NOT EXISTS total_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS total_pages INTEGER;

-- Make avg columns nullable (only populated by hourly cron)
ALTER TABLE network_stats
  ALTER COLUMN avg_cpu_percent DROP NOT NULL,
  ALTER COLUMN avg_ram_usage_percent DROP NOT NULL,
  ALTER COLUMN total_active_streams DROP NOT NULL;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_stats_timestamp_desc 
  ON network_stats (timestamp DESC);

-- 5. Verify tables
SELECT 
  'pnodes' as table_name, 
  COUNT(*) as row_count 
FROM pnodes
UNION ALL
SELECT 'pnode_stats', COUNT(*) FROM pnode_stats
UNION ALL
SELECT 'network', COUNT(*) FROM network
UNION ALL
SELECT 'network_stats', COUNT(*) FROM network_stats;

-- 6. Check network table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'network'
ORDER BY ordinal_position;
