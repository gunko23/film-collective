-- Change overall_score columns from numeric/decimal to integer to match user_ratings table

-- First, update any existing decimal values to whole numbers (round them)
UPDATE user_tv_show_ratings SET overall_score = ROUND(overall_score);
UPDATE user_episode_ratings SET overall_score = ROUND(overall_score);

-- Alter user_tv_show_ratings.overall_score to integer
ALTER TABLE user_tv_show_ratings 
ALTER COLUMN overall_score TYPE integer USING overall_score::integer;

-- Alter user_episode_ratings.overall_score to integer  
ALTER TABLE user_episode_ratings 
ALTER COLUMN overall_score TYPE integer USING overall_score::integer;

-- Update the CHECK constraints for integer type (0-100 range)
ALTER TABLE user_tv_show_ratings DROP CONSTRAINT IF EXISTS user_tv_show_ratings_overall_score_check;
ALTER TABLE user_tv_show_ratings ADD CONSTRAINT user_tv_show_ratings_overall_score_check 
  CHECK (overall_score >= 0 AND overall_score <= 100);

ALTER TABLE user_episode_ratings DROP CONSTRAINT IF EXISTS user_episode_ratings_overall_score_check;
ALTER TABLE user_episode_ratings ADD CONSTRAINT user_episode_ratings_overall_score_check 
  CHECK (overall_score >= 0 AND overall_score <= 100);
