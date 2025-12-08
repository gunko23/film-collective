import { type NextRequest, NextResponse } from "next/server"
import { createTMDBClient } from "@/lib/tmdb/client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get("page") || "1"

  const client = createTMDBClient()
  if (!client) {
    return NextResponse.json({ error: "TMDB API not configured" }, { status: 500 })
  }

  try {
    const data = await client.getPopularTVShows(Number.parseInt(page))

    const results = data.results.map((show) => ({
      id: show.id,
      mediaType: "tv" as const,
      name: show.name,
      originalName: show.original_name,
      overview: show.overview,
      firstAirDate: show.first_air_date,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      popularity: show.popularity,
    }))

    return NextResponse.json({
      results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    })
  } catch (error) {
    console.error("Popular TV shows error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch popular TV shows" },
      { status: 500 },
    )
  }
}
