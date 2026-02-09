import Anthropic from "@anthropic-ai/sdk"
import { sql } from "@/lib/db"
import type { MovieRecommendation } from "./recommendation-service"

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
 * Generate ONLY personalized 1-2 sentence summaries for a small batch of movies.
 * This is the fast path — small prompt, small response.
 */
async function generateSummaryBatch(
  batch: MovieRecommendation[],
  ctx: SummaryContext
): Promise<Map<number, string>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
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
 * Generate pairings + parental summary for movies missing cached data.
 * Results are saved to the movies table for future reuse.
 */
async function generateAndCacheEnrichment(
  movies: MovieRecommendation[]
): Promise<Map<number, { pairings: any; parentalSummary: string }>> {
  if (movies.length === 0) return new Map()

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const systemPrompt = `You are a creative film curator. For each movie, provide themed food and drink pairings and a brief parental content advisory. Respond with ONLY a JSON object, no markdown or backticks.`

  const movieLines = movies.map((m, i) => {
    const year = m.releaseDate ? m.releaseDate.slice(0, 4) : "Unknown"
    const genres = m.genres.map(g => g.name).join(", ")
    return `${i + 1}. "${m.title}" (${year}) — ${genres}`
  }).join("\n")

  const userPrompt = `Movies:
${movieLines}

For each movie provide:
1. A signature cocktail inspired by the film (creative name + one-line description under 15 words)
2. A zero-proof drink inspired by the film (creative name + one-line description under 15 words)
3. A themed snack (creative name + one-line description under 15 words)
4. A parental content advisory (1-2 sentences, e.g. "Stylized violence, mild language. Suitable for teens 13+.")

Respond: {"1": {"pairings": {"cocktail": {"name": "", "desc": ""}, "zeroproof": {"name": "", "desc": ""}, "snack": {"name": "", "desc": ""}}, "parentalSummary": "..."}, ...}`

  try {
    const response = await anthropic.messages.create({
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

    const result = new Map<number, { pairings: any; parentalSummary: string }>()

    // Save to DB and build result map
    for (const [indexStr, value] of Object.entries(parsed)) {
      const idx = parseInt(indexStr) - 1
      if (idx >= 0 && idx < movies.length && value && typeof value === "object") {
        const tmdbId = movies[idx].tmdbId
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

    console.log(`[LLM Enrichment] Generated and cached pairings for ${result.size} movies`)
    return result
  } catch (error) {
    console.error("[LLM Enrichment] Error:", error)
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
 * - Summaries are personalized per-audience and generated in 3 parallel batches
 * - Pairings + parental are per-movie and cached in the DB after first generation
 * - Everything fires in parallel: 3 summary batches + 1 enrichment call (if needed)
 */
export async function generateRecommendationReasoning(
  input: ReasoningInput
): Promise<Map<number, ReasoningResult>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn("[LLM Reasoning] ANTHROPIC_API_KEY not set")
    return new Map()
  }

  const { recommendations, lovedMovies, dislikedMovies, mood,
          soloMode, memberCount, collectiveInfluence } = input

  // Step 1: Load cached enrichment (pairings + parental) for all 10 movies
  const cachedEnrichment = await getCachedEnrichment(
    recommendations.map(r => r.tmdbId)
  )

  // Step 2: Identify movies that need enrichment (no cached pairings)
  const needsEnrichment = recommendations.filter(
    r => !cachedEnrichment.has(r.tmdbId)
  )

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

  // Step 4: Split recommendations into 3 parallel batches for summaries
  const batchSize = Math.ceil(recommendations.length / 3)
  const batches = [
    recommendations.slice(0, batchSize),
    recommendations.slice(batchSize, batchSize * 2),
    recommendations.slice(batchSize * 2),
  ].filter(b => b.length > 0)

  // Step 5: Fire everything in parallel
  const enrichmentPromise = needsEnrichment.length > 0
    ? generateAndCacheEnrichment(needsEnrichment)
    : Promise.resolve(new Map<number, { pairings: any; parentalSummary: string }>())

  const summaryPromises = batches.map(batch =>
    generateSummaryBatch(batch, summaryContext)
  )

  const startTime = Date.now()
  const [enrichmentResults, ...summaryBatchResults] = await Promise.all([
    enrichmentPromise,
    ...summaryPromises,
  ])
  console.log(`[LLM Reasoning] All LLM calls completed in ${Date.now() - startTime}ms`)

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
  return result
}
