-- Drop the foreign key constraint on feed_reactions.rating_id
-- This allows reactions to work on any rating type (movies, TV shows, or episodes)
-- since the rating ID can come from user_movie_ratings, user_tv_show_ratings, or user_episode_ratings

ALTER TABLE feed_reactions DROP CONSTRAINT IF EXISTS feed_reactions_rating_id_fkey;
