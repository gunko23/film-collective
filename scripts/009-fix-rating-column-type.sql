-- Fix the overall_score column type to allow values up to 100
-- The column was likely defined as numeric(3,2) which only allows up to 9.99

-- Update user_tv_show_ratings overall_score column type
ALTER TABLE user_tv_show_ratings 
ALTER COLUMN overall_score TYPE numeric(5,2);

-- Update user_episode_ratings overall_score column type  
ALTER TABLE user_episode_ratings 
ALTER COLUMN overall_score TYPE numeric(5,2);

-- Now you can update existing data (multiply by 20 to convert 0-5 to 0-100 scale):
-- UPDATE user_tv_show_ratings SET overall_score = overall_score * 20;
-- UPDATE user_episode_ratings SET overall_score = overall_score * 20;
