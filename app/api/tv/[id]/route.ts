import { type NextRequest, NextResponse } from "next/server"
import { getTVShowDetails, getTVShowVideos, getTVShowCredits } from "@/lib/tmdb/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tvId = Number.parseInt(id)

  if (isNaN(tvId)) {
    return NextResponse.json({ error: "Invalid TV show ID" }, { status: 400 })
  }

  try {
    const [show, videos, credits] = await Promise.all([
      getTVShowDetails(tvId),
      getTVShowVideos(tvId),
      getTVShowCredits(tvId),
    ])

    if (!show) {
      return NextResponse.json({ error: "TV show not found" }, { status: 404 })
    }

    // Find the best trailer
    const trailer =
      videos.find((v) => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
      videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
      videos.find((v) => v.site === "YouTube")

    return NextResponse.json({
      ...show,
      trailer,
      credits,
    })
  } catch (error) {
    console.error("TV show fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch TV show" },
      { status: 500 },
    )
  }
}
