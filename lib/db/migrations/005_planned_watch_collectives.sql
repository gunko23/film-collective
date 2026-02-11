-- Migration: Replace planned_watches.collective_id with many-to-many junction table
-- This allows a single planned watch to be shared across multiple collectives

CREATE TABLE planned_watch_collectives (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_watch_id UUID NOT NULL REFERENCES planned_watches(id) ON DELETE CASCADE,
  collective_id    UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(planned_watch_id, collective_id)
);

CREATE INDEX idx_pwc_planned_watch ON planned_watch_collectives(planned_watch_id);
CREATE INDEX idx_pwc_collective ON planned_watch_collectives(collective_id);

-- Migrate existing data: copy non-null collective_id rows into the junction table
INSERT INTO planned_watch_collectives (planned_watch_id, collective_id)
SELECT id, collective_id FROM planned_watches
WHERE collective_id IS NOT NULL;

-- Drop the old column and its index
DROP INDEX IF EXISTS idx_pw_collective;
ALTER TABLE planned_watches DROP COLUMN collective_id;
