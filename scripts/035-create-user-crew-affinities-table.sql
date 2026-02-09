CREATE TABLE user_crew_affinities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_id INT NOT NULL,
  person_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'actor')),
  avg_score NUMERIC NOT NULL,
  movie_count INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, person_id, role)
);

CREATE INDEX idx_crew_affinities_user ON user_crew_affinities(user_id, role);