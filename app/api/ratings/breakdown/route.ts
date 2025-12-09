import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSafeUser } from "@/lib/auth/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

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

    const body = await request.json()
    const {
      mediaType,
      tmdbId,
      // Legacy individual fields (for backwards compatibility)
      emotionalImpact,
      pacing,
      aesthetic,
      rewatchability,
      breakdownTags,
      breakdownNotes,
      skipBreakdownNextTime,
      // New dynamic dimension fields
      dimensionScores,
      dimensionTags,
    } = body

    if (!tmdbId || !mediaType) {
      return NextResponse.json({ error: "tmdbId and mediaType are required" }, { status: 400 })
    }

    let finalDimensionScores: Record<string, number> = {}

    // If new format provided, use it
    if (dimensionScores && Object.keys(dimensionScores).length > 0) {
      finalDimensionScores = { ...dimensionScores }
    } else {
      // Otherwise, build from legacy fields
      if (emotionalImpact !== undefined) finalDimensionScores.emotional_impact = emotionalImpact
      if (pacing !== undefined) finalDimensionScores.pacing = pacing
      if (aesthetic !== undefined) finalDimensionScores.aesthetic = aesthetic
      if (rewatchability !== undefined) finalDimensionScores.rewatchability = rewatchability
    }

    // Validate dimension values (must be between 1 and 5)
    for (const [key, value] of Object.entries(finalDimensionScores)) {
      if (value < 1 || value > 5) {
        return NextResponse.json({ error: `Dimension ${key} must be between 1 and 5` }, { status: 400 })
      }
    }

    let finalDimensionTags: Record<string, string[]> = {}

    if (dimensionTags && Object.keys(dimensionTags).length > 0) {
      finalDimensionTags = { ...dimensionTags }
    } else if (breakdownTags && breakdownTags.length > 0) {
      // Legacy: store under 'vibes' key
      finalDimensionTags.vibes = breakdownTags
    }

    // Update the rating with breakdown data
    if (mediaType === "movie") {
      // Get the movie UUID from tmdb_id
      const movieResult = await sql`
        SELECT id FROM movies WHERE tmdb_id = ${tmdbId}
      `
      if (movieResult.length === 0) {
        return NextResponse.json({ error: "Movie not found" }, { status: 404 })
      }

      const movieId = movieResult[0].id

      await sql`
        UPDATE user_movie_ratings
        SET 
          dimension_scores = COALESCE(dimension_scores, '{}'::jsonb) || ${JSON.stringify(finalDimensionScores)}::jsonb,
          dimension_tags = COALESCE(dimension_tags, '{}'::jsonb) || ${JSON.stringify(finalDimensionTags)}::jsonb,
          extra_notes = COALESCE(${breakdownNotes || null}, extra_notes),
          updated_at = NOW()
        WHERE user_id = ${user.id}::uuid AND movie_id = ${movieId}::uuid
      `
    } else {
      // TV show
      await sql`
        UPDATE user_tv_show_ratings
        SET 
          dimension_scores = COALESCE(dimension_scores, '{}'::jsonb) || ${JSON.stringify(finalDimensionScores)}::jsonb,
          dimension_tags = COALESCE(dimension_tags, '{}'::jsonb) || ${JSON.stringify(finalDimensionTags)}::jsonb,
          extra_notes = COALESCE(${breakdownNotes || null}, extra_notes),
          updated_at = NOW()
        WHERE user_id = ${user.id}::uuid AND tv_show_id = ${tmdbId}
      `
    }

    // Update skip_breakdown preference if requested
    if (skipBreakdownNextTime) {
      await sql`
        INSERT INTO user_rating_preferences (user_id, skip_breakdown, updated_at)
        VALUES (${user.id}::uuid, true, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET skip_breakdown = true, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving breakdown:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save breakdown" },
      { status: 500 },
    )
  }
}
