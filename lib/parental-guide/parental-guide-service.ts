/**
 * Parental Guide Service
 * 
 * Provides IMDb parental guide severity ratings (sex/nudity, violence, profanity, etc.)
 * from a pre-populated database cache.
 * 
 * DATA SOURCE:
 * The cache is populated from the Kaggle IMDb Parental Guide dataset:
 * https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide
 * 
 * Use the import script at scripts/import-kaggle-parental-guide.js to populate the cache.
 * 
 * This is a CACHE-ONLY service - it does NOT scrape IMDb directly.
 * If parental guide data is missing for a movie, it simply returns null.
 */

import { sql } from "@/lib/db"

// ============================================
// TYPES
// ============================================

export type SeverityLevel = "None" | "Mild" | "Moderate" | "Severe" | null

export type ParentalGuideResult = {
  tmdbId: number
  imdbId?: string | null
  sexNudity: SeverityLevel
  violence: SeverityLevel
  profanity: SeverityLevel
  alcoholDrugsSmoking: SeverityLevel
  frighteningIntense: SeverityLevel
  fetchedAt?: Date | string | null
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get parental guide data for a movie from the cache
 * Returns null if not in cache (no external fetching)
 */
export async function getParentalGuide(tmdbId: number): Promise<ParentalGuideResult | null> {
  try {
    const result = await sql`
      SELECT 
        tmdb_id as "tmdbId",
        imdb_id as "imdbId",
        sex_nudity as "sexNudity",
        violence,
        profanity,
        alcohol_drugs_smoking as "alcoholDrugsSmoking",
        frightening_intense as "frighteningIntense",
        fetched_at as "fetchedAt"
      FROM parental_guide_cache
      WHERE tmdb_id = ${tmdbId}
    `
    
    return (result[0] as ParentalGuideResult) || null
  } catch (error) {
    // Table might not exist yet - fail gracefully
    console.error("Error fetching parental guide:", error)
    return null
  }
}

/**
 * Get parental guide data for multiple movies at once (cache-only)
 * Optimized for batch lookups (e.g., Tonight's Pick recommendations)
 */
export async function getParentalGuideBatch(
  movies: Array<{ tmdbId: number; imdbId?: string }>
): Promise<Map<number, ParentalGuideResult>> {
  const tmdbIds = movies.map(m => m.tmdbId)
  
  if (tmdbIds.length === 0) return new Map()
  
  try {
    const result = await sql`
      SELECT 
        tmdb_id as "tmdbId",
        imdb_id as "imdbId",
        sex_nudity as "sexNudity",
        violence,
        profanity,
        alcohol_drugs_smoking as "alcoholDrugsSmoking",
        frightening_intense as "frighteningIntense",
        fetched_at as "fetchedAt"
      FROM parental_guide_cache
      WHERE tmdb_id = ANY(${tmdbIds})
    `
    
    const map = new Map<number, ParentalGuideResult>()
    for (const row of result) {
      map.set((row as ParentalGuideResult).tmdbId, row as ParentalGuideResult)
    }
    
    return map
  } catch (error) {
    // Table might not exist yet - fail gracefully
    console.error("Error fetching parental guide batch:", error)
    return new Map()
  }
}

/**
 * Bulk insert parental guide data (for importing from Kaggle dataset)
 */
export async function bulkInsertParentalGuide(
  data: Array<{
    tmdbId: number
    imdbId?: string
    sexNudity?: string
    violence?: string
    profanity?: string
    alcoholDrugsSmoking?: string
    frighteningIntense?: string
  }>
): Promise<{ inserted: number; failed: number }> {
  let inserted = 0
  let failed = 0
  
  for (const item of data) {
    try {
      await sql`
        INSERT INTO parental_guide_cache (
          tmdb_id,
          imdb_id,
          sex_nudity,
          violence,
          profanity,
          alcohol_drugs_smoking,
          frightening_intense,
          fetched_at,
          fetch_source
        ) VALUES (
          ${item.tmdbId},
          ${item.imdbId || null},
          ${normalizeSeverity(item.sexNudity)},
          ${normalizeSeverity(item.violence)},
          ${normalizeSeverity(item.profanity)},
          ${normalizeSeverity(item.alcoholDrugsSmoking)},
          ${normalizeSeverity(item.frighteningIntense)},
          NOW(),
          'kaggle'
        )
        ON CONFLICT (tmdb_id) DO UPDATE SET
          imdb_id = EXCLUDED.imdb_id,
          sex_nudity = EXCLUDED.sex_nudity,
          violence = EXCLUDED.violence,
          profanity = EXCLUDED.profanity,
          alcohol_drugs_smoking = EXCLUDED.alcohol_drugs_smoking,
          frightening_intense = EXCLUDED.frightening_intense,
          fetched_at = NOW(),
          fetch_source = EXCLUDED.fetch_source,
          updated_at = NOW()
      `
      inserted++
    } catch (error) {
      console.error(`Failed to insert parental guide for TMDB ${item.tmdbId}:`, error)
      failed++
    }
  }
  
  return { inserted, failed }
}

/**
 * Get cache statistics
 */
export async function getParentalGuideCacheStats(): Promise<{
  totalCached: number
  bySource: Record<string, number>
  oldestEntry: Date | null
  newestEntry: Date | null
}> {
  try {
    const [countResult] = await sql`
      SELECT COUNT(*) as count FROM parental_guide_cache
    `
    
    const sourceResult = await sql`
      SELECT fetch_source, COUNT(*) as count 
      FROM parental_guide_cache 
      GROUP BY fetch_source
    `
    
    const [dateResult] = await sql`
      SELECT 
        MIN(fetched_at) as oldest,
        MAX(fetched_at) as newest
      FROM parental_guide_cache
    `
    
    const bySource: Record<string, number> = {}
    for (const row of sourceResult) {
      const r = row as { fetch_source: string | null; count: string }
      bySource[r.fetch_source || 'unknown'] = Number(r.count)
    }
    
    return {
      totalCached: Number((countResult as { count: string }).count),
      bySource,
      oldestEntry: (dateResult as { oldest: Date | null }).oldest,
      newestEntry: (dateResult as { newest: Date | null }).newest,
    }
  } catch (error) {
    console.error("Error fetching parental guide stats:", error)
    return {
      totalCached: 0,
      bySource: {},
      oldestEntry: null,
      newestEntry: null,
    }
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Normalize severity string to standard format
 * Handles various formats from different data sources
 */
function normalizeSeverity(value: string | null | undefined): SeverityLevel {
  if (value === null || value === undefined) return null
  
  const normalized = value.toString().toLowerCase().trim()
  
  // Empty string means no data
  if (normalized === '') return null
  
  // Check for "None" variations
  if (normalized === 'none' || normalized === 'n/a' || normalized === 'na') {
    return 'None'
  }
  
  // Check for severity levels
  if (normalized === 'mild' || normalized === '1') {
    return 'Mild'
  }
  if (normalized === 'moderate' || normalized === '2') {
    return 'Moderate'
  }
  if (normalized === 'severe' || normalized === '3') {
    return 'Severe'
  }
  
  // If it's some other value, log it and return null
  console.warn(`Unknown severity value: "${value}"`)
  return null
}