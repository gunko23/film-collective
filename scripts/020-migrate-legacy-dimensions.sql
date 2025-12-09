-- Migration script to convert legacy per-column dimensions to JSON format
-- Run this ONCE to migrate existing data

-- ============================================
-- Migrate user_movie_ratings legacy columns to dimension_scores JSON
-- ============================================
UPDATE user_movie_ratings
SET dimension_scores = jsonb_build_object(
  'emotional_impact', COALESCE(emotional_impact, 0),
  'pacing', COALESCE(pacing, 0),
  'aesthetic', COALESCE(aesthetic, 0),
  'rewatchability', COALESCE(rewatchability, 0)
)
WHERE dimension_scores IS NULL 
  AND (emotional_impact IS NOT NULL 
    OR pacing IS NOT NULL 
    OR aesthetic IS NOT NULL 
    OR rewatchability IS NOT NULL);

-- ============================================
-- Migrate user_tv_show_ratings legacy columns to dimension_scores JSON
-- ============================================
UPDATE user_tv_show_ratings
SET dimension_scores = jsonb_build_object(
  'emotional_impact', COALESCE(emotional_impact, 0),
  'pacing', COALESCE(pacing, 0),
  'aesthetic', COALESCE(aesthetic, 0),
  'rewatchability', COALESCE(rewatchability, 0)
)
WHERE dimension_scores IS NULL 
  AND (emotional_impact IS NOT NULL 
    OR pacing IS NOT NULL 
    OR aesthetic IS NOT NULL 
    OR rewatchability IS NOT NULL);

-- ============================================
-- Migrate breakdown_tags to dimension_tags format
-- ============================================
UPDATE user_movie_ratings
SET dimension_tags = jsonb_build_object('vibes', breakdown_tags)
WHERE breakdown_tags IS NOT NULL 
  AND dimension_tags IS NULL;

UPDATE user_tv_show_ratings
SET dimension_tags = jsonb_build_object('vibes', breakdown_tags)
WHERE breakdown_tags IS NOT NULL 
  AND dimension_tags IS NULL;

-- ============================================
-- Migrate breakdown_notes to extra_notes
-- ============================================
UPDATE user_movie_ratings
SET extra_notes = breakdown_notes
WHERE breakdown_notes IS NOT NULL 
  AND extra_notes IS NULL;

UPDATE user_tv_show_ratings
SET extra_notes = breakdown_notes
WHERE breakdown_notes IS NOT NULL 
  AND extra_notes IS NULL;
