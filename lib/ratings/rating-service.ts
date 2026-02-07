import { neon } from "@neondatabase/serverless"
import { getOrFetchMovie } from "@/lib/tmdb/movie-service"
import type { DimensionScores, DimensionTags } from "@/lib/ratings/dimensions-service"

const sql = neon(process.env.DATABASE_URL!)

export type RatingDimension = {
  id: string
  key: string
  label: string
  description: string | null
  weightDefault: number
  sortOrder: number
}

export type UserRating = {
  id: string
  userId: string
  movieId: string
  overallScore: number
  dimensionScores: DimensionScores | null
  dimensionTags: DimensionTags | null
  extraNotes: string | null
  userComment: string | null
  aiExplanation: string | null
  aiTags: string[] | null
  ratedAt: string
  updatedAt: string
  // Legacy fields (kept for backwards compatibility)
  emotional_impact: number | null
  pacing: number | null
  aesthetic: number | null
  rewatchability: number | null
  breakdown_tags: string[] | null
  breakdown_notes: string | null
}

// Get all rating dimensions
export async function getRatingDimensions(): Promise<RatingDimension[]> {
  const results = await sql`
    SELECT * FROM rating_dimensions 
    WHERE is_active = true
    ORDER BY sort_order ASC
  `

  return results.map((row: any) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    weightDefault: Number(row.weight_default || 1),
    sortOrder: row.sort_order,
  }))
}

// Calculate overall score from dimension scores using default weights
export async function calculateOverallScore(dimensionScores: DimensionScores): Promise<number> {
  const dimensions = await getRatingDimensions()

  let totalWeight = 0
  let weightedSum = 0

  for (const dimension of dimensions) {
    const score = dimensionScores[dimension.key]
    if (score !== undefined) {
      weightedSum += score * dimension.weightDefault
      totalWeight += dimension.weightDefault
    }
  }

  if (totalWeight === 0) return 0
  return Math.round(weightedSum / totalWeight)
}

// Create or update a user's rating for a movie
export async function upsertRating(params: {
  userId: string
  tmdbMovieId: number
  overallScore?: number
  dimensionScores?: DimensionScores
  dimensionTags?: DimensionTags
  extraNotes?: string
  userComment?: string
}): Promise<UserRating> {
  const { userId, tmdbMovieId, overallScore, dimensionScores, dimensionTags, extraNotes, userComment } = params

  // Ensure movie exists in local DB (fetches from TMDB if needed)
  const movie = await getOrFetchMovie(tmdbMovieId)
  if (!movie) {
    throw new Error(`Movie with TMDB ID ${tmdbMovieId} not found`)
  }

  // Calculate overall score if dimension scores provided but overall not
  let finalOverallScore = overallScore
  if (dimensionScores && finalOverallScore === undefined) {
    finalOverallScore = await calculateOverallScore(dimensionScores)
  }

  if (finalOverallScore === undefined) {
    throw new Error("Either overallScore or dimensionScores must be provided")
  }

  const result = await sql`
    INSERT INTO user_movie_ratings (
      user_id, movie_id, overall_score, dimension_scores, dimension_tags, extra_notes, user_comment
    ) VALUES (
      ${userId},
      ${movie.id},
      ${finalOverallScore},
      ${dimensionScores ? JSON.stringify(dimensionScores) : null},
      ${dimensionTags ? JSON.stringify(dimensionTags) : null},
      ${extraNotes || null},
      ${userComment || null}
    )
    ON CONFLICT (user_id, movie_id) DO UPDATE SET
      overall_score = ${finalOverallScore},
      dimension_scores = COALESCE(${dimensionScores ? JSON.stringify(dimensionScores) : null}, user_movie_ratings.dimension_scores),
      dimension_tags = COALESCE(${dimensionTags ? JSON.stringify(dimensionTags) : null}, user_movie_ratings.dimension_tags),
      extra_notes = COALESCE(${extraNotes || null}, user_movie_ratings.extra_notes),
      user_comment = COALESCE(${userComment || null}, user_movie_ratings.user_comment),
      updated_at = NOW()
    RETURNING *
  `

  return transformRating(result[0])
}

