-- Parental Guide Cache Table
-- Stores IMDb parental guide severity ratings fetched from CinemagoerNG

CREATE TABLE IF NOT EXISTS parental_guide_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Movie identifiers (we store both for easy lookup)
    tmdb_id INTEGER UNIQUE NOT NULL,
    imdb_id TEXT,  -- e.g., "tt0133093" for The Matrix
    
    -- Severity ratings (None, Mild, Moderate, Severe, or null if not available)
    sex_nudity TEXT,
    violence TEXT,
    profanity TEXT,
    alcohol_drugs_smoking TEXT,
    frightening_intense TEXT,
    
    -- Vote counts for each category (optional, for transparency)
    sex_nudity_votes JSONB,       -- { "none": 5, "mild": 2, "moderate": 1, "severe": 0 }
    violence_votes JSONB,
    profanity_votes JSONB,
    alcohol_drugs_smoking_votes JSONB,
    frightening_intense_votes JSONB,
    
    -- Cache metadata
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fetch_source TEXT DEFAULT 'cinemagoerng',  -- 'cinemagoerng', 'kaggle', 'manual'
    fetch_error TEXT,  -- If fetch failed, store the error
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by TMDB ID
CREATE INDEX IF NOT EXISTS idx_parental_guide_tmdb_id ON parental_guide_cache(tmdb_id);

-- Index for fast lookups by IMDb ID
CREATE INDEX IF NOT EXISTS idx_parental_guide_imdb_id ON parental_guide_cache(imdb_id);

-- Index for finding stale cache entries
CREATE INDEX IF NOT EXISTS idx_parental_guide_fetched_at ON parental_guide_cache(fetched_at);

-- Comment on table
COMMENT ON TABLE parental_guide_cache IS 'Cache for IMDb parental guide severity ratings (sex/nudity, violence, profanity, etc.)';