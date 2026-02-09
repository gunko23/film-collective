/**
 * Migration: Add LLM Enrichment Cache Columns to Movies Table
 *
 * Adds columns for caching LLM-generated pairings and parental summaries.
 * These are properties of the movie itself, not the viewer, so they only
 * need to be generated once.
 *
 * Usage:
 *   npx tsx scripts/migrate-llm-enrichment-cache.ts
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  console.log("[Migration] Adding LLM enrichment cache columns to movies table...")

  // Step 1: Add columns
  console.log("[Migration] Adding llm_pairings column...")
  await sql`ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_pairings JSONB DEFAULT NULL`

  console.log("[Migration] Adding llm_parental_summary column...")
  await sql`ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_parental_summary TEXT DEFAULT NULL`

  console.log("[Migration] Adding llm_enriched_at column...")
  await sql`ALTER TABLE movies ADD COLUMN IF NOT EXISTS llm_enriched_at TIMESTAMPTZ DEFAULT NULL`

  // Step 2: Create index for efficient backfill queries
  console.log("[Migration] Creating index for unenriched movies...")
  await sql`
    CREATE INDEX IF NOT EXISTS idx_movies_llm_unenriched
      ON movies(id)
      WHERE llm_enriched_at IS NULL AND tmdb_id IS NOT NULL
  `

  console.log("[Migration] Done! LLM enrichment cache columns added successfully.")
}

migrate().catch(err => {
  console.error("Migration failed:", err)
  process.exit(1)
})
