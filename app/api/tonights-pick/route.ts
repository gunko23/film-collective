import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getSoloTonightsPick } from "@/lib/recommendations/recommendation-service"

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
    const { mood, maxRuntime, contentRating, parentalFilters, page, era, startYear, streamingProviders, excludeTmdbIds } = body

    const result = await getSoloTonightsPick({
      userId: user.id,
      mood: mood || null,
      maxRuntime: maxRuntime || null,
      contentRating: contentRating || null,
      parentalFilters: parentalFilters || null,
      page: page || 1,
      era: era || null,
      startYear: startYear || null,
      streamingProviders: streamingProviders || null,
      excludeTmdbIds: excludeTmdbIds || null,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error getting solo tonight's pick:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 }
    )
  }
}
