import { type NextRequest, NextResponse } from "next/server"
import { getTVSeasonDetails } from "@/lib/tmdb/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; seasonNumber: string }> }) {
  const { id, seasonNumber } = await params
  const tvId = Number.parseInt(id)
  const season = Number.parseInt(seasonNumber)

  if (isNaN(tvId) || isNaN(season)) {
    return NextResponse.json({ error: "Invalid TV show or season ID" }, { status: 400 })
  }

  try {
    const seasonDetails = await getTVSeasonDetails(tvId, season)

    if (!seasonDetails) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    return NextResponse.json(seasonDetails)
  } catch (error) {
    console.error("Season fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch season" },
      { status: 500 },
    )
  }
}
