-- Dynamic Rating Dimensions Schema Migration
-- This migration adds support for fully dynamic, configurable rating dimensions

-- ============================================
-- 1. Update rating_dimensions table with new columns
-- ============================================
ALTER TABLE rating_dimensions 
  ADD COLUMN IF NOT EXISTS ui_type text NOT NULL DEFAULT 'slider',
  ADD COLUMN IF NOT EXISTS min_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_value numeric DEFAULT 5,
  ADD COLUMN IF NOT EXISTS step numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================
-- 2. Create rating_dimension_options table for tag chips
-- ============================================
CREATE TABLE IF NOT EXISTS rating_dimension_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_dimension_id uuid NOT NULL REFERENCES rating_dimensions(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(rating_dimension_id, key)
);

-- ============================================
-- 3. Create movie_rating_dimension_configs table for per-movie config
-- ============================================
CREATE TABLE IF NOT EXISTS movie_rating_dimension_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating_dimension_id uuid NOT NULL REFERENCES rating_dimensions(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT false,
  weight numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(movie_id, rating_dimension_id)
);

-- ============================================
-- 4. Create tv_show_rating_dimension_configs table for per-show config
-- ============================================
CREATE TABLE IF NOT EXISTS tv_show_rating_dimension_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_show_id integer NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  rating_dimension_id uuid NOT NULL REFERENCES rating_dimensions(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT false,
  weight numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tv_show_id, rating_dimension_id)
);

-- ============================================
-- 5. Add dimension_tags and extra_notes to user_movie_ratings
-- ============================================
ALTER TABLE user_movie_ratings 
  ADD COLUMN IF NOT EXISTS dimension_tags jsonb,
  ADD COLUMN IF NOT EXISTS extra_notes text;

-- ============================================
-- 6. Add dimension_tags and extra_notes to user_tv_show_ratings
-- ============================================
ALTER TABLE user_tv_show_ratings 
  ADD COLUMN IF NOT EXISTS dimension_tags jsonb,
  ADD COLUMN IF NOT EXISTS extra_notes text;

-- ============================================
-- 7. Add dimension_tags and extra_notes to user_episode_ratings
-- ============================================
ALTER TABLE user_episode_ratings 
  ADD COLUMN IF NOT EXISTS dimension_tags jsonb,
  ADD COLUMN IF NOT EXISTS extra_notes text;

-- ============================================
-- 8. Clear existing rating_dimensions and seed with new schema
-- ============================================
DELETE FROM rating_dimensions;

INSERT INTO rating_dimensions (key, label, description, ui_type, min_value, max_value, step, weight_default, sort_order, is_active)
VALUES 
  ('emotional_impact', 'Emotional Impact', 'How strongly did this affect you emotionally?', 'slider', 0, 5, 1, 1.0, 1, true),
  ('pacing', 'Pacing', 'How well did the story flow and maintain your interest?', 'slider', 0, 5, 1, 1.0, 2, true),
  ('aesthetic', 'Aesthetic', 'How visually appealing and stylistically cohesive was it?', 'slider', 0, 5, 1, 1.0, 3, true),
  ('rewatchability', 'Rewatchability', 'How likely are you to watch this again?', 'slider', 0, 5, 1, 1.0, 4, true);

-- ============================================
-- 9. Create a "vibes" tag dimension with options
-- ============================================
INSERT INTO rating_dimensions (key, label, description, ui_type, min_value, max_value, step, weight_default, sort_order, is_active)
VALUES ('vibes', 'Vibes', 'Select tags that describe the feel of this movie/show', 'tags', NULL, NULL, NULL, 0.5, 5, true);

-- Get the vibes dimension id and insert options
DO $$
DECLARE
  vibes_id uuid;
BEGIN
  SELECT id INTO vibes_id FROM rating_dimensions WHERE key = 'vibes';
  
  INSERT INTO rating_dimension_options (rating_dimension_id, key, label, sort_order)
  VALUES
    (vibes_id, 'cozy', 'Cozy', 1),
    (vibes_id, 'intense', 'Intense', 2),
    (vibes_id, 'thought_provoking', 'Thought-Provoking', 3),
    (vibes_id, 'heartwarming', 'Heartwarming', 4),
    (vibes_id, 'dark', 'Dark', 5),
    (vibes_id, 'fun', 'Fun', 6),
    (vibes_id, 'slow_burn', 'Slow Burn', 7),
    (vibes_id, 'action_packed', 'Action-Packed', 8),
    (vibes_id, 'nostalgic', 'Nostalgic', 9),
    (vibes_id, 'unsettling', 'Unsettling', 10),
    (vibes_id, 'romantic', 'Romantic', 11),
    (vibes_id, 'feel_good', 'Feel Good', 12),
    (vibes_id, 'mind_bending', 'Mind-Bending', 13),
    (vibes_id, 'escapist', 'Escapist', 14),
    (vibes_id, 'heavy', 'Heavy', 15);
END $$;

-- ============================================
-- 10. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rating_dimension_options_dimension_id 
  ON rating_dimension_options(rating_dimension_id);
CREATE INDEX IF NOT EXISTS idx_movie_rating_dimension_configs_movie_id 
  ON movie_rating_dimension_configs(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_rating_dimension_configs_dimension_id 
  ON movie_rating_dimension_configs(rating_dimension_id);
CREATE INDEX IF NOT EXISTS idx_tv_show_rating_dimension_configs_show_id 
  ON tv_show_rating_dimension_configs(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_tv_show_rating_dimension_configs_dimension_id 
  ON tv_show_rating_dimension_configs(rating_dimension_id);