// Delete a user's rating for a movie by TMDB ID
export async function deleteRatingByTmdbId(userId: string, tmdbMovieId: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM user_movie_ratings
    WHERE user_id = ${userId}
      AND movie_id IN (SELECT id FROM movies WHERE tmdb_id = ${tmdbMovieId})
    RETURNING id
  `
  return result.length > 0
}

// Get a user's rating for a movie
export async function getUserRating(userId: string, movieId: string): Promise<UserRating | null> {
  const result = await sql`
    SELECT * FROM user_movie_ratings
    WHERE user_id = ${userId} AND movie_id = ${movieId}
  `

  if (result.length === 0) return null
  return transformRating(result[0])
}

// Get a user's rating by TMDB movie ID
export async function getUserRatingByTmdbId(userId: string, tmdbMovieId: number): Promise<UserRating | null> {
  const result = await sql`
    SELECT r.id,
           r.user_id,
           r.movie_id,
           r.overall_score,
           r.dimension_scores,
           r.dimension_tags,
           r.extra_notes,
           r.user_comment,
           r.ai_explanation,
           r.ai_tags,
           r.rated_at,
           r.updated_at,
           r.emotional_impact,
           r.pacing,
           r.aesthetic,
           r.rewatchability,
           r.breakdown_tags,
           r.breakdown_notes
    FROM user_movie_ratings r
    INNER JOIN movies m ON r.movie_id = m.id
    WHERE r.user_id = ${userId} AND m.tmdb_id = ${tmdbMovieId}
  `

  if (result.length === 0) return null
  return transformRating(result[0])
}

// Get all ratings for a movie (community ratings)
export async function getMovieRatings(movieId: string): Promise<{
  ratings: UserRating[]
  averageScore: number | null
  count: number
}> {
  const ratings = await sql`
    SELECT * FROM user_movie_ratings WHERE movie_id = ${movieId}
  `

  const stats = await sql`
    SELECT AVG(overall_score) as avg_score, COUNT(*) as count
    FROM user_movie_ratings WHERE movie_id = ${movieId}
  `

  return {
    ratings: ratings.map(transformRating),
    averageScore: stats[0]?.avg_score ? Number(stats[0].avg_score) : null,
    count: Number(stats[0]?.count || 0),
  }
}

// Get community rating stats by TMDB ID
export async function getMovieStatsByTmdbId(tmdbMovieId: number): Promise<{
  averageScore: number | null
  count: number
}> {
  const stats = await sql`
    SELECT AVG(umr.overall_score) as avg_score, COUNT(*) as count
    FROM user_movie_ratings umr
    INNER JOIN movies m ON umr.movie_id = m.id
    WHERE m.tmdb_id = ${tmdbMovieId}
  `

  return {
    averageScore: stats[0]?.avg_score ? Number(stats[0].avg_score) : null,
    count: Number(stats[0]?.count || 0),
  }
}

function transformRating(row: any): UserRating {
  return {
    id: row.id,
    userId: row.user_id,
    movieId: row.movie_id,
    overallScore: Number(row.overall_score),
    dimensionScores: row.dimension_scores,
    dimensionTags: row.dimension_tags,
    extraNotes: row.extra_notes,
    userComment: row.user_comment,
    aiExplanation: row.ai_explanation,
    aiTags: row.ai_tags,
    ratedAt: row.rated_at,
    updatedAt: row.updated_at,
    // Legacy fields
    emotional_impact: row.emotional_impact ? Number(row.emotional_impact) : null,
    pacing: row.pacing ? Number(row.pacing) : null,
    aesthetic: row.aesthetic ? Number(row.aesthetic) : null,
    rewatchability: row.rewatchability ? Number(row.rewatchability) : null,
    breakdown_tags: row.breakdown_tags,
    breakdown_notes: row.breakdown_notes,
  }
}
