-- Create user favorite movies table for top 3 picks
CREATE TABLE IF NOT EXISTS user_favorite_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date DATE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position),
  UNIQUE(user_id, tmdb_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_favorite_movies_user_id ON user_favorite_movies(user_id);
