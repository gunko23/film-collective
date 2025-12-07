-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  overview TEXT,
  tagline TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  runtime INTEGER,
  vote_average REAL,
  vote_count INTEGER,
  popularity REAL,
  adult BOOLEAN DEFAULT FALSE,
  status TEXT,
  original_language TEXT,
  budget INTEGER,
  revenue INTEGER,
  imdb_id TEXT,
  homepage TEXT,
  production_companies JSONB,
  production_countries JSONB,
  spoken_languages JSONB,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create movie_genres junction table
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  profile_path TEXT,
  biography TEXT,
  birthday TEXT,
  deathday TEXT,
  place_of_birth TEXT,
  known_for_department TEXT,
  popularity REAL,
  imdb_id TEXT,
  homepage TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create movie_credits table
CREATE TABLE IF NOT EXISTS movie_credits (
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL,
  character TEXT,
  job TEXT,
  department TEXT,
  "order" INTEGER,
  PRIMARY KEY (movie_id, person_id, credit_type)
);

-- Create sync_log table
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  total_items INTEGER,
  error_message TEXT,
  metadata JSONB,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_movie_credits_person ON movie_credits(person_id);
