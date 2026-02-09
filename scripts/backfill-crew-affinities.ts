/**
 * Crew Affinities Backfill Script
 * Populates user_crew_affinities for all users who have rated movies.
 *
 * Usage:
 *   npx tsx scripts/backfill-crew-affinities.ts
 *
 * NOTE: Run backfill-movie-credits.ts FIRST so that movie credits are cached.
 *       rebuildUserCrewAffinities needs credits data on the movies table.
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import { neon } from "@neondatabase/serverless"
import { rebuildUserCrewAffinities } from "../lib/recommendations/crew-affinity-service"

const sql = neon(process.env.DATABASE_URL!)

async function backfill() {
  console.log("[Crew Affinities Backfill] Starting...")

  // Get all distinct user IDs who have rated movies
  const users = await sql`
    SELECT DISTINCT user_id
    FROM user_movie_ratings
    ORDER BY user_id
  `

  console.log(`[Crew Affinities Backfill] Found ${users.length} users with ratings`)

  let success = 0
  let errors = 0

  for (let i = 0; i < users.length; i++) {
    const userId = users[i].user_id
    const progress = `[${i + 1}/${users.length}]`

    try {
      await rebuildUserCrewAffinities(userId)
      success++
      console.log(`${progress} Rebuilt affinities for user ${userId}`)
    } catch (error) {
      errors++
      console.error(`${progress} Error for user ${userId}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`\n[Crew Affinities Backfill] Complete:`)
  console.log(`  Success: ${success}`)
  console.log(`  Errors:  ${errors}`)
  console.log(`  Total:   ${users.length}`)
}

backfill().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
