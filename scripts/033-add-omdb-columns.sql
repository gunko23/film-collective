-- Add OMDb score columns to movies table
-- These store cached critic scores for internal recommendation quality scoring

ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating REAL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_votes INTEGER;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rotten_tomatoes_score INTEGER;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS metacritic_score INTEGER;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS omdb_fetched_at TIMESTAMP;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS omdb_fetch_status TEXT; -- 'success', 'error', or NULL (not yet fetched)

-- Index for finding movies that need OMDb fetching
CREATE INDEX IF NOT EXISTS idx_movies_omdb_fetch
  ON movies(imdb_id)
  WHERE imdb_id IS NOT NULL
    AND (omdb_fetched_at IS NULL OR omdb_fetch_status = 'error');
