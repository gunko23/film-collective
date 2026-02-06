/**
 * Composite Quality Score Calculator
 * Combines IMDb (35%), Rotten Tomatoes (35%), Metacritic (30%) into a 0-100 score
 * Falls back to TMDB vote_average when OMDb data is unavailable
 */

import type { CachedOmdbScores } from "@/lib/omdb/omdb-cache"

export type QualityScoreResult = {
  compositeScore: number   // 0-100
  hasOmdbData: boolean
  breakdown: {
    imdb: number | null      // 0-100 normalized
    rt: number | null        // 0-100 (already percentage)
    metacritic: number | null // 0-100 (already 0-100 scale)
    tmdbFallback: number | null // 0-100 normalized from vote_average
  }
}

/**
 * Calculate how credible a movie's TMDB vote_average is.
 *
 * Detects vote inflation: when a small, self-selecting fanbase
 * inflates a movie's score beyond what general audiences would rate it.
 *
 * Returns a multiplier between 0.2 and 1.0 applied to the TMDB fallback score.
 */
function getVoteCredibility(voteAverage: number, popularity: number): number {
  if (voteAverage < 7.0) return 1.0

  let expectedMinPopularity: number
  if (voteAverage >= 8.0) {
    expectedMinPopularity = 50
  } else if (voteAverage >= 7.5) {
    expectedMinPopularity = 30
  } else {
    expectedMinPopularity = 20
  }

  if (popularity >= expectedMinPopularity) return 1.0

  const credibility = 0.2 + (0.8 * (popularity / expectedMinPopularity))
  return Math.max(0.2, Math.min(1.0, credibility))
}

/**
 * Calculate composite quality score
 *
 * When OMDb data is available:
 *   IMDb (35%) + RT (35%) + Metacritic (30%)
 *   If only some scores available, re-weights proportionally
 *
 * When no OMDb data:
 *   Falls back to TMDB vote_average normalized to 0-100,
 *   modulated by vote credibility (detects inflated TMDB scores)
 */
export function calculateCompositeQualityScore(
  omdb: CachedOmdbScores | null | undefined,
  tmdbVoteAverage: number,
  tmdbPopularity: number = 0
): QualityScoreResult {
  const tmdbNormalized = (tmdbVoteAverage / 10) * 100 // 7.5 → 75

  if (!omdb) {
    const credibility = getVoteCredibility(tmdbVoteAverage, tmdbPopularity)
    const adjustedScore = Math.round(tmdbNormalized * credibility * 10) / 10

    return {
      compositeScore: adjustedScore,
      hasOmdbData: false,
      breakdown: {
        imdb: null,
        rt: null,
        metacritic: null,
        tmdbFallback: adjustedScore,
      },
    }
  }

  // Normalize IMDb from 0-10 to 0-100
  const imdbNormalized = omdb.imdbRating != null ? omdb.imdbRating * 10 : null
  const rtScore = omdb.rottenTomatoesScore // already 0-100
  const metacriticScore = omdb.metacriticScore // already 0-100

  // Collect available scores with their weights
  const scores: { value: number; weight: number }[] = []
  if (imdbNormalized != null) scores.push({ value: imdbNormalized, weight: 35 })
  if (rtScore != null) scores.push({ value: rtScore, weight: 35 })
  if (metacriticScore != null) scores.push({ value: metacriticScore, weight: 30 })

  if (scores.length === 0) {
    // All OMDb fields are null — fall back to TMDB with credibility check
    const credibility = getVoteCredibility(tmdbVoteAverage, tmdbPopularity)
    const adjustedScore = Math.round(tmdbNormalized * credibility * 10) / 10
    return {
      compositeScore: adjustedScore,
      hasOmdbData: false,
      breakdown: {
        imdb: null,
        rt: null,
        metacritic: null,
        tmdbFallback: adjustedScore,
      },
    }
  }

  // Re-weight proportionally if not all scores are available
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  const compositeScore = scores.reduce(
    (sum, s) => sum + (s.value * (s.weight / totalWeight)),
    0
  )

  return {
    compositeScore: Math.round(compositeScore * 10) / 10,
    hasOmdbData: true,
    breakdown: {
      imdb: imdbNormalized,
      rt: rtScore,
      metacritic: metacriticScore,
      tmdbFallback: null,
    },
  }
}

/**
 * Calculate the scoring bonus for the recommendation engine (max +15)
 * Replaces the simple TMDB rating bonus with a composite quality signal
 */
export function getQualityBonus(quality: QualityScoreResult): {
  bonus: number
  reasoning: string | null
} {
  const score = quality.compositeScore

  if (score >= 85) {
    return {
      bonus: 15,
      reasoning: quality.hasOmdbData
        ? "Critically acclaimed across major review platforms"
        : "Highly rated on TMDB",
    }
  }
  if (score >= 75) {
    return {
      bonus: 10,
      reasoning: quality.hasOmdbData
        ? "Strong ratings across review platforms"
        : "Highly rated on TMDB",
    }
  }
  if (score >= 65) {
    return {
      bonus: 5,
      reasoning: quality.hasOmdbData
        ? "Well reviewed across platforms"
        : "Well reviewed",
    }
  }
  return { bonus: 0, reasoning: null }
}

/**
 * Get acclaimed mood bonuses based on critic scores
 * Only applied when mood = "acclaimed"
 */
export function getAcclaimedMoodBonus(omdb: CachedOmdbScores | null | undefined): {
  bonus: number
  reasoning: string[]
} {
  if (!omdb) return { bonus: 0, reasoning: [] }

  let bonus = 0
  const reasoning: string[] = []

  // RT >= 90: +8
  if (omdb.rottenTomatoesScore != null && omdb.rottenTomatoesScore >= 85) {
    bonus += 8
    reasoning.push(`${omdb.rottenTomatoesScore}% on Rotten Tomatoes`)
  }

  // Metacritic >= 80: +6
  if (omdb.metacriticScore != null && omdb.metacriticScore >= 75) {
    bonus += 6
    reasoning.push(`Metacritic score: ${omdb.metacriticScore}`)
  }

  // IMDb >= 8.0: +5
  if (omdb.imdbRating != null && omdb.imdbRating >= 7.5) {
    bonus += 5
    reasoning.push(`IMDb rating: ${omdb.imdbRating}/10`)
  }

  // RT < 60: penalty -5
  if (omdb.rottenTomatoesScore != null && omdb.rottenTomatoesScore < 60) {
    bonus -= 5
    reasoning.push("Below 60% on Rotten Tomatoes")
  }

  return { bonus, reasoning }
}
