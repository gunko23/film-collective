-- Add per-movie mood affinity scores (LLM-generated or rule-based)
-- Stores JSON: { "fun": 0.72, "intense": 0.15, "emotional": 0.85, "mindless": 0.30, "acclaimed": 0.60 }
ALTER TABLE movies ADD COLUMN IF NOT EXISTS mood_scores JSONB DEFAULT NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS mood_scored_at TIMESTAMPTZ DEFAULT NULL;

-- Index for backfill: find unscored popular movies efficiently
CREATE INDEX IF NOT EXISTS idx_movies_mood_unscored
  ON movies(tmdb_vote_count DESC NULLS LAST)
  WHERE mood_scored_at IS NULL
    AND tmdb_id IS NOT NULL
    AND title IS NOT NULL;
