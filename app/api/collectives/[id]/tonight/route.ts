import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getTonightsPick, getCollectiveMembersForPick, logRecommendationHistory } from "@/lib/recommendations/recommendation-service"
import { getCollectiveForUser } from "@/lib/collectives/collective-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    // Verify user is a member of the collective
    const collective = await getCollectiveForUser(collectiveId, user.id)
    if (!collective || !collective.user_role) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    // Get members for the selection UI
    const members = await getCollectiveMembersForPick(collectiveId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching tonight's pick members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    // Verify user is a member of the collective
    const collective = await getCollectiveForUser(collectiveId, user.id)
    if (!collective || !collective.user_role) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const body = await request.json()
    const { memberIds, mood, moods, audience, maxRuntime, contentRating, parentalFilters, page, era, startYear, streamingProviders, excludeTmdbIds } = body

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "At least one member must be selected" }, { status: 400 })
    }

    // Normalize: support both single mood (backward compat) and multi-mood array
    const resolvedMoods = moods || (mood ? [mood] : [])

    // Get recommendations
    const result = await getTonightsPick({
      collectiveId,
      memberIds,
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
    console.error("Error getting tonight's pick:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 }
    )
  }
}