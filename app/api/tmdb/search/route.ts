import { NextResponse } from "next/server"
import { searchMovies, getPopularMovies } from "@/lib/tmdb/movie-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = Number.parseInt(searchParams.get("page") || "1")

    // If no query, return popular movies
    if (!query) {
      const results = await getPopularMovies(page)
      return NextResponse.json({
        results: results.results.map((movie) => ({
          tmdbId: movie.id,
          title: movie.title,
          originalTitle: movie.original_title,
          overview: movie.overview,
          releaseDate: movie.release_date,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          voteAverage: movie.vote_average,
          voteCount: movie.vote_count,
          popularity: movie.popularity,
        })),
        page: results.page,
        totalPages: results.total_pages,
        totalResults: results.total_results,
      })
    }

    const results = await searchMovies(query, page)

    // This ensures well-known classic films appear before obscure ones
    const sortedResults = results.results
      .map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        popularity: movie.popularity,
      }))
      .sort((a, b) => {
        // Combine popularity and vote count for better ranking
        // Vote count is weighted more heavily as it better indicates well-known films
        const scoreA = a.popularity + a.voteCount * 0.1
        const scoreB = b.popularity + b.voteCount * 0.1
        return scoreB - scoreA
      })

    return NextResponse.json({
      results: sortedResults,
      page: results.page,
      totalPages: results.total_pages,
      totalResults: results.total_results,
    })
  } catch (error) {
    console.error("TMDB search error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed", results: [] },
      { status: 500 },
    )
  }
}
