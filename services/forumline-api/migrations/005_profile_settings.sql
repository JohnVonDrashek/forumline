-- Migration: Add profile settings columns (status message, online status preferences)
--
-- online_status: 'online' (show real heartbeat status), 'away' (always away), 'offline' (appear offline)
-- show_online_status: whether other users can see your online presence at all

ALTER TABLE forumline_profiles
  ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'online' NOT NULL,
  ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true NOT NULL;
