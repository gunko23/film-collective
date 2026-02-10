/**
 * Mood Score Backfill Script
 * Pre-computes per-movie mood affinity scores using Haiku.
 * Processes popular movies first (most likely to appear in recommendations).
 *
 * Usage:
 *   npx tsx scripts/backfill-mood-scores.ts [--limit 500] [--batch-size 10]
 *
 * Run scripts/037-add-mood-scores-column.sql FIRST to add the required columns.
 */

import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

import Anthropic from "@anthropic-ai/sdk"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

const MOOD_PROMPT = `You are a film analysis assistant. For each movie, rate how well it fits each mood on a scale from 0.0 to 1.0.

Moods:
- fun: Light-hearted, entertaining, makes you laugh or smile. Comedy, adventure, feel-good vibes.
- intense: Gripping, edge-of-your-seat, adrenaline. Action, thriller, horror, suspense.
- emotional: Moving, touching, thought-provoking. Drama, romance, stories about the human condition.
- mindless: Easy to watch without deep thinking. Popcorn entertainment, spectacle, simple plots.
- acclaimed: Critical darling, award-worthy, artistically significant. High ratings, prestige cinema.

IMPORTANT:
- A movie can score high on MULTIPLE moods (e.g., "Inside Out" might be fun: 0.85, emotional: 0.80)
- A movie can also score low on all moods if none particularly apply
- Be nuanced: "The Dark Knight" is intense (0.90) but also acclaimed (0.85), somewhat fun (0.55), not very emotional (0.35), not mindless (0.25)
- Consider the OVERALL viewing experience, not just genre labels
- Scores should reflect how strongly a viewer seeking that mood would enjoy the film

Respond with ONLY a JSON object mapping movie number to scores. No markdown, no backticks, no explanation.`

function clamp(v: number): number {
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100))
}

async function backfill() {
  const args = process.argv.slice(2)
  const limitIndex = args.indexOf("--limit")
  const batchSizeIndex = args.indexOf("--batch-size")

  const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 500
  const batchSize = Math.min(15, batchSizeIndex >= 0 ? parseInt(args[batchSizeIndex + 1], 10) : 10)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error("[Mood Backfill] ANTHROPIC_API_KEY not set")
    process.exit(1)
  }

  const anthropic = new Anthropic({ apiKey })
  console.log(`[Mood Backfill] Starting with limit=${limit}, batch-size=${batchSize}`)

  // Prioritize popular movies (most likely to be recommended)
  const movies = await sql`
    SELECT tmdb_id, title, release_date, genres, overview,
           tmdb_vote_average, tmdb_vote_count,
           imdb_rating, rotten_tomatoes_score, metacritic_score
    FROM movies
    WHERE mood_scored_at IS NULL
      AND tmdb_id IS NOT NULL
      AND title IS NOT NULL
    ORDER BY tmdb_vote_count DESC NULLS LAST
    LIMIT ${limit}
  `

  console.log(`[Mood Backfill] Found ${movies.length} movies to score`)
  if (movies.length === 0) {
    console.log("[Mood Backfill] Nothing to do")
    return
  }

  let totalScored = 0
  let totalErrors = 0
  const totalBatches = Math.ceil(movies.length / batchSize)

  for (let i = 0; i < movies.length; i += batchSize) {
    const batch = movies.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1

    try {
      const movieLines = batch.map((m: any, idx: number) => {
        const year = m.release_date ? String(m.release_date).slice(0, 4) : "Unknown"
        const genres = (Array.isArray(m.genres) ? m.genres : [])
          .map((g: any) => g.name).join(", ") || "Unknown"
        const overview = (m.overview || "").slice(0, 200)
        const ratings = [
          m.tmdb_vote_average ? `TMDB: ${Number(m.tmdb_vote_average).toFixed(1)}` : null,
          m.imdb_rating ? `IMDb: ${m.imdb_rating}` : null,
          m.rotten_tomatoes_score ? `RT: ${m.rotten_tomatoes_score}%` : null,
          m.metacritic_score ? `MC: ${m.metacritic_score}` : null,
        ].filter(Boolean).join(", ")
        return `${idx + 1}. "${m.title}" (${year}) — ${genres}${ratings ? ` [${ratings}]` : ""}\n   ${overview}`
      }).join("\n\n")

      const userPrompt = `Score these movies:\n\n${movieLines}\n\nRespond with JSON: {"1": {"fun": 0.0, "intense": 0.0, "emotional": 0.0, "mindless": 0.0, "acclaimed": 0.0}, "2": {...}, ...}`

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: Math.max(300, batch.length * 80),
        system: MOOD_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      })

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map(b => b.text).join("")
      const cleaned = text.replace(/```json\s?|```/g, "").trim()

      let parsed: Record<string, any>
      try {
        parsed = JSON.parse(cleaned)
      } catch (parseErr) {
        console.error(`[batch ${batchNum}/${totalBatches}] JSON parse error:`, cleaned.slice(0, 200))
        totalErrors += batch.length
        continue
      }

      let batchScored = 0
      for (const [indexStr, value] of Object.entries(parsed)) {
        const idx = parseInt(indexStr) - 1
        if (idx < 0 || idx >= batch.length || !value || typeof value !== "object") continue

        const movie = batch[idx]
        const scores = {
          fun: clamp(Number(value.fun) || 0),
          intense: clamp(Number(value.intense) || 0),
          emotional: clamp(Number(value.emotional) || 0),
          mindless: clamp(Number(value.mindless) || 0),
          acclaimed: clamp(Number(value.acclaimed) || 0),
        }

        try {
          await sql`
            UPDATE movies
            SET mood_scores = ${JSON.stringify(scores)}::jsonb,
                mood_scored_at = NOW()
            WHERE tmdb_id = ${movie.tmdb_id}
          `
          totalScored++
          batchScored++
        } catch (dbErr) {
          totalErrors++
          console.error(`  DB error for "${movie.title}":`, dbErr instanceof Error ? dbErr.message : dbErr)
        }
      }

      console.log(`[batch ${batchNum}/${totalBatches}] Scored ${batchScored}/${batch.length} movies`)
    } catch (error) {
      totalErrors += batch.length
      console.error(`[batch ${batchNum}/${totalBatches}] Batch error:`, error instanceof Error ? error.message : error)
    }

    // Rate limit: 500ms between batches
    if (i + batchSize < movies.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.log(`\n[Mood Backfill] Complete: ${totalScored} scored, ${totalErrors} errors, ${movies.length} total attempted`)
}

backfill().catch(err => {
  console.error("Fatal:", err)
  process.exit(1)
})
