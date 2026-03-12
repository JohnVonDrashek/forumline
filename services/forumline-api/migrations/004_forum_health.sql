-- Migration: Add forum health tracking columns
-- Supports periodic health probing and owner-initiated forum deletion.
--
-- Run this BEFORE deploying the new Go binary.

BEGIN;

-- 1. Track when the forum was last seen healthy
ALTER TABLE forumline_forums ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- 2. Track consecutive health-check failures
ALTER TABLE forumline_forums ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER DEFAULT 0 NOT NULL;

-- 3. Index for the health prober's batch query (probe forums not recently seen)
CREATE INDEX IF NOT EXISTS idx_forumline_forums_health_probe
  ON forumline_forums(last_seen_at NULLS FIRST)
  WHERE approved = true;

COMMIT;
