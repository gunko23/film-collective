/**
 * OMDb Cache Layer
 * Caches OMDb scores in the movies table with 30-day TTL for success,
 * 7-day retry for failures. All data is internal-only for scoring.
 */

import { neon } from "@neondatabase/serverless"
import { fetchOmdbByImdbId } from "./omdb-service"

const sql = neon(process.env.DATABASE_URL!)

export type CachedOmdbScores = {
  movieId: number  // TMDB ID (movies.id)
  imdbRating: number | null
  imdbVotes: number | null
  rottenTomatoesScore: number | null
  metacriticScore: number | null
}

/**
 * Batch load cached OMDb scores for a list of TMDB IDs
 * Only returns rows where omdb_fetch_status = 'success' and cache hasn't expired (30 days)
 */
export async function batchGetCachedOmdbScores(tmdbIds: number[]): Promise<Map<number, CachedOmdbScores>> {
  if (tmdbIds.length === 0) return new Map()

  try {
    const result = await sql`
      SELECT
        id,
        imdb_rating,
        imdb_votes,
        rotten_tomatoes_score,
        metacritic_score
      FROM movies
      WHERE id = ANY(${tmdbIds}::int[])
        AND omdb_fetch_status = 'success'
        AND omdb_fetched_at > NOW() - INTERVAL '30 days'
    `

    const map = new Map<number, CachedOmdbScores>()
    for (const row of result) {
      map.set(row.id, {
        movieId: row.id,
        imdbRating: row.imdb_rating != null ? Number(row.imdb_rating) : null,
        imdbVotes: row.imdb_votes != null ? Number(row.imdb_votes) : null,
        rottenTomatoesScore: row.rotten_tomatoes_score != null ? Number(row.rotten_tomatoes_score) : null,
        metacriticScore: row.metacritic_score != null ? Number(row.metacritic_score) : null,
      })
    }
    return map
  } catch (error) {
    console.error("[OMDb Cache] Error batch loading scores:", error)
    return new Map()
  }
}

/**
 * Get TMDB IDs that need OMDb fetching:
 * - Have imdb_id but no omdb_fetched_at
 * - OR omdb_fetch_status = 'error' and omdb_fetched_at older than 7 days
 */
export async function getMoviesNeedingOmdbFetch(tmdbIds: number[]): Promise<{ tmdbId: number; imdbId: string }[]> {
  if (tmdbIds.length === 0) return []

  try {
    const result = await sql`
      SELECT id, imdb_id
      FROM movies
      WHERE id = ANY(${tmdbIds}::int[])
        AND imdb_id IS NOT NULL
        AND imdb_id != ''
        AND (
          omdb_fetched_at IS NULL
          OR (
            omdb_fetch_status = 'error'
            AND omdb_fetched_at < NOW() - INTERVAL '7 days'
          )
        )
    `
    return result.map((row: any) => ({
      tmdbId: row.id,
      imdbId: row.imdb_id,
    }))
  } catch (error) {
    console.error("[OMDb Cache] Error getting movies needing fetch:", error)
    return []
  }
}

/**
 * Fetch and cache OMDb scores for a single movie
 * Updates the movies table with results
 */
export async function fetchAndCacheOmdbScores(tmdbId: number, imdbId: string): Promise<CachedOmdbScores | null> {
  const ratings = await fetchOmdbByImdbId(imdbId)

  if (!ratings) {
    // Mark as error so we retry after 7 days
    try {
      await sql`
        UPDATE movies
        SET omdb_fetch_status = 'error',
            omdb_fetched_at = NOW()
        WHERE id = ${tmdbId}
      `
    } catch (e) {
      console.error(`[OMDb Cache] Error marking fetch failure for ${tmdbId}:`, e)
    }
    return null
  }

  try {
    await sql`
      UPDATE movies
      SET imdb_rating = ${ratings.imdbRating},
          imdb_votes = ${ratings.imdbVotes},
          rotten_tomatoes_score = ${ratings.rottenTomatoesScore},
          metacritic_score = ${ratings.metacriticScore},
          omdb_fetch_status = 'success',
          omdb_fetched_at = NOW()
      WHERE id = ${tmdbId}
    `

    return {
      movieId: tmdbId,
      imdbRating: ratings.imdbRating,
      imdbVotes: ratings.imdbVotes,
      rottenTomatoesScore: ratings.rottenTomatoesScore,
      metacriticScore: ratings.metacriticScore,
    }
  } catch (error) {
    console.error(`[OMDb Cache] Error caching scores for ${tmdbId}:`, error)
    return null
  }
}

/**
 * Background batch fetch: fetches OMDb for up to `limit` movies
 * Designed to be called fire-and-forget after returning recommendations
 * Adds 200ms delay between API calls to respect rate limits
 */
export async function backgroundFetchOmdbBatch(
  movies: { tmdbId: number; imdbId: string }[],
  limit: number = 10
): Promise<void> {
  const toFetch = movies.slice(0, limit)
  for (const movie of toFetch) {
    await fetchAndCacheOmdbScores(movie.tmdbId, movie.imdbId)
    // Rate limit: ~5 requests/second for free OMDb tier
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}
