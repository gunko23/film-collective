import Anthropic from "@anthropic-ai/sdk"
import { sql } from "@/lib/db"
import type { MovieRecommendation } from "./recommendation-service"

function timer(label: string) {
  const start = Date.now()
  return {
    done: () => {
      const ms = Date.now() - start
      console.log(`[Perf] ${label}: ${ms}ms`)
      return ms
    }
  }
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

// ============================================
// Taste Context Queries
// ============================================

type TasteMovie = { title: string; avgScore: number }

export async function getLovedMovies(memberIds: string[]): Promise<TasteMovie[]> {
  if (memberIds.length === 0) return []

  const rows = await sql`
    SELECT
      m.title,
      ROUND(AVG(umr.overall_score))::int as avg_score
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
    GROUP BY m.title, m.tmdb_id
    HAVING AVG(umr.overall_score) >= 75
    ORDER BY avg_score DESC, COUNT(DISTINCT umr.user_id) DESC
    LIMIT 20
  `

  return rows.map((r: any) => ({ title: r.title, avgScore: Number(r.avg_score) }))
}

export async function getDislikedMovies(memberIds: string[]): Promise<TasteMovie[]> {
  if (memberIds.length === 0) return []

  const rows = await sql`
    SELECT
      m.title,
      ROUND(AVG(umr.overall_score))::int as avg_score
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
    GROUP BY m.title, m.tmdb_id
    HAVING AVG(umr.overall_score) <= 40
    ORDER BY avg_score ASC
    LIMIT 10
  `

  return rows.map((r: any) => ({ title: r.title, avgScore: Number(r.avg_score) }))
}

// ============================================
// Types
// ============================================

type ReasoningInput = {
  recommendations: MovieRecommendation[]
  lovedMovies: TasteMovie[]
  dislikedMovies: TasteMovie[]
  mood: string | null
  soloMode: boolean
  memberCount: number
  collectiveInfluence?: Map<number, { avgScore: number; raterCount: number; raterNames: string[] }>
}

type ReasoningResult = {
  summary: string
  pairings?: {
    cocktail: { name: string; desc: string }
    zeroproof: { name: string; desc: string }
    snack: { name: string; desc: string }
  }
  parentalSummary?: string
}

type SummaryContext = {
  audienceLabel: string
  lovedList: string
  mood: string | null
  soloMode: boolean
  collectiveInfluence?: Map<number, { avgScore: number; raterCount: number; raterNames: string[] }>
}

// ============================================
// Cached Enrichment (pairings + parental)
// ============================================

/**
 * Load cached LLM-generated pairings and parental summaries from the movies table.
 */
async function getCachedEnrichment(
  tmdbIds: number[]
): Promise<Map<number, { pairings: any; parentalSummary: string }>> {
  if (tmdbIds.length === 0) return new Map()
  try {
    const rows = await sql`
      SELECT tmdb_id, llm_pairings, llm_parental_summary
      FROM movies
      WHERE tmdb_id = ANY(${tmdbIds}::int[])
        AND llm_enriched_at IS NOT NULL
        AND llm_pairings IS NOT NULL
    `
    const map = new Map<number, { pairings: any; parentalSummary: string }>()
    for (const row of rows) {
      map.set(Number(row.tmdb_id), {
        pairings: row.llm_pairings,
        parentalSummary: row.llm_parental_summary || "",
      })
    }
    return map
  } catch (e) {
    console.error("[LLM Cache] Error loading cached enrichment:", e)
    return new Map()
  }
}

// ============================================
// Summary Generation (personalized, batched)
// ============================================

/**
 * Generate ONLY personalized 1-2 sentence summaries for a small batch of movies (2).
 * This is the fast path — small prompt, small response.
 */
async function generateSummaryBatch(
  client: Anthropic,
  batch: MovieRecommendation[],
  ctx: SummaryContext
): Promise<Map<number, string>> {
  const systemPrompt = `You are a passionate film curator for Film Collective writing personalized pitches for movies you are recommending tonight. Every movie in this list has ALREADY been selected as a top recommendation for this audience — your job is to sell each one enthusiastically.

CRITICAL RULES:
- You MUST write a positive, enthusiastic 1-2 sentence pitch for EVERY movie. No exceptions.
- NEVER dismiss, criticize, or discourage watching any movie on this list.
- NEVER compare a movie unfavorably to the audience's favorites.
- NEVER say things like "skip this", "not for you", "lacks", "falls short", "hollow", "generic", or any negative framing.
- NEVER reference the audience's disliked movies.
- Find the genuine appeal of each movie — exciting set pieces, fun performances, great pacing, visual spectacle, crowd-pleasing moments, a perfect popcorn movie, etc.
- When friends from their collective loved a movie, lead with that social connection and name them.
- Reference specific things that make the movie worth watching: standout performances, memorable scenes, unique tone, bold style.
- Even for big blockbusters or genre films, find what makes them genuinely entertaining.

Respond with ONLY a JSON object, no markdown or backticks.`

  const movieLines = batch.map((m, i) => {
    const year = m.releaseDate ? m.releaseDate.slice(0, 4) : "Unknown"
    const genres = m.genres.map(g => g.name).join(", ")
    const influence = ctx.collectiveInfluence?.get(m.tmdbId)
    const friendLine = influence
      ? `\n   Friends: ${influence.raterNames.slice(0, 3).join(", ")} loved this (avg ${influence.avgScore}/100)`
      : ""
    const seenLine = m.seenBy.length > 0
      ? `\n   Some members have seen this`
      : ""
    return `${i + 1}. "${m.title}" (${year}) — ${genres}${friendLine}${seenLine}`
  }).join("\n")

  const userPrompt = `Audience: ${ctx.audienceLabel}
Loves: ${ctx.lovedList || "Not enough ratings yet"}
${ctx.mood ? `Mood: ${ctx.mood}` : "No specific mood"}

Movies:
${movieLines}

${ctx.soloMode ? 'Address the user as "you".' : 'Address the group as "your group" or "you all".'}

Respond: {"1": "summary text", "2": "summary text", ...}`

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: Math.max(300, batch.length * 120),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text).join("")

    const cleaned = text.replace(/```json\s?|```/g, "").trim()
    const parsed = JSON.parse(cleaned) as Record<string, string>

    const result = new Map<number, string>()
    for (const [indexStr, summary] of Object.entries(parsed)) {
      const idx = parseInt(indexStr) - 1
      if (idx >= 0 && idx < batch.length && typeof summary === "string") {
        result.set(batch[idx].tmdbId, summary)
      }
    }
    return result
  } catch (error) {
    console.error("[LLM Summary Batch] Error:", error)
    return new Map()
  }
}

