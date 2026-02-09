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
  dislikedList: string
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
  const systemPrompt = `You are a passionate film curator for Film Collective. Write a 1-2 sentence personalized pitch for each movie that makes this audience excited to watch it tonight. Be enthusiastic, specific, and persuasive — reference standout performances, bold directorial choices, unique tones, or unforgettable scenes. When friends from their collective loved a movie, lead with that social connection and name them. Never say a movie doesn't fit or might not match. Never use generic filler like "critically acclaimed" or "a must-watch". Respond with ONLY a JSON object, no markdown or backticks.`

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
Dislikes: ${ctx.dislikedList || "None"}
${ctx.mood ? `Mood: ${ctx.mood}` : "No specific mood"}

Movies:
${movieLines}

${ctx.soloMode ? 'Address the user as "you".' : 'Address the group as "your group" or "you all".'}

Respond: {"1": "summary text", "2": "summary text", ...}`

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
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
 * Generate pairings + parental for a single small batch (1-2 movies).
 * Results are cached to the movies table via fire-and-forget.
 */
async function _generateEnrichmentBatch(
  batch: MovieRecommendation[]
): Promise<Map<number, { pairings: any; parentalSummary: string }>> {
  const client = getAnthropicClient()
  if (!client) return new Map()

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
      max_tokens: 800,
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

/**
 * Generate pairings + parental summary for movies missing cached data.
 * Splits into batches of 2 for maximum parallelism, then merges results.
 */
async function generateAndCacheEnrichment(
  movies: MovieRecommendation[]
): Promise<Map<number, { pairings: any; parentalSummary: string }>> {
  if (movies.length === 0) return new Map()

  // Split into batches of 2 for maximum parallelism
  const ENRICH_BATCH_SIZE = 2
  const enrichBatches: MovieRecommendation[][] = []
  for (let i = 0; i < movies.length; i += ENRICH_BATCH_SIZE) {
    enrichBatches.push(movies.slice(i, i + ENRICH_BATCH_SIZE))
  }

  console.log(`[Perf] LLM Enrichment: Firing ${enrichBatches.length} parallel batches of ≤${ENRICH_BATCH_SIZE}`)

  const batchResults = await Promise.all(
    enrichBatches.map(batch => _generateEnrichmentBatch(batch))
  )

  const result = new Map<number, { pairings: any; parentalSummary: string }>()
  for (const batchResult of batchResults) {
    for (const [tmdbId, data] of batchResult.entries()) {
      result.set(tmdbId, data)
    }
  }
  return result
}

// ============================================
// Main Orchestrator
// ============================================

/**
 * Generate LLM reasoning for recommendations.
 *
 * Architecture:
 * - Summaries are personalized per-audience and generated in 5 parallel batches of 2
 * - Pairings + parental are per-movie and cached in the DB after first generation
 * - Enrichment splits into batches of 2 for maximum parallelism
 * - Everything fires in parallel: 5 summary batches + N enrichment batches (if needed)
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
  const dislikedList = dislikedMovies.slice(0, 5)
    .map(m => `${m.title} (${m.avgScore})`).join(", ")

  const summaryContext: SummaryContext = {
    audienceLabel,
    lovedList,
    dislikedList,
    mood,
    soloMode,
    collectiveInfluence,
  }

  // Step 4: Split recommendations into batches of 2 for summaries
  const SUMMARY_BATCH_SIZE = 2
  const batches: MovieRecommendation[][] = []
  for (let i = 0; i < recommendations.length; i += SUMMARY_BATCH_SIZE) {
    batches.push(recommendations.slice(i, i + SUMMARY_BATCH_SIZE))
  }

  // Step 5: Fire everything in parallel
  const enrichmentPromise = needsEnrichment.length > 0
    ? generateAndCacheEnrichment(needsEnrichment)
    : Promise.resolve(new Map<number, { pairings: any; parentalSummary: string }>())

  const summaryPromises = batches.map(batch =>
    generateSummaryBatch(client, batch, summaryContext)
  )

  console.log(`[Perf] LLM: Firing ${batches.length} summary batches (${SUMMARY_BATCH_SIZE}/batch) + ${needsEnrichment.length > 0 ? Math.ceil(needsEnrichment.length / 2) + ' enrichment batches' : 'no enrichment (all cached)'}`)

  const tLLM = timer("LLM: All parallel calls (summaries + enrichment)")
  const [enrichmentResults, ...summaryBatchResults] = await Promise.all([
    enrichmentPromise,
    ...summaryPromises,
  ])
  tLLM.done()

  // Step 6: Merge all results
  // Combine summary batches into one map
  const summaryMap = new Map<number, string>()
  for (const batchResult of summaryBatchResults) {
    for (const [tmdbId, summary] of batchResult.entries()) {
      summaryMap.set(tmdbId, summary)
    }
  }

  // Merge cached enrichment with freshly generated enrichment
  const allEnrichment = new Map(cachedEnrichment)
  for (const [tmdbId, data] of enrichmentResults.entries()) {
    allEnrichment.set(tmdbId, data)
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

  console.log(`[LLM Reasoning] Generated ${summaryMap.size} summaries, ${enrichmentResults.size} new enrichments, ${cachedEnrichment.size} cached enrichments`)
  totalTimer.done()
  return result
}
