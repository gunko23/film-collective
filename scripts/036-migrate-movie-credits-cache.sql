ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS director_ids JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS top_actor_ids JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credits_fetched_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_movies_credits_unfetched 
  ON movies(tmdb_id) 
  WHERE credits_fetched_at IS NULL;