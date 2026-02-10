-- Change scheduled_for from DATE to TEXT so we store labels like 'Tonight', 'This Week', 'This Weekend'
ALTER TABLE planned_watches ALTER COLUMN scheduled_for TYPE TEXT USING scheduled_for::TEXT;
