-- Add gif_url column to feed_comments table
ALTER TABLE feed_comments ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Add more reaction types
-- The existing reaction_type column is already text so it can handle any emoji
