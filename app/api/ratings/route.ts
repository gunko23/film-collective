import { type NextRequest, NextResponse } from "next/server"
import { upsertRating, getUserRatingByTmdbId } from "@/lib/ratings/rating-service"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import {
  getActiveRatingDimensions,
  validateDimensionScores,
  validateDimensionTags,
  type DimensionScores,
  type DimensionTags,
} from "@/lib/ratings/dimensions-service"

// GET - Fetch user's rating for a movie
export async function GET(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable", userRating: null }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tmdbId = searchParams.get("tmdbId")

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 })
    }

    const userRating = await getUserRatingByTmdbId(user.id, Number.parseInt(tmdbId))

    return NextResponse.json({
      userRating: userRating
        ? {
            ...userRating,
            score: userRating.overallScore / 20,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching rating:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch rating" },
      { status: 500 },
    )
  }
}

// POST - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Auth temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      )
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await ensureUserExists(user.id, user.primaryEmail, user.displayName, user.profileImageUrl)

    const body = await request.json()
    const {
      tmdbId,
      score,
      stars,
      comment,
      // New dynamic dimension fields
      dimensionScores,
      dimensionTags,
      extraNotes,
      // Legacy fields (still accepted for backwards compatibility)
      explanationText,
      explanationTags,
    } = body

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 })
    }

    // Support both 'score' and 'stars' field names
    const starRating = stars ?? score
    if (starRating === undefined || starRating < 0 || starRating > 5) {
      return NextResponse.json({ error: "stars/score must be between 0 and 5" }, { status: 400 })
    }

    // Validate dimension scores and tags if provided
    const dimensions = await getActiveRatingDimensions()

    let validatedDimensionScores: DimensionScores | undefined
    if (dimensionScores && Object.keys(dimensionScores).length > 0) {
      const scoreValidation = validateDimensionScores(dimensionScores, dimensions)
      if (!scoreValidation.valid) {
        return NextResponse.json({ error: scoreValidation.errors.join(", ") }, { status: 400 })
      }
      validatedDimensionScores = dimensionScores
    }

    let validatedDimensionTags: DimensionTags | undefined
    if (dimensionTags && Object.keys(dimensionTags).length > 0) {
      const tagValidation = validateDimensionTags(dimensionTags, dimensions)
      if (!tagValidation.valid) {
        return NextResponse.json({ error: tagValidation.errors.join(", ") }, { status: 400 })
      }
      validatedDimensionTags = dimensionTags
    }

    const overallScore = Math.round(starRating * 20)

    const rating = await upsertRating({
      userId: user.id,
      tmdbMovieId: tmdbId,
      overallScore,
      dimensionScores: validatedDimensionScores,
      dimensionTags: validatedDimensionTags,
      extraNotes: extraNotes || explanationText,
      userComment: comment,
    })

    return NextResponse.json({
      success: true,
      rating: {
        ...rating,
        score: rating.overallScore / 20,
        stars: rating.overallScore / 20,
      },
    })
  } catch (error) {
    console.error("Error saving rating:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save rating" },
      { status: 500 },
    )
  }
}
