-- Drop the old unique constraint that doesn't include collective_id
ALTER TABLE feed_reactions DROP CONSTRAINT IF EXISTS feed_reactions_rating_id_user_id_reaction_type_key;

-- The new constraint with collective_id should already exist from script 014
-- If not, add it:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'feed_reactions_collective_unique'
  ) THEN
    ALTER TABLE feed_reactions 
    ADD CONSTRAINT feed_reactions_collective_unique 
    UNIQUE (rating_id, collective_id, user_id, reaction_type);
  END IF;
END $$;
