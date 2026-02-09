/**
 * IMDb ID Backfill Script
 * Copies imdb_id from parental_guide_cache to movies table, matching on tmdb_id.
 * This enables the OMDb backfill script to fetch critic scores for more movies.
 *
 * Usage:
 *   npx tsx scripts/backfill-imdb-ids.ts [--dry-run]
 *
 * Run with --dry-run first to see how many rows would be updated without making changes.
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function backfill() {
  const dryRun = process.argv.includes("--dry-run")

  // Check how many movies are missing imdb_id but have a match in parental_guide_cache
  const preview = await sql`
    SELECT COUNT(*) as match_count
    FROM movies m
    JOIN parental_guide_cache pgc ON pgc.tmdb_id = m.tmdb_id
    WHERE (m.imdb_id IS NULL OR m.imdb_id = '')
      AND pgc.imdb_id IS NOT NULL
      AND pgc.imdb_id != ''
  `

  const matchCount = Number(preview[0].match_count)
  console.log(`[IMDb Backfill] Found ${matchCount} movies missing imdb_id that have a match in parental_guide_cache`)

  if (matchCount === 0) {
    console.log("[IMDb Backfill] Nothing to update.")
    return
  }

  if (dryRun) {
    // Show a sample of what would be updated
    const sample = await sql`
      SELECT m.tmdb_id, m.title, pgc.imdb_id
      FROM movies m
      JOIN parental_guide_cache pgc ON pgc.tmdb_id = m.tmdb_id
      WHERE (m.imdb_id IS NULL OR m.imdb_id = '')
        AND pgc.imdb_id IS NOT NULL
        AND pgc.imdb_id != ''
      ORDER BY m.tmdb_id
      LIMIT 20
    `

    console.log("\n[IMDb Backfill] Sample of rows that would be updated:")
    for (const row of sample) {
      console.log(`  ${row.title} (tmdb:${row.tmdb_id}) → ${row.imdb_id}`)
    }
    console.log(`\n[IMDb Backfill] Dry run complete. Run without --dry-run to apply changes.`)
    return
  }

  // Single UPDATE statement — no looping needed
  const result = await sql`
    UPDATE movies m
    SET imdb_id = pgc.imdb_id
    FROM parental_guide_cache pgc
    WHERE pgc.tmdb_id = m.tmdb_id
      AND (m.imdb_id IS NULL OR m.imdb_id = '')
      AND pgc.imdb_id IS NOT NULL
      AND pgc.imdb_id != ''
  `

  console.log(`[IMDb Backfill] Updated ${matchCount} movies with imdb_id from parental_guide_cache`)
  console.log(`[IMDb Backfill] You can now run: npx tsx scripts/backfill-omdb-scores.ts`)
}

backfill().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})