// ============================================
// Enrichment Generation (pairings + parental, cached to DB)
// ============================================

/**
 * Generate pairings + parental for a batch of movies (1-5).
 * Results are cached to the movies table via fire-and-forget.
 */
async function _generateEnrichmentBatch(
  client: Anthropic,
  batch: MovieRecommendation[]
): Promise<Map<number, { pairings: any; parentalSummary: string }>> {

  const systemPrompt = `You are a creative film curator. For each movie, provide themed food and drink pairings and a brief parental content advisory. Respond with ONLY a JSON object, no markdown or backticks.`

  const movieLines = batch.map((m, i) => {
    const year = m.releaseDate ? m.releaseDate.slice(0, 4) : "Unknown"
    const genres = m.genres?.map((g: any) => g.name).join(", ") || "Unknown"
    return `${i + 1}. "${m.title}" (${year}) — ${genres}`
  }).join("\n")

  const userPrompt = `Movies:
${movieLines}

For each movie provide:
1. A signature cocktail inspired by the film (creative name + one-line description under 15 words)
2. A zero-proof drink inspired by the film (creative name + one-line description under 15 words)
3. A themed snack (creative name + one-line description under 15 words)
4. A parental content advisory (1-2 sentences)

Respond: {"1": {"pairings": {"cocktail": {"name": "", "desc": ""}, "zeroproof": {"name": "", "desc": ""}, "snack": {"name": "", "desc": ""}}, "parentalSummary": "..."}, ...}`

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: Math.max(400, batch.length * 250),
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const text = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text).join("")

    const cleaned = text.replace(/```json\s?|```/g, "").trim()
    const parsed = JSON.parse(cleaned) as Record<string, any>

    const result = new Map<number, { pairings: any; parentalSummary: string }>()
    for (const [indexStr, value] of Object.entries(parsed)) {
      const idx = parseInt(indexStr) - 1
      if (idx >= 0 && idx < batch.length && value && typeof value === "object") {
        const tmdbId = batch[idx].tmdbId
        const pairings = value.pairings || null
        const parentalSummary = value.parentalSummary || ""

        result.set(tmdbId, { pairings, parentalSummary })

        // Fire-and-forget DB cache write
        sql`
          UPDATE movies
          SET llm_pairings = ${JSON.stringify(pairings)}::jsonb,
              llm_parental_summary = ${parentalSummary},
              llm_enriched_at = NOW()
          WHERE tmdb_id = ${tmdbId}
        `.catch((e: any) => console.error(`[LLM Cache] Error caching enrichment for ${tmdbId}:`, e))
      }
    }
    return result
  } catch (error) {
    console.error("[LLM Enrichment Batch] Error:", error)
    return new Map()
  }
}

// ============================================
// Main Orchestrator
// ============================================

/**
 * Generate LLM reasoning for recommendations.
 *
 * Architecture:
 * - Cap at 4 total parallel LLM calls to avoid API rate limits
 * - Summaries: 2 batches of 5 movies each
 * - Enrichment: up to 2 batches (split uncached movies in half), cached to DB
 * - Everything fires in parallel: 2 summary + up to 2 enrichment = max 4 calls
 */
