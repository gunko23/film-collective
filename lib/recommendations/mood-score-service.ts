/**
 * Mood Score Service
 * Per-movie mood affinity scores (0.0-1.0) for multi-mood AND-semantic filtering.
 * LLM-scored via batch backfill, with rule-based fallback for unscored movies.
 */

import { sql } from "@/lib/db"
import type { CachedOmdbScores } from "@/lib/omdb/omdb-cache"

// ============================================
// Types
// ============================================

export type MoodScores = {
  fun: number
  intense: number
  emotional: number
  mindless: number
  acclaimed: number
}

export const MOOD_KEYS = ["fun", "intense", "emotional", "mindless", "acclaimed"] as const
export type MoodKey = typeof MOOD_KEYS[number]

// ============================================
// Batch Load (cached LLM scores from movies table)
// ============================================

/**
 * Batch load cached mood scores for a list of TMDB IDs.
 * Only returns rows where mood_scored_at IS NOT NULL.
 * Follows pattern of batchGetCachedOmdbScores in lib/omdb/omdb-cache.ts.
 */
export async function batchGetCachedMoodScores(tmdbIds: number[]): Promise<Map<number, MoodScores>> {
  if (tmdbIds.length === 0) return new Map()

  try {
    const result = await sql`
      SELECT tmdb_id, mood_scores
      FROM movies
      WHERE tmdb_id = ANY(${tmdbIds}::int[])
        AND mood_scored_at IS NOT NULL
        AND mood_scores IS NOT NULL
    `

    const map = new Map<number, MoodScores>()
    for (const row of result) {
      const scores = row.mood_scores
      if (scores && typeof scores === "object") {
        map.set(row.tmdb_id, {
          fun: Number(scores.fun) || 0,
          intense: Number(scores.intense) || 0,
          emotional: Number(scores.emotional) || 0,
          mindless: Number(scores.mindless) || 0,
          acclaimed: Number(scores.acclaimed) || 0,
        })
      }
    }
    return map
  } catch (error) {
    console.error("[Mood Scores] Error batch loading:", error)
    return new Map()
  }
}

// ============================================
// Rule-Based Fallback
// ============================================

// TMDB genre IDs
const COMEDY = 35, ANIMATION = 16, FAMILY = 10751, ADVENTURE = 12
const ACTION = 28, THRILLER = 53, CRIME = 80, HORROR = 27, WAR = 10752
const DRAMA = 18, ROMANCE = 10749
const DOCUMENTARY = 99, HISTORY = 36

function clamp(v: number): number {
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100))
}

/**
 * Rule-based mood score estimation for movies without LLM scores.
 * Uses genre, ratings, runtime, and overview keywords as heuristics.
 * Less accurate than LLM scores but prevents cold-start gaps.
 */
