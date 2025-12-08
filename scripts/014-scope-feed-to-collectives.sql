-- Add collective_id to feed_comments and feed_reactions tables
-- to scope comments and reactions to specific collectives

-- Add collective_id to feed_comments
ALTER TABLE feed_comments 
ADD COLUMN IF NOT EXISTS collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE;

-- Add collective_id to feed_reactions
ALTER TABLE feed_reactions 
ADD COLUMN IF NOT EXISTS collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feed_comments_collective_id ON feed_comments(collective_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_rating_collective ON feed_comments(rating_id, collective_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_collective_id ON feed_reactions(collective_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_rating_collective ON feed_reactions(rating_id, collective_id);

-- Note: After running this migration, existing comments and reactions will have NULL collective_id
-- You may want to either:
-- 1. Delete existing comments/reactions: DELETE FROM feed_comments; DELETE FROM feed_reactions;
-- 2. Or update them if you know which collective they belong to
