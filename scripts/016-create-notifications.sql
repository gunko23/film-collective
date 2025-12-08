-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'comment', 'reaction'
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_id UUID NOT NULL,
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  content TEXT, -- For comments: the comment text preview. For reactions: the emoji
  media_type TEXT, -- 'movie', 'tv', 'episode'
  media_title TEXT, -- Title of the movie/show/episode
  media_poster TEXT, -- Poster path for display
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