export function calculateRuleBasedMoodScores(movie: {
  genres: { id: number; name?: string }[] | number[]
  vote_average?: number
  popularity?: number
  runtime?: number
  overview?: string
  omdbScores?: CachedOmdbScores | null
}): MoodScores {
  const genreIds = new Set<number>(
    (movie.genres || []).map((g: any) => typeof g === "number" ? g : g.id)
  )
  const voteAvg = Number(movie.vote_average || 0)
  const runtime = movie.runtime || 0
  const overview = (movie.overview || "").toLowerCase()
  const omdb = movie.omdbScores

  // --- Fun ---
  let fun = 0.3
  if (genreIds.has(COMEDY)) fun += 0.3
  if (genreIds.has(ANIMATION)) fun += 0.15
  if (genreIds.has(FAMILY)) fun += 0.1
  if (genreIds.has(ADVENTURE)) fun += 0.1
  if (genreIds.has(HORROR)) fun -= 0.2
  if (genreIds.has(WAR)) fun -= 0.2
  if (genreIds.has(DRAMA) && !genreIds.has(COMEDY)) fun -= 0.15
  if (genreIds.has(THRILLER)) fun -= 0.1
  if (overview.includes("hilarious") || overview.includes("laugh") || overview.includes("comedy")) fun += 0.05

  // --- Intense ---
  let intense = 0.3
  if (genreIds.has(ACTION)) intense += 0.2
  if (genreIds.has(THRILLER)) intense += 0.25
  if (genreIds.has(CRIME)) intense += 0.15
  if (genreIds.has(HORROR)) intense += 0.2
  if (genreIds.has(WAR)) intense += 0.15
  if (genreIds.has(COMEDY) && !genreIds.has(ACTION)) intense -= 0.15
  if (genreIds.has(FAMILY)) intense -= 0.2
  if (genreIds.has(ANIMATION)) intense -= 0.1
  if (genreIds.has(ROMANCE) && !genreIds.has(THRILLER)) intense -= 0.1

  // --- Emotional ---
  let emotional = 0.3
  if (genreIds.has(DRAMA)) emotional += 0.25
  if (genreIds.has(ROMANCE)) emotional += 0.2
  if (genreIds.has(WAR)) emotional += 0.1
  if (genreIds.has(COMEDY) && genreIds.has(ANIMATION)) emotional -= 0.15
  if (genreIds.has(ACTION) && !genreIds.has(DRAMA)) emotional -= 0.1
  if (overview.includes("grief") || overview.includes("loss") || overview.includes("heart") || overview.includes("family")) emotional += 0.05

  // --- Mindless ---
  let mindless = 0.3
  if (genreIds.has(ACTION)) mindless += 0.2
  if (genreIds.has(COMEDY)) mindless += 0.15
  if (genreIds.has(ADVENTURE)) mindless += 0.15
  if (genreIds.has(DRAMA) && !genreIds.has(ACTION)) mindless -= 0.15
  if (genreIds.has(DOCUMENTARY)) mindless -= 0.25
  if (genreIds.has(HISTORY)) mindless -= 0.15
  if (runtime > 0 && runtime <= 100) mindless += 0.05
  if (runtime > 150) mindless -= 0.1

  // --- Acclaimed ---
  let acclaimed = 0.3
  const imdb = omdb?.imdbRating ? Number(omdb.imdbRating) : 0
  const rt = omdb?.rottenTomatoesScore ? Number(omdb.rottenTomatoesScore) : 0
  const mc = omdb?.metacriticScore ? Number(omdb.metacriticScore) : 0
  if (voteAvg >= 8.0) acclaimed += 0.25
  else if (voteAvg >= 7.0) acclaimed += 0.1
  if (imdb >= 8.0) acclaimed += 0.15
  if (rt >= 90) acclaimed += 0.15
  else if (rt >= 75) acclaimed += 0.05
  if (mc >= 80) acclaimed += 0.1
  if (voteAvg < 6.0) acclaimed -= 0.2
  if (rt > 0 && rt < 50) acclaimed -= 0.15

  return {
    fun: clamp(fun),
    intense: clamp(intense),
    emotional: clamp(emotional),
    mindless: clamp(mindless),
    acclaimed: clamp(acclaimed),
  }
}

// ============================================
// Geometric Mean Scoring
// ============================================

const DEFAULT_MIN_THRESHOLD = 0.25

/**
 * Calculate multi-mood fit score using geometric mean.
 * Enforces AND semantics: a movie must score well on ALL selected moods.
 *
 * Geometric mean penalizes imbalance:
 * - (0.9 * 0.85)^0.5 = 0.87 — balanced, both moods match well
 * - (1.0 * 0.1)^0.5 = 0.32 — lopsided, one mood barely matches
 *
 * The min_threshold gates out movies that score below a minimum on any mood.
 */
export function calculateMoodFitScore(
  moodScores: MoodScores,
  moods: string[],
  minThreshold: number = DEFAULT_MIN_THRESHOLD,
): { score: number; passesThreshold: boolean } {
  if (moods.length === 0) return { score: 1.0, passesThreshold: true }

  const values = moods.map(m => moodScores[m as MoodKey] ?? 0)

  // Threshold gate: each selected mood must meet minimum
  const passesThreshold = values.every(v => v >= minThreshold)

  // Geometric mean
  const product = values.reduce((acc, v) => acc * v, 1)
  const score = values.length > 0 ? Math.pow(product, 1 / values.length) : 0

  return { score, passesThreshold }
}
