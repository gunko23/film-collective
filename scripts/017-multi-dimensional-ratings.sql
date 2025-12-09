-- Multi-dimensional Rating System Migration
-- Adds taste dimensions, explanation fields, and aggregation views for movies and TV shows

-- ============================================
-- PART 1: Add dimension columns to TV ratings
-- ============================================

-- Add multi-dimensional rating columns to user_tv_show_ratings
ALTER TABLE user_tv_show_ratings 
ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_explanation TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT NULL;

-- Add multi-dimensional rating columns to user_episode_ratings
ALTER TABLE user_episode_ratings 
ADD COLUMN IF NOT EXISTS dimension_scores JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_explanation TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT NULL;

-- Create indexes for faster querying on dimension scores
CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_dimension_scores ON user_movie_ratings USING GIN (dimension_scores);
CREATE INDEX IF NOT EXISTS idx_user_tv_show_ratings_dimension_scores ON user_tv_show_ratings USING GIN (dimension_scores);
CREATE INDEX IF NOT EXISTS idx_user_episode_ratings_dimension_scores ON user_episode_ratings USING GIN (dimension_scores);

-- ============================================
-- PART 2: User Taste Vectors View
-- Aggregates a user's preferences across all their movie AND TV show ratings
-- ============================================

CREATE OR REPLACE VIEW user_taste_vectors AS
WITH combined_ratings AS (
  -- Movie ratings
  SELECT 
    user_id,
    overall_score,
    dimension_scores,
    'movie' as media_type
  FROM user_movie_ratings
  
  UNION ALL
  
  -- TV show ratings  
  SELECT 
    user_id,
    overall_score,
    dimension_scores,
    'tv' as media_type
  FROM user_tv_show_ratings
),
user_aggregates AS (
  SELECT
    user_id,
    COUNT(*) as ratings_count,
    AVG(overall_score) as avg_rating,
    -- Dimension averages (only from ratings that have dimension_scores)
    AVG((dimension_scores->>'mood_match')::numeric) as avg_mood_match,
    AVG((dimension_scores->>'genre_fit')::numeric) as avg_genre_fit,
    AVG((dimension_scores->>'pacing_preference')::numeric) as avg_pacing_preference,
    AVG((dimension_scores->>'aesthetic_appreciation')::numeric) as avg_aesthetic_appreciation,
    AVG((dimension_scores->>'emotional_impact')::numeric) as avg_emotional_impact,
    AVG((dimension_scores->>'social_watchability')::numeric) as avg_social_watchability,
    AVG((dimension_scores->>'artistic_merit')::numeric) as avg_artistic_merit,
    AVG((dimension_scores->>'rewatchability')::numeric) as avg_rewatchability,
    AVG((dimension_scores->>'personal_resonance')::numeric) as avg_personal_resonance,
    -- Count of ratings with dimension data
    COUNT(dimension_scores) as dimension_ratings_count
  FROM combined_ratings
  GROUP BY user_id
)
SELECT * FROM user_aggregates;

-- ============================================
-- PART 3: Collective Taste Maps View
-- Aggregates all members' taste vectors for a collective
-- ============================================

CREATE OR REPLACE VIEW collective_taste_maps AS
WITH member_vectors AS (
  SELECT 
    cm.collective_id,
    utv.*
  FROM collective_memberships cm
  INNER JOIN user_taste_vectors utv ON cm.user_id = utv.user_id
)
SELECT
  collective_id,
  COUNT(DISTINCT user_id) as members_count,
  SUM(ratings_count) as total_ratings_count,
  AVG(avg_rating) as avg_rating,
  AVG(avg_mood_match) as avg_mood_match,
  AVG(avg_genre_fit) as avg_genre_fit,
  AVG(avg_pacing_preference) as avg_pacing_preference,
  AVG(avg_aesthetic_appreciation) as avg_aesthetic_appreciation,
  AVG(avg_emotional_impact) as avg_emotional_impact,
  AVG(avg_social_watchability) as avg_social_watchability,
  AVG(avg_artistic_merit) as avg_artistic_merit,
  AVG(avg_rewatchability) as avg_rewatchability,
  AVG(avg_personal_resonance) as avg_personal_resonance
FROM member_vectors
GROUP BY collective_id;

-- ============================================
-- PART 4: Film Signatures View (Movies)
-- Aggregates all user ratings for each movie
-- ============================================

CREATE OR REPLACE VIEW film_signatures AS
SELECT
  m.id as movie_id,
  m.tmdb_id,
  m.title,
  COUNT(umr.id) as ratings_count,
  AVG(umr.overall_score) as avg_rating,
  AVG((umr.dimension_scores->>'mood_match')::numeric) as avg_mood_match,
  AVG((umr.dimension_scores->>'genre_fit')::numeric) as avg_genre_fit,
  AVG((umr.dimension_scores->>'pacing_preference')::numeric) as avg_pacing_preference,
  AVG((umr.dimension_scores->>'aesthetic_appreciation')::numeric) as avg_aesthetic_appreciation,
  AVG((umr.dimension_scores->>'emotional_impact')::numeric) as avg_emotional_impact,
  AVG((umr.dimension_scores->>'social_watchability')::numeric) as avg_social_watchability,
  AVG((umr.dimension_scores->>'artistic_merit')::numeric) as avg_artistic_merit,
  AVG((umr.dimension_scores->>'rewatchability')::numeric) as avg_rewatchability,
  AVG((umr.dimension_scores->>'personal_resonance')::numeric) as avg_personal_resonance,
  COUNT(umr.dimension_scores) as dimension_ratings_count
FROM movies m
LEFT JOIN user_movie_ratings umr ON m.id = umr.movie_id
GROUP BY m.id, m.tmdb_id, m.title;

-- ============================================
-- PART 5: TV Show Signatures View
-- Aggregates all user ratings for each TV show
-- ============================================

CREATE OR REPLACE VIEW tv_show_signatures AS
SELECT
  ts.id as tv_show_id,
  ts.name as title,
  COUNT(utsr.id) as ratings_count,
  AVG(utsr.overall_score) as avg_rating,
  AVG((utsr.dimension_scores->>'mood_match')::numeric) as avg_mood_match,
  AVG((utsr.dimension_scores->>'genre_fit')::numeric) as avg_genre_fit,
  AVG((utsr.dimension_scores->>'pacing_preference')::numeric) as avg_pacing_preference,
  AVG((utsr.dimension_scores->>'aesthetic_appreciation')::numeric) as avg_aesthetic_appreciation,
  AVG((utsr.dimension_scores->>'emotional_impact')::numeric) as avg_emotional_impact,
  AVG((utsr.dimension_scores->>'social_watchability')::numeric) as avg_social_watchability,
  AVG((utsr.dimension_scores->>'artistic_merit')::numeric) as avg_artistic_merit,
  AVG((utsr.dimension_scores->>'rewatchability')::numeric) as avg_rewatchability,
  AVG((utsr.dimension_scores->>'personal_resonance')::numeric) as avg_personal_resonance,
  COUNT(utsr.dimension_scores) as dimension_ratings_count
FROM tv_shows ts
LEFT JOIN user_tv_show_ratings utsr ON ts.id = utsr.tv_show_id
GROUP BY ts.id, ts.name;

-- ============================================
-- PART 6: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_user_id ON user_movie_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_movie_id ON user_movie_ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_tv_show_ratings_user_id ON user_tv_show_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tv_show_ratings_tv_show_id ON user_tv_show_ratings(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_collective_memberships_collective_id ON collective_memberships(collective_id);
CREATE INDEX IF NOT EXISTS idx_collective_memberships_user_id ON collective_memberships(user_id);
