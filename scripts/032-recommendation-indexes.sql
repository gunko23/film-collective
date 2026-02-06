-- 032-recommendation-indexes.sql
-- Indexes to support improved recommendation engine (collaborative filtering, era preferences)

-- Composite index for collaborative filtering self-join:
-- Enables efficient lookup of shared movies between users with their scores
CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_movie_score
  ON user_movie_ratings(movie_id, user_id, overall_score);

-- Composite index for fetching top-rated movies per user efficiently
-- Used by director/actor affinity to get members' highest-rated movies
CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_user_score
  ON user_movie_ratings(user_id, overall_score DESC);
