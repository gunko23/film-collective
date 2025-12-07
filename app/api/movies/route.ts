import { NextResponse } from "next/server"
import { getCachedMovies } from "@/lib/tmdb/movie-service"

function transformMovie(row: any) {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    originalTitle: row.original_title,
    overview: row.overview,
    tagline: row.tagline,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    releaseDate: row.release_date,
    runtime: row.runtime,
    voteAverage: row.vote_average,
    voteCount: row.vote_count,
    popularity: row.popularity,
    adult: row.adult,
    status: row.status,
    originalLanguage: row.original_language,
    budget: row.budget,
    revenue: row.revenue,
    imdbId: row.imdb_id,
    homepage: row.homepage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    genres: row.genres || [],
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const sortBy = (searchParams.get("sort") || "popularity") as "popularity" | "rating" | "title" | "date"

    const { movies, total } = await getCachedMovies({
      page,
      limit,
      search,
      sortBy,
    })

    return NextResponse.json({
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Movies API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch movies",
        movies: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      { status: 500 },
    )
  }
}
