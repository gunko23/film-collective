-- General Discussion Messages Table
-- Stores all messages for collective general discussions with WebSocket support
CREATE TABLE IF NOT EXISTS general_discussion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  gif_url TEXT,
  reply_to_id UUID REFERENCES general_discussion_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gdm_collective_created ON general_discussion_messages(collective_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdm_user ON general_discussion_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gdm_reply ON general_discussion_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- General Discussion Message Reactions Table
-- Stores emoji reactions for each message
CREATE TABLE IF NOT EXISTS general_discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES general_discussion_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Index for fast reaction lookups
CREATE INDEX IF NOT EXISTS idx_gdr_message ON general_discussion_reactions(message_id);

-- General Discussion Read Receipts
-- Tracks last read message per user per collective for unread counts
CREATE TABLE IF NOT EXISTS general_discussion_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES general_discussion_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collective_id, user_id)
);

-- General Discussion Typing Indicators
-- For real-time typing status (cleaned up by WebSocket)
CREATE TABLE IF NOT EXISTS general_discussion_typing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collective_id, user_id)
);

-- Index for typing cleanup
CREATE INDEX IF NOT EXISTS idx_gdt_updated ON general_discussion_typing(updated_at);
