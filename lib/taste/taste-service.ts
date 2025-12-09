import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// ============================================
// Type Definitions
// ============================================

export type DimensionScores = {
  mood_match?: number // 0-100: How well the mood matched your current state
  genre_fit?: number // 0-100: How well it fit genre expectations
  pacing_preference?: number // 0-100: How well the pacing suited you
  aesthetic_appreciation?: number // 0-100: Visual/audio aesthetics
  emotional_impact?: number // 0-100: How emotionally affecting
  social_watchability?: number // 0-100: Good for watching with others
  artistic_merit?: number // 0-100: Artistic/craft quality
  rewatchability?: number // 0-100: Would you watch again
  personal_resonance?: number // 0-100: Personal connection/meaning
}

export type TasteVector = {
  userId: string
  ratingsCount: number
  avgRating: number | null
  avgMoodMatch: number | null
  avgGenreFit: number | null
  avgPacingPreference: number | null
  avgAestheticAppreciation: number | null
  avgEmotionalImpact: number | null
  avgSocialWatchability: number | null
  avgArtisticMerit: number | null
  avgRewatchability: number | null
  avgPersonalResonance: number | null
  dimensionRatingsCount: number
}

export type TasteMap = {
  collectiveId: string
  membersCount: number
  totalRatingsCount: number
  avgRating: number | null
  avgMoodMatch: number | null
  avgGenreFit: number | null
  avgPacingPreference: number | null
  avgAestheticAppreciation: number | null
  avgEmotionalImpact: number | null
  avgSocialWatchability: number | null
  avgArtisticMerit: number | null
  avgRewatchability: number | null
  avgPersonalResonance: number | null
}

export type MediaSignature = {
  mediaId: string | number
  tmdbId?: number
  title: string
  ratingsCount: number
  avgRating: number | null
  avgMoodMatch: number | null
  avgGenreFit: number | null
  avgPacingPreference: number | null
  avgAestheticAppreciation: number | null
  avgEmotionalImpact: number | null
  avgSocialWatchability: number | null
  avgArtisticMerit: number | null
  avgRewatchability: number | null
  avgPersonalResonance: number | null
  dimensionRatingsCount: number
}

// ============================================
// User Taste Vector
// ============================================

export async function getUserTasteVector(userId: string): Promise<TasteVector | null> {
  const result = await sql`
    SELECT * FROM user_taste_vectors WHERE user_id = ${userId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    userId: row.user_id,
    ratingsCount: Number(row.ratings_count),
    avgRating: row.avg_rating ? Number(row.avg_rating) : null,
    avgMoodMatch: row.avg_mood_match ? Number(row.avg_mood_match) : null,
    avgGenreFit: row.avg_genre_fit ? Number(row.avg_genre_fit) : null,
    avgPacingPreference: row.avg_pacing_preference ? Number(row.avg_pacing_preference) : null,
    avgAestheticAppreciation: row.avg_aesthetic_appreciation ? Number(row.avg_aesthetic_appreciation) : null,
    avgEmotionalImpact: row.avg_emotional_impact ? Number(row.avg_emotional_impact) : null,
    avgSocialWatchability: row.avg_social_watchability ? Number(row.avg_social_watchability) : null,
    avgArtisticMerit: row.avg_artistic_merit ? Number(row.avg_artistic_merit) : null,
    avgRewatchability: row.avg_rewatchability ? Number(row.avg_rewatchability) : null,
    avgPersonalResonance: row.avg_personal_resonance ? Number(row.avg_personal_resonance) : null,
    dimensionRatingsCount: Number(row.dimension_ratings_count || 0),
  }
}

// ============================================
// Collective Taste Map
// ============================================

export async function getCollectiveTasteMap(collectiveId: string): Promise<TasteMap | null> {
  const result = await sql`
    SELECT * FROM collective_taste_maps WHERE collective_id = ${collectiveId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    collectiveId: row.collective_id,
    membersCount: Number(row.members_count),
    totalRatingsCount: Number(row.total_ratings_count),
    avgRating: row.avg_rating ? Number(row.avg_rating) : null,
    avgMoodMatch: row.avg_mood_match ? Number(row.avg_mood_match) : null,
    avgGenreFit: row.avg_genre_fit ? Number(row.avg_genre_fit) : null,
    avgPacingPreference: row.avg_pacing_preference ? Number(row.avg_pacing_preference) : null,
    avgAestheticAppreciation: row.avg_aesthetic_appreciation ? Number(row.avg_aesthetic_appreciation) : null,
    avgEmotionalImpact: row.avg_emotional_impact ? Number(row.avg_emotional_impact) : null,
    avgSocialWatchability: row.avg_social_watchability ? Number(row.avg_social_watchability) : null,
    avgArtisticMerit: row.avg_artistic_merit ? Number(row.avg_artistic_merit) : null,
    avgRewatchability: row.avg_rewatchability ? Number(row.avg_rewatchability) : null,
    avgPersonalResonance: row.avg_personal_resonance ? Number(row.avg_personal_resonance) : null,
  }
}

