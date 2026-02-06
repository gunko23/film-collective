-- User streaming service preferences
-- Stores which streaming services each user subscribes to
-- Provider IDs match TMDB watch provider IDs

CREATE TABLE IF NOT EXISTS user_streaming_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL,       -- TMDB watch provider ID (e.g. 8 = Netflix, 337 = Disney+)
  provider_name TEXT NOT NULL,         -- Human-readable name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_user_streaming_services_user_id
  ON user_streaming_services(user_id);
