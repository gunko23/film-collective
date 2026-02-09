/**
 * Movie Credits Backfill Script
 * Fetches TMDB credits for all movies in the DB that have credits_fetched_at IS NULL.
 * Populates director_ids, top_actor_ids, director_names, and actor_names.
 *
 * Usage:
 *   npx tsx scripts/backfill-movie-credits.ts [--limit 500] [--delay 200]
 *
 * TMDB rate limit: ~40 requests/10 seconds — default delay is 200ms for safety.
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "../lib/tmdb/client"

const sql = neon(process.env.DATABASE_URL!)

async function backfill() {
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf("--limit")
  const delayIndex = args.indexOf("--delay")

  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 500
  const delayMs = delayIndex >= 0 ? parseInt(args[delayIndex + 1], 10) : 200

  console.log(`[Credits Backfill] Starting with limit=${limit}, delay=${delayMs}ms`)

  const tmdb = createTMDBClient()
  if (!tmdb) {
    console.error("[Credits Backfill] TMDB client not available (missing API key?)")
    process.exit(1)
  }

  // Find movies needing credits
  const movies = await sql`
    SELECT tmdb_id, title
    FROM movies
    WHERE credits_fetched_at IS NULL
    ORDER BY tmdb_vote_count DESC NULLS LAST
    LIMIT ${limit}
  `

  console.log(`[Credits Backfill] Found ${movies.length} movies to process`)

  let success = 0
  let errors = 0

  // Process in batches of 10
  for (let i = 0; i < movies.length; i += 10) {
    const batch = movies.slice(i, i + 10)
    const batchProgress = `[${i + 1}-${Math.min(i + 10, movies.length)}/${movies.length}]`

    try {
      const creditResults = await Promise.all(
        batch.map((m: any) => tmdb.getMovieCredits(m.tmdb_id).catch(() => null))
      )

      for (let j = 0; j < batch.length; j++) {
        const movie = batch[j]
        const credits = creditResults[j]

        if (!credits) {
          errors++
          console.log(`${batchProgress} ${movie.title}: No credits found`)
          // Mark as fetched to avoid retrying
          await sql`
            UPDATE movies
            SET credits_fetched_at = NOW(),
                director_ids = '[]'::jsonb,
                top_actor_ids = '[]'::jsonb,
                director_names = '{}'::jsonb,
                actor_names = '{}'::jsonb
            WHERE tmdb_id = ${movie.tmdb_id}
          `
          continue
        }

        const directorIds = credits.crew
          .filter((c: any) => c.job === "Director")
          .map((c: any) => c.id)

        const topCast = credits.cast
          .sort((a: any, b: any) => a.order - b.order)
          .slice(0, 3)

        const topActorIds = topCast.map((a: any) => a.id)

        const directorNames: Record<number, string> = {}
        for (const c of credits.crew) {
          if (c.job === "Director") directorNames[c.id] = c.name
        }

        const actorNames: Record<number, string> = {}
        for (const a of topCast) {
          actorNames[a.id] = a.name
        }

        await sql`
          UPDATE movies
          SET director_ids = ${JSON.stringify(directorIds)}::jsonb,
              top_actor_ids = ${JSON.stringify(topActorIds)}::jsonb,
              director_names = ${JSON.stringify(directorNames)}::jsonb,
              actor_names = ${JSON.stringify(actorNames)}::jsonb,
              credits_fetched_at = NOW()
          WHERE tmdb_id = ${movie.tmdb_id}
        `

        success++
        const dirNames = Object.values(directorNames).join(", ") || "Unknown"
        console.log(`${batchProgress} ${movie.title}: Directors=[${dirNames}], Actors=${topActorIds.length}`)
      }
    } catch (error) {
      errors += batch.length
      console.error(`${batchProgress} Batch error:`, error instanceof Error ? error.message : error)
    }

    // Rate limit between batches
    if (i + 10 < movies.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.log(`\n[Credits Backfill] Complete:`)
  console.log(`  Success: ${success}`)
  console.log(`  Errors:  ${errors}`)
  console.log(`  Total:   ${movies.length}`)
}

backfill().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
