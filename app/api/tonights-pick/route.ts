import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getSoloTonightsPick, logRecommendationHistory } from "@/lib/recommendations/recommendation-service"

export async function POST(request: Request) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { mood, moods, audience, maxRuntime, contentRating, parentalFilters, page, era, startYear, streamingProviders, excludeTmdbIds } = body

    // Normalize: support both single mood (backward compat) and multi-mood array
    const resolvedMoods = moods || (mood ? [mood] : [])

    const result = await getSoloTonightsPick({
      userId: user.id,
      moods: resolvedMoods,
      audience: audience || "anyone",
      maxRuntime: maxRuntime || null,
      contentRating: contentRating || null,
      parentalFilters: parentalFilters || null,
      page: page || 1,
      era: era || null,
      startYear: startYear || null,
      streamingProviders: streamingProviders || null,
      excludeTmdbIds: excludeTmdbIds || null,
    })

    // Fire-and-forget: log recommendations for cross-session deduplication
    const recTmdbIds = result.recommendations.map((r: any) => r.tmdbId)
    logRecommendationHistory(user.id, recTmdbIds).catch(() => {})

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error getting solo tonight's pick:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 }
    )
  }
}
