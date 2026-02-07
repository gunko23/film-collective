import Anthropic from "@anthropic-ai/sdk"
import { neon } from "@neondatabase/serverless"
import type { MovieRecommendation } from "./recommendation-service"

const sql = neon(process.env.DATABASE_URL!)

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
// LLM Reasoning Generation
// ============================================

type ReasoningInput = {
  recommendations: MovieRecommendation[]
  lovedMovies: TasteMovie[]
  dislikedMovies: TasteMovie[]
  mood: string | null
  soloMode: boolean
  memberCount: number
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

export async function generateRecommendationReasoning(
  input: ReasoningInput
): Promise<Map<number, ReasoningResult>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn("[LLM Reasoning] ANTHROPIC_API_KEY not set, using template reasoning")
    return new Map()
  }

  const anthropic = new Anthropic({ apiKey })
  const { recommendations, lovedMovies, dislikedMovies, mood, soloMode, memberCount } = input

  const audienceLabel = soloMode ? "this user" : `this group of ${memberCount}`

  const lovedList = lovedMovies
    .slice(0, 15)
    .map(m => `${m.title} (rated ${m.avgScore}/100)`)
    .join(", ")

  const dislikedList = dislikedMovies
    .slice(0, 8)
    .map(m => `${m.title} (rated ${m.avgScore}/100)`)
    .join(", ")

  const movieList = recommendations.map((m, i) => {
    const year = m.releaseDate ? new Date(m.releaseDate).getFullYear() : "Unknown"
    return [
      `[${i + 1}] "${m.title}" (${year})`,
      `   Genres: ${m.genres.map(g => g.name).join(", ")}`,
      `   TMDB: ${m.voteAverage}/10 | Fit Score: ${m.groupFitScore}/100`,
      `   Overview: ${m.overview.slice(0, 200)}`,
      m.seenBy.length > 0 ? `   Already seen by some members` : null,
      `   System reasoning: ${m.reasoning.join("; ")}`,
    ].filter(Boolean).join("\n")
  }).join("\n\n")

  const systemPrompt = `You are a passionate film curator for Film Collective, a social movie app. Your job is to SELL each recommended movie — find the most compelling angle that would make this specific audience excited to watch it tonight. You are enthusiastic, specific, and persuasive. Never say a movie doesn't fit, doesn't align, or might not match their taste. Every movie on this list earned its spot — your job is to make them want to press play. Respond with ONLY a JSON object. No markdown, no backticks, no preamble.`

  const userPrompt = `## Taste Profile for ${audienceLabel}

**Movies they love:** ${lovedList || "Not enough ratings yet"}

**Movies they disliked:** ${dislikedList || "None recorded"}

${mood ? `**Current mood:** ${mood}` : "**No specific mood selected**"}

## Recommended Movies

${movieList}

## Instructions

For each movie, provide:

1. **Summary** (1-2 sentences): SELL it to this audience.
   - Find the most exciting connection to movies they already love
   - Reference specific qualities: a standout performance, a bold directorial choice, an unforgettable scene, a unique narrative structure, a tone that hooks you
   - Be enthusiastic and specific, like a trusted friend who just watched it
   - NEVER say a movie doesn't fit, doesn't align, might disappoint, or isn't a match
   - NEVER use generic filler like "highly acclaimed", "well-regarded", "critically praised", or "a must-watch"
   - If some group members have seen it, frame it as a positive
   - Keep it to 1-2 punchy sentences
   - ${soloMode ? 'Address the user as "you"' : 'Address the group as "your group" or "you all"'}

2. **Tonight's Concession Stand** — three pairings:
   - One signature **cocktail** inspired by the film's setting, mood, or themes
   - One **zero-proof** (non-alcoholic) drink inspired by the film
   - One themed **snack** that complements the viewing experience
   For each pairing, give it a fun creative name and a one-line description (under 15 words) of why it fits the movie.

3. **Parental summary** — a brief 1-2 sentence content advisory (e.g., "Stylized violence, mild language, brief frightening sequences. Suitable for teens 13+."). If the movie is suitable for all ages, say so.

Respond in this exact JSON format:
{
  "1": {
    "summary": "your recommendation summary text",
    "pairings": {
      "cocktail": { "name": "Drink Name", "desc": "one-line description" },
      "zeroproof": { "name": "Drink Name", "desc": "one-line description" },
      "snack": { "name": "Snack Name", "desc": "one-line description" }
    },
    "parentalSummary": "Brief content advisory"
  },
  "2": { ... }
}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    })

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map(block => block.text)
      .join("")

    // Parse JSON — strip markdown fences if present
    const cleaned = text.replace(/```json\s?|```/g, "").trim()
    const parsed = JSON.parse(cleaned) as Record<string, any>

    const result = new Map<number, ReasoningResult>()
    for (const [indexStr, value] of Object.entries(parsed)) {
      const idx = parseInt(indexStr) - 1
      if (idx >= 0 && idx < recommendations.length) {
        if (typeof value === "string") {
          // Backwards-compatible: plain string reasoning
          result.set(recommendations[idx].tmdbId, { summary: value })
        } else if (value && typeof value === "object" && typeof value.summary === "string") {
          result.set(recommendations[idx].tmdbId, {
            summary: value.summary,
            pairings: value.pairings || undefined,
            parentalSummary: value.parentalSummary || undefined,
          })
        }
      }
    }

    console.log(`[LLM Reasoning] Generated reasoning for ${result.size}/${recommendations.length} movies`)
    return result
  } catch (error) {
    console.error("[LLM Reasoning] Failed, falling back to template reasoning:", error)
    return new Map()
  }
}