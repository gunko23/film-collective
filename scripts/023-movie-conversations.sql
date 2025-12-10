-- Create movie_comments table for movie-based conversations
CREATE TABLE IF NOT EXISTS movie_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'movie', -- 'movie' or 'tv'
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for movie_comments
CREATE INDEX IF NOT EXISTS idx_movie_comments_collective_tmdb ON movie_comments(collective_id, tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_movie_comments_user ON movie_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_comments_created ON movie_comments(created_at DESC);

-- Create movie_comment_reactions table
CREATE TABLE IF NOT EXISTS movie_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES movie_comments(id) ON DELETE CASCADE,
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Create index for movie_comment_reactions
CREATE INDEX IF NOT EXISTS idx_movie_comment_reactions_comment ON movie_comment_reactions(comment_id);

-- Create typing indicators for movie conversations
CREATE TABLE IF NOT EXISTS movie_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'movie',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collective_id, tmdb_id, media_type, user_id)
);

-- Create index for movie_typing_indicators
CREATE INDEX IF NOT EXISTS idx_movie_typing_collective_tmdb ON movie_typing_indicators(collective_id, tmdb_id, media_type);
