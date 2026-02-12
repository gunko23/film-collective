-- Make rating_id nullable on notifications table
-- Discussion messages and "started watching" notifications don't have a rating
ALTER TABLE notifications ALTER COLUMN rating_id DROP NOT NULL;
