-- Migration: Add planned_watches and planned_watch_participants tables
-- Run against Neon PostgreSQL

CREATE TABLE planned_watches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id      INTEGER NOT NULL,
  movie_title   TEXT NOT NULL,
  movie_year    INTEGER,
  movie_poster  TEXT,
  created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collective_id UUID REFERENCES collectives(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned', 'watching', 'watched', 'cancelled')),
  scheduled_for DATE,
  locked_in_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watched_at    TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  source        TEXT DEFAULT 'tonights_pick'
                CHECK (source IN ('tonights_pick', 'manual', 'recommendation')),
  mood_tags     TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pw_created_by ON planned_watches(created_by);
CREATE INDEX idx_pw_collective ON planned_watches(collective_id);
CREATE INDEX idx_pw_status ON planned_watches(status);
CREATE INDEX idx_pw_movie ON planned_watches(movie_id);
CREATE INDEX idx_pw_locked_in ON planned_watches(locked_in_at DESC);

CREATE TABLE planned_watch_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_watch_id UUID NOT NULL REFERENCES planned_watches(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rsvp_status      TEXT NOT NULL DEFAULT 'confirmed'
                   CHECK (rsvp_status IN ('confirmed', 'maybe', 'declined')),
  added_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(planned_watch_id, user_id)
);

CREATE INDEX idx_pwp_user ON planned_watch_participants(user_id);
CREATE INDEX idx_pwp_watch ON planned_watch_participants(planned_watch_id);
