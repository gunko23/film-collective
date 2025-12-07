import { NextResponse } from "next/server"
import { getMovieStatsByTmdbId } from "@/lib/ratings/rating-service"

// GET - Fetch community rating stats for a movie (public, no auth required)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tmdbId = Number.parseInt(id)

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const stats = await getMovieStatsByTmdbId(tmdbId)

    return NextResponse.json({
      tmdbId,
      averageScore: stats.averageScore ? stats.averageScore / 20 : null, // Convert to 0-5 scale
      ratingCount: stats.count,
    })
  } catch (error) {
    console.error("Error fetching movie stats:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 },
    )
  }
}
