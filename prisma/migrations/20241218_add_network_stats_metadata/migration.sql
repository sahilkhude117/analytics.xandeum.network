-- Migration: Add transparency metadata to network_stats
-- Date: 2024-12-18
-- Purpose: Track which metrics are from all nodes vs public nodes only

-- Add metadata columns to network_stats
ALTER TABLE network_stats 
  ADD COLUMN IF NOT EXISTS public_pnodes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS private_pnodes INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detailed_stats_coverage DOUBLE PRECISION DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN network_stats.public_pnodes IS 'Number of nodes with public RPC access (detailed stats available)';
COMMENT ON COLUMN network_stats.private_pnodes IS 'Number of nodes without public RPC access (basic stats only)';
COMMENT ON COLUMN network_stats.detailed_stats_coverage IS 'Percentage of nodes with detailed stats (public_pnodes / total_pnodes * 100)';

COMMENT ON COLUMN network_stats.avg_cpu_percent IS 'Average CPU from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.avg_ram_usage_percent IS 'Average RAM from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.total_active_streams IS 'Total streams from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.total_packets_received IS 'Total packets received from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.total_packets_sent IS 'Total packets sent from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.total_bytes IS 'Total bytes from PUBLIC nodes only (sampled metric)';
COMMENT ON COLUMN network_stats.total_pages IS 'Total pages from PUBLIC nodes only (sampled metric)';

COMMENT ON COLUMN network_stats.total_storage_committed IS 'Total storage from ALL nodes (accurate)';
COMMENT ON COLUMN network_stats.total_storage_used IS 'Total storage used from ALL nodes (accurate)';
COMMENT ON COLUMN network_stats.avg_uptime IS 'Average uptime from ALL nodes (accurate)';

-- Verify migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'network_stats' 
  AND column_name IN ('public_pnodes', 'private_pnodes', 'detailed_stats_coverage')
ORDER BY ordinal_position;
