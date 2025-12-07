-- Collective invites table for invite links
CREATE TABLE IF NOT EXISTS collective_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast invite code lookups
CREATE INDEX IF NOT EXISTS idx_collective_invites_code ON collective_invites(invite_code);
