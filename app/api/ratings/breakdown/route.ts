import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { saveRatingBreakdown, saveSkipBreakdownPreference } from "@/lib/ratings/rating-service"

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

    const result = await saveRatingBreakdown({
      userId: user.id,
      mediaType,
      tmdbId,
      dimensionScores: finalDimensionScores,
      dimensionTags: finalDimensionTags,
      breakdownNotes,
    })

    if (result.movieNotFound) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    // Update skip_breakdown preference if requested
    if (skipBreakdownNextTime) {
      await saveSkipBreakdownPreference(user.id)
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
