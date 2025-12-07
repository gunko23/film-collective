-- Film Collective New Schema Migration
-- Run this to set up the new architecture

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. COLLECTIVES AND MEMBERSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS collectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collective_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collective_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collective_memberships_user ON collective_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_collective_memberships_collective ON collective_memberships(collective_id);

-- ============================================
-- 3. MOVIES (cached from TMDB on-demand)
-- ============================================
-- Drop old movies table dependencies first
DROP TABLE IF EXISTS movie_credits CASCADE;
DROP TABLE IF EXISTS movie_genres CASCADE;
DROP TABLE IF EXISTS user_ratings CASCADE;

-- Recreate movies table with new schema
DROP TABLE IF EXISTS movies CASCADE;

CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  original_title TEXT,
  overview TEXT,
  release_date DATE,
  runtime_minutes INTEGER,
  poster_path TEXT,
  backdrop_path TEXT,
  original_language TEXT,
  genres JSONB, -- Array of { id, name } from TMDB
  tmdb_popularity NUMERIC,
  tmdb_vote_average NUMERIC,
  tmdb_vote_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

-- ============================================
-- 4. RATING DIMENSIONS CATALOG
-- ============================================
CREATE TABLE IF NOT EXISTS rating_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  weight_default NUMERIC DEFAULT 1.0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed rating dimensions
INSERT INTO rating_dimensions (key, label, description, weight_default, sort_order) VALUES
  ('mood_match', 'Mood Match', 'How well did this movie match the mood you were looking for?', 1.0, 1),
  ('genre_fit', 'Genre Fit', 'How well did it execute on its genre expectations?', 1.0, 2),
  ('pacing', 'Pacing', 'Was the movie well-paced? Did it hold your attention?', 1.0, 3),
  ('aesthetic_appreciation', 'Aesthetic', 'Visual style, cinematography, and overall look', 1.0, 4),
  ('emotional_impact', 'Emotional Impact', 'Did it make you feel something?', 1.2, 5),
  ('social_watchability', 'Social Watchability', 'Would you recommend watching this with others?', 0.8, 6),
  ('artistic_merit', 'Artistic Merit', 'Craft, direction, acting, and technical execution', 1.1, 7),
  ('rewatchability', 'Rewatchability', 'Would you watch this again?', 0.9, 8),
  ('personal_resonance', 'Personal Resonance', 'Did it connect with you personally?', 1.2, 9)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  weight_default = EXCLUDED.weight_default,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- 5. USER MOVIE RATINGS (multi-dimensional)
-- ============================================
CREATE TABLE IF NOT EXISTS user_movie_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  dimension_scores JSONB, -- { "mood_match": 85, "pacing": 70, ... }
  user_comment TEXT,
  ai_explanation TEXT,
  ai_tags JSONB, -- ["cozy", "heist", "found_family"]
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_user ON user_movie_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_ratings_movie ON user_movie_ratings(movie_id);

-- ============================================
-- 6. WATCHLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_watchlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist_entries(user_id);

CREATE TABLE IF NOT EXISTS collective_watchlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collective_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_collective_watchlist_collective ON collective_watchlist_entries(collective_id);

-- ============================================
-- 7. CLEANUP OLD TABLES (optional - keep for reference)
-- ============================================
-- The following tables from the old schema are no longer needed:
-- - genres (genres now stored as JSONB in movies)
-- - movie_genres (junction table no longer needed)
-- - people (not used in new schema)
-- - movie_credits (not used in new schema)
-- - sync_log (new on-demand strategy doesn't need bulk sync)

-- Optionally drop them:
-- DROP TABLE IF EXISTS genres CASCADE;
-- DROP TABLE IF EXISTS people CASCADE;
-- DROP TABLE IF EXISTS sync_log CASCADE;
