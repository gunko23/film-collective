-- Migration: Add per-participant watch status tracking
-- Each participant independently tracks their progress: planned -> watching -> watched

ALTER TABLE planned_watch_participants
  ADD COLUMN watch_status TEXT NOT NULL DEFAULT 'planned';

ALTER TABLE planned_watch_participants
  ADD COLUMN watched_at TIMESTAMPTZ;

CREATE INDEX idx_pwp_watch_status ON planned_watch_participants(watch_status);
