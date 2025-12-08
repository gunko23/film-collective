import { type NextRequest, NextResponse } from "next/server"
import { createTMDBClient } from "@/lib/tmdb/client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const page = searchParams.get("page") || "1"

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  const client = createTMDBClient()
  if (!client) {
    return NextResponse.json({ error: "TMDB API not configured" }, { status: 500 })
  }

  try {
    const data = await client.multiSearch(query, Number.parseInt(page))

    // Filter to only movies and TV shows
    const filteredResults = data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => ({
        id: item.id,
        mediaType: item.media_type,
        title: item.media_type === "movie" ? item.title : item.name,
        originalTitle: item.media_type === "movie" ? item.original_title : item.original_name,
        overview: item.overview,
        releaseDate: item.media_type === "movie" ? item.release_date : item.first_air_date,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        voteAverage: item.vote_average,
        voteCount: item.vote_count,
        popularity: item.popularity,
      }))

    return NextResponse.json({
      results: filteredResults,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    })
  } catch (error) {
    console.error("Multi search error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to search" }, { status: 500 })
  }
}
