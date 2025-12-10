-- Fix users where name was incorrectly set to email
-- This updates users where the name looks like an email (contains @)
-- Sets name to the display name portion (before @) or NULL

UPDATE users
SET name = NULL
WHERE name LIKE '%@%';

-- Also ensure any user without a name gets their name from their email prefix
-- This is handled by the COALESCE in queries, but we can set it explicitly for clarity
