-- "Not Interested" feature: stores movies a user has permanently dismissed from recommendations.
-- Dismissed movies are excluded from all future recommendation results for that user.
-- For group picks, movies dismissed by ANY participant are excluded.

CREATE TABLE IF NOT EXISTS user_dismissed_movies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id   INTEGER NOT NULL,
  source     TEXT DEFAULT 'recommendation'
             CHECK (source IN ('recommendation', 'detail_page', 'feed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_udm_user ON user_dismissed_movies(user_id);
