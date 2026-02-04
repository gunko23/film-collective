-- Add composite index covering the ORDER BY clause for movie comments queries
-- Replaces idx_movie_comments_collective_tmdb which lacks created_at
DROP INDEX IF EXISTS idx_movie_comments_collective_tmdb;
CREATE INDEX IF NOT EXISTS idx_movie_comments_collective_tmdb_created
  ON movie_comments(collective_id, tmdb_id, media_type, created_at ASC);
