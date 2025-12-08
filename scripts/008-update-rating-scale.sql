-- Update user_tv_show_ratings to use 0-100 scale like movies
-- First, drop the existing CHECK constraint
ALTER TABLE user_tv_show_ratings 
DROP CONSTRAINT IF EXISTS user_tv_show_ratings_overall_score_check;

-- Add new CHECK constraint for 0-100 scale
ALTER TABLE user_tv_show_ratings 
ADD CONSTRAINT user_tv_show_ratings_overall_score_check 
CHECK (overall_score >= 0 AND overall_score <= 100);

-- Update user_episode_ratings to use 0-100 scale like movies
-- First, drop the existing CHECK constraint
ALTER TABLE user_episode_ratings 
DROP CONSTRAINT IF EXISTS user_episode_ratings_overall_score_check;

-- Add new CHECK constraint for 0-100 scale
ALTER TABLE user_episode_ratings 
ADD CONSTRAINT user_episode_ratings_overall_score_check 
CHECK (overall_score >= 0 AND overall_score <= 100);

-- After running this migration, you can update existing data:
-- UPDATE user_tv_show_ratings SET overall_score = overall_score * 20;
-- UPDATE user_episode_ratings SET overall_score = overall_score * 20;
