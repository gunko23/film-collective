-- TV Shows table (similar structure to movies)
CREATE TABLE IF NOT EXISTS tv_shows (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT,
  overview TEXT,
  tagline TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  first_air_date DATE,
  last_air_date DATE,
  number_of_seasons INTEGER,
  number_of_episodes INTEGER,
  episode_run_time INTEGER[],
  status TEXT,
  type TEXT,
  vote_average NUMERIC(3,1),
  vote_count INTEGER,
  popularity NUMERIC(10,3),
  original_language TEXT,
  origin_country TEXT[],
  genres JSONB,
  networks JSONB,
  production_companies JSONB,
  created_by JSONB,
  homepage TEXT,
  in_production BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TV Show Seasons table
CREATE TABLE IF NOT EXISTS tv_seasons (
  id INTEGER PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  name TEXT,
  overview TEXT,
  poster_path TEXT,
  air_date DATE,
  episode_count INTEGER,
  vote_average NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tv_show_id, season_number)
);

-- TV Show Episodes table
CREATE TABLE IF NOT EXISTS tv_episodes (
  id INTEGER PRIMARY KEY,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  season_id INTEGER REFERENCES tv_seasons(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  name TEXT,
  overview TEXT,
  still_path TEXT,
  air_date DATE,
  runtime INTEGER,
  vote_average NUMERIC(3,1),
  vote_count INTEGER,
  crew JSONB,
  guest_stars JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tv_show_id, season_number, episode_number)
);

-- TV Show ratings table
CREATE TABLE IF NOT EXISTS user_tv_show_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  overall_score NUMERIC(2,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
  user_comment TEXT,
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tv_show_id)
);

-- Episode ratings table
CREATE TABLE IF NOT EXISTS user_episode_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id INTEGER NOT NULL REFERENCES tv_episodes(id) ON DELETE CASCADE,
  tv_show_id INTEGER NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
  overall_score NUMERIC(2,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
  user_comment TEXT,
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- Indexes for TV shows
CREATE INDEX IF NOT EXISTS idx_tv_shows_popularity ON tv_shows(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_tv_shows_vote_average ON tv_shows(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_tv_shows_first_air_date ON tv_shows(first_air_date DESC);
CREATE INDEX IF NOT EXISTS idx_tv_seasons_show ON tv_seasons(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_tv_episodes_show ON tv_episodes(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_tv_episodes_season ON tv_episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_user_tv_show_ratings_user ON user_tv_show_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tv_show_ratings_show ON user_tv_show_ratings(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_user_episode_ratings_user ON user_episode_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_episode_ratings_episode ON user_episode_ratings(episode_id);
