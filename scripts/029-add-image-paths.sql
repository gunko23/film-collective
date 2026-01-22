-- Add poster_path and profile_path columns to store TMDB image paths
ALTER TABLE oscar_nominations 
ADD COLUMN IF NOT EXISTS poster_path TEXT,
ADD COLUMN IF NOT EXISTS profile_path TEXT;
