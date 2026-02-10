-- Migration: Add recommendation_history table for cross-session deduplication
-- Run against Neon PostgreSQL

CREATE TABLE IF NOT EXISTS recommendation_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id    INTEGER NOT NULL,
  context    TEXT NOT NULL DEFAULT 'tonights_pick',
  shown_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rh_user_recent ON recommendation_history(user_id, shown_at DESC);
CREATE INDEX idx_rh_tmdb ON recommendation_history(tmdb_id);
