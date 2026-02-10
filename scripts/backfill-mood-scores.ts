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
import { rateLimitedCreate } from "../lib/anthropic/client"

const sql = neon(process.env.DATABASE_URL!)

const MOOD_PROMPT = `You are a strict film mood classifier. For each movie, rate how well it fits each mood on a scale from 0.0 to 1.0.

Moods:
- fun: Entertaining, enjoyable, a good time. Adventure, action, feel-good stories. A movie you'd happily recommend for a casual movie night.
- funny: Actually comedic — makes you laugh out loud. Witty dialogue, physical comedy, absurd humor, satire. Reserve high scores for movies where comedy is a PRIMARY element, not just occasional light moments.
- intense: Gripping, edge-of-your-seat, adrenaline-fueled. Thriller, action, suspense, high stakes. Your heart rate goes up.
- emotional: Moving, touching, deeply felt. Makes you cry, reflect on life, or feel something profound. Drama, romance, stories about loss, love, the human condition.
- mindless: Easy to watch without thinking. Pure popcorn entertainment, spectacle over substance, simple plots, low cognitive demand. You could watch this half-asleep and still enjoy it.
- acclaimed: Critically praised, award-worthy, artistically significant. High scores from critics, prestige cinema, culturally important.
- scary: Frightening, creepy, disturbing, unsettling. Horror, supernatural, psychological terror, dread, jump scares. Makes you want to leave the lights on.

INVERSE RELATIONSHIPS — these constrain your scores:
- If mindless is HIGH (>0.6), funny/emotional/acclaimed must be LOW (<0.4). A truly mindless movie is not deeply funny, moving, or critically praised.
- If acclaimed is HIGH (>0.8), mindless MUST be LOW (<0.3). Critics don't celebrate mindless films.
- If emotional is HIGH (>0.7) with themes of grief, trauma, or suffering, fun MUST be LOW (<0.4). Schindler's List is not fun.
- If scary is HIGH (>0.7), fun should generally be LOW (<0.4) unless the movie is specifically a horror-comedy.
- A movie CANNOT score above 0.5 on both mindless and emotional. Pick one — is this a thinking/feeling movie or a turn-your-brain-off movie?
- A movie CANNOT score above 0.5 on both mindless and acclaimed. Pick one.

SCORING DISCIPLINE:
- Be HARSH. Most movies should score below 0.3 on moods that don't apply to them.
- A score of 0.5+ means the mood is a MEANINGFUL part of the viewing experience.
- A score of 0.8+ means the mood is a PRIMARY reason to watch the film.
- Avoid "participation trophy" scores. If a movie is not funny, give it 0.1, not 0.3.
- When in doubt, score LOWER. It is better to under-score than to let a movie leak into a mood it doesn't belong to.

CALIBRATION EXAMPLES (use these as anchors):
- "Spirited Away": fun: 0.70, funny: 0.25, intense: 0.45, emotional: 0.75, mindless: 0.15, acclaimed: 0.95, scary: 0.30
- "The Hangover": fun: 0.85, funny: 0.95, intense: 0.15, emotional: 0.10, mindless: 0.80, acclaimed: 0.20, scary: 0.0
- "Hereditary": fun: 0.05, funny: 0.0, intense: 0.85, emotional: 0.60, mindless: 0.05, acclaimed: 0.80, scary: 0.95
- "Transformers: Age of Extinction": fun: 0.55, funny: 0.15, intense: 0.50, emotional: 0.05, mindless: 0.90, acclaimed: 0.05, scary: 0.0
- "Schindler's List": fun: 0.0, funny: 0.0, intense: 0.70, emotional: 0.95, mindless: 0.0, acclaimed: 0.98, scary: 0.25
- "Superbad": fun: 0.85, funny: 0.95, intense: 0.10, emotional: 0.25, mindless: 0.65, acclaimed: 0.30, scary: 0.0
- "Arrival": fun: 0.20, funny: 0.0, intense: 0.55, emotional: 0.80, mindless: 0.05, acclaimed: 0.85, scary: 0.20
- "Scary Movie": fun: 0.65, funny: 0.75, intense: 0.10, emotional: 0.0, mindless: 0.85, acclaimed: 0.05, scary: 0.15

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

      const userPrompt = `Score these movies:\n\n${movieLines}\n\nRespond with JSON: {"1": {"fun": 0.0, "funny": 0.0, "intense": 0.0, "emotional": 0.0, "mindless": 0.0, "acclaimed": 0.0, "scary": 0.0}, "2": {...}, ...}`

      const response = await rateLimitedCreate({
        model: "claude-haiku-4-5-20251001",
        max_tokens: Math.max(500, batch.length * 120),
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
          funny: clamp(Number(value.funny) || 0),
          intense: clamp(Number(value.intense) || 0),
          emotional: clamp(Number(value.emotional) || 0),
          mindless: clamp(Number(value.mindless) || 0),
          acclaimed: clamp(Number(value.acclaimed) || 0),
          scary: clamp(Number(value.scary) || 0),
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
