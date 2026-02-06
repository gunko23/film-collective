/**
 * OMDb Backfill Script
 * Fetches OMDb scores for all movies in the DB that have an imdb_id but no OMDb data
 *
 * Usage:
 *   npx tsx scripts/backfill-omdb-scores.ts [--limit 950] [--delay 200]
 *
 * Free OMDb tier: 1,000 requests/day — default limit is 950 for safety
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import { neon } from "@neondatabase/serverless"
import { fetchOmdbByImdbId } from "../lib/omdb/omdb-service"

const sql = neon(process.env.DATABASE_URL!)

async function backfill() {
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf("--limit")
  const delayIndex = args.indexOf("--delay")

  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 950
  const delayMs = delayIndex >= 0 ? parseInt(args[delayIndex + 1], 10) : 200

  console.log(`[OMDb Backfill] Starting with limit=${limit}, delay=${delayMs}ms`)

  // Find movies needing OMDb fetch
  const movies = await sql`
    SELECT id, imdb_id, title
    FROM movies
    WHERE imdb_id IS NOT NULL
      AND imdb_id != ''
      AND (
        omdb_fetched_at IS NULL
        OR (
          omdb_fetch_status = 'error'
          AND omdb_fetched_at < NOW() - INTERVAL '7 days'
        )
      )
    ORDER BY tmdb_vote_count DESC NULLS LAST
    LIMIT ${limit}
  `

  console.log(`[OMDb Backfill] Found ${movies.length} movies to process`)

  let success = 0
  let errors = 0
  let empty = 0

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i]
    const progress = `[${i + 1}/${movies.length}]`

    try {
      const ratings = await fetchOmdbByImdbId(movie.imdb_id)

      if (ratings) {
        await sql`
          UPDATE movies
          SET imdb_rating = ${ratings.imdbRating},
              imdb_votes = ${ratings.imdbVotes},
              rotten_tomatoes_score = ${ratings.rottenTomatoesScore},
              metacritic_score = ${ratings.metacriticScore},
              omdb_fetch_status = 'success',
              omdb_fetched_at = NOW()
          WHERE id = ${movie.id}
        `
        success++
        console.log(`${progress} ${movie.title}: IMDb=${ratings.imdbRating} RT=${ratings.rottenTomatoesScore}% MC=${ratings.metacriticScore}`)
      } else {
        await sql`
          UPDATE movies
          SET omdb_fetch_status = 'error',
              omdb_fetched_at = NOW()
          WHERE id = ${movie.id}
        `
        empty++
        console.log(`${progress} ${movie.title}: No data found`)
      }
    } catch (error) {
      errors++
      console.error(`${progress} ${movie.title}: Error -`, error instanceof Error ? error.message : error)

      await sql`
        UPDATE movies
        SET omdb_fetch_status = 'error',
            omdb_fetched_at = NOW()
        WHERE id = ${movie.id}
      `.catch(() => {})
    }

    // Rate limit
    if (i < movies.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.log(`\n[OMDb Backfill] Complete:`)
  console.log(`  Success: ${success}`)
  console.log(`  No data: ${empty}`)
  console.log(`  Errors:  ${errors}`)
  console.log(`  Total:   ${movies.length}`)
}

backfill().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
