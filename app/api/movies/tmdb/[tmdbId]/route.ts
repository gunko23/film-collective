import { NextResponse } from "next/server"
import { getMovieDetails, getMovieVideos, getMovieCredits } from "@/lib/tmdb/client"

export async function GET(request: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  try {
    const { tmdbId } = await params
    const tmdbIdNum = Number.parseInt(tmdbId)

    if (isNaN(tmdbIdNum)) {
      return NextResponse.json({ error: "Invalid TMDB ID" }, { status: 400 })
    }

    const [tmdbMovie, videos, credits] = await Promise.all([
      getMovieDetails(tmdbIdNum),
      getMovieVideos(tmdbIdNum),
      getMovieCredits(tmdbIdNum),
    ])

    if (!tmdbMovie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    const trailer =
      videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
      videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
      videos.find((v) => v.site === "YouTube" && v.type === "Teaser")

    const clip =
      videos.find((v) => v.site === "YouTube" && v.type === "Clip" && v.official) ||
      videos.find((v) => v.site === "YouTube" && v.type === "Clip")

    const topCast = credits?.cast?.slice(0, 10) || []
    const director = credits?.crew?.find((c) => c.job === "Director")
    const writers =
      credits?.crew
        ?.filter((c) => c.department === "Writing" && ["Writer", "Screenplay", "Story"].includes(c.job))
        .slice(0, 3) || []
    const cinematographer = credits?.crew?.find((c) => c.job === "Director of Photography")
    const composer = credits?.crew?.find((c) => c.job === "Original Music Composer")

    // Transform to expected format
    const movie = {
      id: tmdbMovie.id,
      tmdbId: tmdbMovie.id,
      title: tmdbMovie.title,
      tagline: tmdbMovie.tagline,
      overview: tmdbMovie.overview,
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      releaseDate: tmdbMovie.release_date,
      runtimeMinutes: tmdbMovie.runtime,
      tmdbVoteAverage: tmdbMovie.vote_average,
      tmdbVoteCount: tmdbMovie.vote_count,
      tmdbPopularity: tmdbMovie.popularity,
      originalLanguage: tmdbMovie.original_language,
      genres: tmdbMovie.genres || [],
      budget: tmdbMovie.budget,
      revenue: tmdbMovie.revenue,
      status: tmdbMovie.status,
      imdbId: tmdbMovie.imdb_id,
      homepage: tmdbMovie.homepage,
      productionCompanies: tmdbMovie.production_companies || [],
      // Videos
      trailer: trailer
        ? {
            key: trailer.key,
            name: trailer.name,
            site: trailer.site,
          }
        : null,
      clip: clip
        ? {
            key: clip.key,
            name: clip.name,
            site: clip.site,
          }
        : null,
      // Credits
      cast: topCast.map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
      })),
      director: director
        ? {
            id: director.id,
            name: director.name,
            profilePath: director.profile_path,
          }
        : null,
      writers: writers.map((w) => ({
        id: w.id,
        name: w.name,
        job: w.job,
      })),
      cinematographer: cinematographer
        ? {
            id: cinematographer.id,
            name: cinematographer.name,
          }
        : null,
      composer: composer
        ? {
            id: composer.id,
            name: composer.name,
          }
        : null,
    }

    return NextResponse.json(movie)
  } catch (error) {
    console.error("[v0] Error fetching movie from TMDB:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch movie" },
      { status: 500 },
    )
  }
}
