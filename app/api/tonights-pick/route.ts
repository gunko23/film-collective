import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getSoloTonightsPick } from "@/lib/recommendations/recommendation-service"

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mood, maxRuntime, contentRating, parentalFilters, page, era, startYear, streamingProviders } = body

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