export async function generateRecommendationReasoning(
  input: ReasoningInput
): Promise<Map<number, ReasoningResult>> {
  const totalTimer = timer("generateRecommendationReasoning TOTAL")
  const client = getAnthropicClient()
  if (!client) {
    console.warn("[LLM Reasoning] ANTHROPIC_API_KEY not set")
    totalTimer.done()
    return new Map()
  }

  const { recommendations, lovedMovies, dislikedMovies, mood,
          soloMode, memberCount, collectiveInfluence } = input

  // Step 1: Load cached enrichment (pairings + parental) for all 10 movies
  const tCache = timer("LLM: Load cached enrichment")
  const cachedEnrichment = await getCachedEnrichment(
    recommendations.map(r => r.tmdbId)
  )
  tCache.done()

  // Step 2: Identify movies that need enrichment (no cached pairings)
  const needsEnrichment = recommendations.filter(
    r => !cachedEnrichment.has(r.tmdbId)
  )
  console.log(`[Perf] LLM: ${cachedEnrichment.size} cached, ${needsEnrichment.length} need enrichment`)

  // Step 3: Build trimmed taste context for summary generation
  const audienceLabel = soloMode ? "you" : `your group of ${memberCount}`
  const lovedList = lovedMovies.slice(0, 8)
    .map(m => `${m.title} (${m.avgScore})`).join(", ")
  const summaryContext: SummaryContext = {
    audienceLabel,
    lovedList,
    mood,
    soloMode,
    collectiveInfluence,
  }

  // Cap at 4 total parallel LLM calls to avoid API rate limits
  // Split: 2 summary batches + 2 enrichment batches (or fewer if not needed)

  // Summary batches: split 10 movies into 2 batches of 5
  const SUMMARY_BATCH_SIZE = 5
  const summaryBatches: MovieRecommendation[][] = []
  for (let i = 0; i < recommendations.length; i += SUMMARY_BATCH_SIZE) {
    summaryBatches.push(recommendations.slice(i, i + SUMMARY_BATCH_SIZE))
  }

  // Enrichment batches: split uncached movies into 2 batches (max)
  const enrichmentBatches: MovieRecommendation[][] = []
  if (needsEnrichment.length > 0) {
    const ENRICH_BATCH_SIZE = Math.ceil(needsEnrichment.length / 2)
    for (let i = 0; i < needsEnrichment.length; i += ENRICH_BATCH_SIZE) {
      enrichmentBatches.push(needsEnrichment.slice(i, i + ENRICH_BATCH_SIZE))
    }
  }

  console.log(`[Perf] LLM: Firing ${summaryBatches.length} summary batches + ${enrichmentBatches.length} enrichment batches (${summaryBatches.length + enrichmentBatches.length} total parallel calls)`)

  // Fire all in parallel — max 4 calls (2 summary + 2 enrichment)
  const allPromises: Promise<any>[] = [
    ...summaryBatches.map(batch => generateSummaryBatch(client, batch, summaryContext)),
    ...enrichmentBatches.map(batch => _generateEnrichmentBatch(client, batch)),
  ]

  const tLLM = timer("LLM: All parallel calls (summaries + enrichment)")
  const results = await Promise.all(allPromises)
  tLLM.done()

  // Split results back: first N are summary results, rest are enrichment
  const summaryBatchResults = results.slice(0, summaryBatches.length) as Map<number, string>[]
  const enrichmentBatchResults = results.slice(summaryBatches.length) as Map<number, { pairings: any; parentalSummary: string }>[]

  // Merge summary results
  const summaryMap = new Map<number, string>()
  for (const batchResult of summaryBatchResults) {
    for (const [tmdbId, summary] of batchResult.entries()) {
      summaryMap.set(tmdbId, summary)
    }
  }

  // Merge enrichment results (cached + fresh)
  const allEnrichment = new Map(cachedEnrichment)
  for (const batchResult of enrichmentBatchResults) {
    for (const [tmdbId, data] of batchResult.entries()) {
      allEnrichment.set(tmdbId, data)
    }
  }

  // Build final result map
  const result = new Map<number, ReasoningResult>()
  for (const rec of recommendations) {
    const summary = summaryMap.get(rec.tmdbId)
    const enrichment = allEnrichment.get(rec.tmdbId)

    result.set(rec.tmdbId, {
      summary: summary || rec.reasoning.join(". "),
      pairings: enrichment?.pairings || undefined,
      parentalSummary: enrichment?.parentalSummary || undefined,
    })
  }

  const freshEnrichmentCount = enrichmentBatchResults.reduce((sum, m) => sum + m.size, 0)
  console.log(`[LLM Reasoning] Generated ${summaryMap.size} summaries, ${freshEnrichmentCount} new enrichments, ${cachedEnrichment.size} cached enrichments`)
  totalTimer.done()
  return result
}
