import { type NextRequest, NextResponse } from "next/server"
import { getMovieByInternalId } from "@/lib/tmdb/movie-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const movieId = Number.parseInt(id, 10)

    if (isNaN(movieId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const result = await getMovieByInternalId(movieId)

    if (!result) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    const { movie, genres } = result

    // Transform to camelCase
    const transformedMovie = {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      tagline: movie.tagline,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      runtime: movie.runtime,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      adult: movie.adult,
      status: movie.status,
      originalLanguage: movie.original_language,
      budget: movie.budget,
      revenue: movie.revenue,
      imdbId: movie.imdb_id,
      homepage: movie.homepage,
      genres: genres.map((g: { id: number; name: string }) => ({ id: g.id, name: g.name })),
    }

    return NextResponse.json(transformedMovie)
  } catch (error) {
    console.error("Error fetching movie:", error)
    return NextResponse.json({ error: "Failed to fetch movie" }, { status: 500 })
  }
}
