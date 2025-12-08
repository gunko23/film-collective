-- Drop the foreign key constraint that only references user_movie_ratings
-- Comments should work for movies, TV shows, and episodes
ALTER TABLE feed_comments DROP CONSTRAINT IF EXISTS feed_comments_rating_id_fkey;

-- The rating_id column will now just be a UUID without a foreign key
-- This allows comments on any type of rating (movie, TV show, or episode)
-- We validate the rating exists in application code instead
