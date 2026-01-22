-- Remove duplicate oscar nominations, keeping only one entry for each unique combination
DELETE FROM oscar_nominations a
USING oscar_nominations b
WHERE a.ceremony = b.ceremony
  AND a.category = b.category
  AND a.work_title = b.work_title
  AND COALESCE(a.nominee, '') = COALESCE(b.nominee, '')
  AND a.ctid > b.ctid;