// ============================================
// Film Signature (Movie)
// ============================================

export async function getFilmSignature(movieId: string): Promise<MediaSignature | null> {
  const result = await sql`
    SELECT * FROM film_signatures WHERE movie_id = ${movieId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return transformMediaSignature(row, "movie")
}

export async function getFilmSignatureByTmdbId(tmdbId: number): Promise<MediaSignature | null> {
  const result = await sql`
    SELECT * FROM film_signatures WHERE tmdb_id = ${tmdbId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return transformMediaSignature(row, "movie")
}

// ============================================
// TV Show Signature
// ============================================

export async function getTvShowSignature(tvShowId: number): Promise<MediaSignature | null> {
  const result = await sql`
    SELECT * FROM tv_show_signatures WHERE tv_show_id = ${tvShowId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return transformMediaSignature(row, "tv")
}

// ============================================
// Helper Functions
// ============================================

function transformMediaSignature(row: any, type: "movie" | "tv"): MediaSignature {
  return {
    mediaId: type === "movie" ? row.movie_id : row.tv_show_id,
    tmdbId: row.tmdb_id ? Number(row.tmdb_id) : undefined,
    title: row.title,
    ratingsCount: Number(row.ratings_count),
    avgRating: row.avg_rating ? Number(row.avg_rating) : null,
    avgMoodMatch: row.avg_mood_match ? Number(row.avg_mood_match) : null,
    avgGenreFit: row.avg_genre_fit ? Number(row.avg_genre_fit) : null,
    avgPacingPreference: row.avg_pacing_preference ? Number(row.avg_pacing_preference) : null,
    avgAestheticAppreciation: row.avg_aesthetic_appreciation ? Number(row.avg_aesthetic_appreciation) : null,
    avgEmotionalImpact: row.avg_emotional_impact ? Number(row.avg_emotional_impact) : null,
    avgSocialWatchability: row.avg_social_watchability ? Number(row.avg_social_watchability) : null,
    avgArtisticMerit: row.avg_artistic_merit ? Number(row.avg_artistic_merit) : null,
    avgRewatchability: row.avg_rewatchability ? Number(row.avg_rewatchability) : null,
    avgPersonalResonance: row.avg_personal_resonance ? Number(row.avg_personal_resonance) : null,
    dimensionRatingsCount: Number(row.dimension_ratings_count || 0),
  }
}

// Validate dimension scores are in valid range (0-100)
export function validateDimensionScores(scores: DimensionScores): boolean {
  const validKeys = [
    "mood_match",
    "genre_fit",
    "pacing_preference",
    "aesthetic_appreciation",
    "emotional_impact",
    "social_watchability",
    "artistic_merit",
    "rewatchability",
    "personal_resonance",
  ]

  for (const [key, value] of Object.entries(scores)) {
    if (!validKeys.includes(key)) return false
    if (typeof value !== "number") return false
    if (value < 0 || value > 100) return false
  }

  return true
}

// Convert 0-5 scale dimension scores to 0-100 scale for storage
export function normalizeDimensionScores(scores: Record<string, number>): DimensionScores {
  const normalized: DimensionScores = {}

  for (const [key, value] of Object.entries(scores)) {
    // If value is 0-5, convert to 0-100
    // If value is already 0-100, keep as is
    const normalizedValue = value <= 5 ? Math.round(value * 20) : value
    normalized[key as keyof DimensionScores] = normalizedValue
  }

  return normalized
}
