/**
 * LLM Enrichment Backfill Script
 * Pre-populates pairings and parental summaries for popular movies.
 * Eliminates the enrichment LLM call for commonly recommended films.
 *
 * Usage:
 *   npx tsx scripts/backfill-llm-enrichment.ts [--limit 100] [--batch-size 8]
 *
 * Run scripts/migrate-llm-enrichment-cache.ts FIRST to add the required columns.
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import Anthropic from "@anthropic-ai/sdk"
import { neon } from "@neondatabase/serverless"
import { rateLimitedCreate } from "../lib/anthropic/client"

const sql = neon(process.env.DATABASE_URL!)

async function backfill() {
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf("--limit")
  const batchSizeIndex = args.indexOf("--batch-size")

  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 100
  const batchSize = Math.min(10, batchSizeIndex >= 0 ? parseInt(args[batchSizeIndex + 1], 10) : 8)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("[LLM Backfill] ANTHROPIC_API_KEY not set")
    process.exit(1)
  }

  console.log(`[LLM Backfill] Starting with limit=${limit}, batch-size=${batchSize}`)

  // Find movies needing enrichment, prioritizing popular films
  const movies = await sql`
    SELECT tmdb_id, title, release_date, genres
    FROM movies
    WHERE llm_enriched_at IS NULL
      AND tmdb_id IS NOT NULL
      AND title IS NOT NULL
    ORDER BY tmdb_vote_count DESC NULLS LAST
    LIMIT ${limit}
  `

  console.log(`[LLM Backfill] Found ${movies.length} movies to enrich`)

  let totalEnriched = 0
  let totalErrors = 0
  let totalSkipped = 0
  const totalBatches = Math.ceil(movies.length / batchSize)

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const batchProgress = `[batch ${batchNum}/${totalBatches}]`

    try {
      const movieLines = batch.map((m: any, idx: number) => {
        const year = m.release_date ? String(m.release_date).slice(0, 4) : "Unknown"
        const genres = m.genres
          ? (Array.isArray(m.genres) ? m.genres : []).map((g: any) => g.name).join(", ")
          : "Unknown"
        return `${idx + 1}. "${m.title}" (${year}) — ${genres}`
      }).join("\n")

      const systemPrompt = `You are a creative film curator. For each movie, provide themed food and drink pairings and a brief parental content advisory. Respond with ONLY a JSON object, no markdown or backticks.`

      const userPrompt = `Movies:
${movieLines}

For each movie provide:
1. A signature cocktail inspired by the film (creative name + one-line description under 15 words)
2. A zero-proof drink inspired by the film (creative name + one-line description under 15 words)
3. A themed snack (creative name + one-line description under 15 words)
4. A parental content advisory (1-2 sentences, e.g. "Stylized violence, mild language. Suitable for teens 13+.")

Respond: {"1": {"pairings": {"cocktail": {"name": "", "desc": ""}, "zeroproof": {"name": "", "desc": ""}, "snack": {"name": "", "desc": ""}}, "parentalSummary": "..."}, ...}`

      const response = await rateLimitedCreate({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      })

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map(b => b.text).join("")

      const cleaned = text.replace(/```json\s?|```/g, "").trim()
      const parsed = JSON.parse(cleaned) as Record<string, any>

      const enrichedTitles: string[] = []

      for (const [indexStr, value] of Object.entries(parsed)) {
        const idx = parseInt(indexStr) - 1
        if (idx < 0 || idx >= batch.length || !value || typeof value !== "object") {
          totalSkipped++
          continue
        }

        const movie = batch[idx]
        const pairings = value.pairings || null
        const parentalSummary = value.parentalSummary || ""

        try {
          await sql`
            UPDATE movies
            SET llm_pairings = ${JSON.stringify(pairings)}::jsonb,
                llm_parental_summary = ${parentalSummary},
                llm_enriched_at = NOW()
            WHERE tmdb_id = ${movie.tmdb_id}
          `
          totalEnriched++
          enrichedTitles.push(movie.title)
        } catch (dbErr) {
          totalErrors++
          console.error(`${batchProgress} DB error for "${movie.title}":`, dbErr instanceof Error ? dbErr.message : dbErr)
        }
      }

      console.log(`${batchProgress} Enriched ${enrichedTitles.length} movies: ${enrichedTitles.join(", ")}`)
    } catch (error) {
      totalErrors += batch.length
      console.error(`${batchProgress} Batch error:`, error instanceof Error ? error.message : error)
    }

    // Rate limit between batches
    if (i + batchSize < movies.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`\n[LLM Backfill] Complete:`)
  console.log(`  Enriched: ${totalEnriched}`)
  console.log(`  Errors:   ${totalErrors}`)
  console.log(`  Skipped:  ${totalSkipped}`)
  console.log(`  Total:    ${movies.length}`)
}

backfill().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
