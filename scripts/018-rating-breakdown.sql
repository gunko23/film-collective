-- Add breakdown columns to user_movie_ratings
ALTER TABLE user_movie_ratings
ADD COLUMN IF NOT EXISTS emotional_impact INTEGER CHECK (emotional_impact >= 1 AND emotional_impact <= 5),
ADD COLUMN IF NOT EXISTS pacing INTEGER CHECK (pacing >= 1 AND pacing <= 5),
ADD COLUMN IF NOT EXISTS aesthetic INTEGER CHECK (aesthetic >= 1 AND aesthetic <= 5),
ADD COLUMN IF NOT EXISTS rewatchability INTEGER CHECK (rewatchability >= 1 AND rewatchability <= 5),
ADD COLUMN IF NOT EXISTS breakdown_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown_notes TEXT;

-- Add breakdown columns to user_tv_show_ratings
ALTER TABLE user_tv_show_ratings
ADD COLUMN IF NOT EXISTS emotional_impact INTEGER CHECK (emotional_impact >= 1 AND emotional_impact <= 5),
ADD COLUMN IF NOT EXISTS pacing INTEGER CHECK (pacing >= 1 AND pacing <= 5),
ADD COLUMN IF NOT EXISTS aesthetic INTEGER CHECK (aesthetic >= 1 AND aesthetic <= 5),
ADD COLUMN IF NOT EXISTS rewatchability INTEGER CHECK (rewatchability >= 1 AND rewatchability <= 5),
ADD COLUMN IF NOT EXISTS breakdown_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown_notes TEXT;

-- Create user_rating_preferences table for skip_breakdown preference
CREATE TABLE IF NOT EXISTS user_rating_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skip_breakdown BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_rating_preferences_user_id ON user_rating_preferences(user_id);
