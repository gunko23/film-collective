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
      emotionalImpact,
      pacing,
      aesthetic,
      rewatchability,
      breakdownTags,
      breakdownNotes,
      skipBreakdownNextTime,
    } = body

    if (!tmdbId || !mediaType) {
      return NextResponse.json({ error: "tmdbId and mediaType are required" }, { status: 400 })
    }

    // Validate dimension values
    const dimensions = [emotionalImpact, pacing, aesthetic, rewatchability]
    for (const dim of dimensions) {
      if (dim !== undefined && (dim < 1 || dim > 5)) {
        return NextResponse.json({ error: "Dimension values must be between 1 and 5" }, { status: 400 })
      }
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

      // Update the existing rating with breakdown
      await sql`
        UPDATE user_movie_ratings
        SET 
          emotional_impact = ${emotionalImpact},
          pacing = ${pacing},
          aesthetic = ${aesthetic},
          rewatchability = ${rewatchability},
          breakdown_tags = ${JSON.stringify(breakdownTags || [])}::jsonb,
          breakdown_notes = ${breakdownNotes || null},
          updated_at = NOW()
        WHERE user_id = ${user.id}::uuid AND movie_id = ${movieId}::uuid
      `
    } else {
      // TV show
      await sql`
        UPDATE user_tv_show_ratings
        SET 
          emotional_impact = ${emotionalImpact},
          pacing = ${pacing},
          aesthetic = ${aesthetic},
          rewatchability = ${rewatchability},
          breakdown_tags = ${JSON.stringify(breakdownTags || [])}::jsonb,
          breakdown_notes = ${breakdownNotes || null},
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
