import { sql } from "@/lib/db"
import { createTMDBClient, type TMDBMovie } from "./client"

export type LocalMovie = {
  id: string // UUID
  tmdbId: number
  title: string
  originalTitle: string | null
  overview: string | null
  releaseDate: string | null
  runtimeMinutes: number | null
  posterPath: string | null
  backdropPath: string | null
  originalLanguage: string | null
  genres: { id: number; name: string }[] | null
  tmdbPopularity: number | null
  tmdbVoteAverage: number | null
  tmdbVoteCount: number | null
  createdAt: string
  updatedAt: string
}

// Transform raw DB row to LocalMovie
function transformMovie(row: any): LocalMovie {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    title: row.title,
    originalTitle: row.original_title,
    overview: row.overview,
    releaseDate: row.release_date,
    runtimeMinutes: row.runtime_minutes,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    originalLanguage: row.original_language,
    genres: row.genres,
    tmdbPopularity: row.tmdb_popularity ? Number(row.tmdb_popularity) : null,
    tmdbVoteAverage: row.tmdb_vote_average ? Number(row.tmdb_vote_average) : null,
    tmdbVoteCount: row.tmdb_vote_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function transformTmdbToLocal(tmdbMovie: TMDBMovie): LocalMovie {
  return {
    id: `tmdb-${tmdbMovie.id}`,
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    originalTitle: tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    releaseDate: tmdbMovie.release_date,
    runtimeMinutes: tmdbMovie.runtime || null,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    originalLanguage: tmdbMovie.original_language,
    genres: tmdbMovie.genres || null,
    tmdbPopularity: tmdbMovie.popularity,
    tmdbVoteAverage: tmdbMovie.vote_average,
    tmdbVoteCount: tmdbMovie.vote_count,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Get movie by TMDB ID - checks local DB first, fetches from TMDB if not found
export async function getOrFetchMovie(tmdbId: number): Promise<LocalMovie | null> {
  console.log("[v0] getOrFetchMovie called with tmdbId:", tmdbId)

  // Check local database first
  try {
    const existing = await sql`
      SELECT * FROM movies WHERE tmdb_id = ${tmdbId}
    `
    console.log("[v0] Local DB lookup result:", existing.length > 0 ? "found" : "not found")

    if (existing.length > 0) {
      return transformMovie(existing[0])
    }
  } catch (dbError) {
    console.error("[v0] Database lookup error:", dbError)
    // Continue to fetch from TMDB even if DB lookup fails
  }

  // Not in local DB - fetch from TMDB
  const client = createTMDBClient()
  if (!client) {
    console.error("[v0] TMDB client not available - API key missing?")
    throw new Error("TMDB API key not configured")
  }

  try {
    console.log("[v0] Fetching from TMDB...")
    const tmdbMovie = await client.getMovieDetails(tmdbId)
    console.log("[v0] TMDB fetch successful:", tmdbMovie.title)

    try {
      return await cacheMovie(tmdbMovie)
    } catch (cacheError) {
      console.error("[v0] Failed to cache movie, returning TMDB data directly:", cacheError)
      // Return TMDB data directly without caching
      return transformTmdbToLocal(tmdbMovie)
    }
  } catch (error) {
    console.error("[v0] Failed to fetch movie from TMDB:", error)
    return null
  }
}

// Get movie by local UUID
export async function getMovieById(id: string): Promise<LocalMovie | null> {
  const result = await sql`
    SELECT * FROM movies WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  return transformMovie(result[0])
}

// Get movie by TMDB ID (local only, no fetch)
export async function getMovieByTmdbId(tmdbId: number): Promise<LocalMovie | null> {
  const result = await sql`
    SELECT * FROM movies WHERE tmdb_id = ${tmdbId}
  `

  if (result.length === 0) {
    return null
  }

  return transformMovie(result[0])
}

// Cache a TMDB movie in local database
export async function cacheMovie(tmdbMovie: TMDBMovie): Promise<LocalMovie> {
  console.log("[v0] cacheMovie called for:", tmdbMovie.title)
  console.log("[v0] genres:", tmdbMovie.genres)

  const genres = tmdbMovie.genres ? JSON.stringify(tmdbMovie.genres) : null
  console.log("[v0] stringified genres:", genres)

  try {
    const result = await sql`
      INSERT INTO movies (
        tmdb_id, title, original_title, overview, release_date,
        runtime_minutes, poster_path, backdrop_path, original_language,
        genres, tmdb_popularity, tmdb_vote_average, tmdb_vote_count
      ) VALUES (
        ${tmdbMovie.id},
        ${tmdbMovie.title},
        ${tmdbMovie.original_title},
        ${tmdbMovie.overview},
        ${tmdbMovie.release_date || null},
        ${tmdbMovie.runtime || null},
        ${tmdbMovie.poster_path},
        ${tmdbMovie.backdrop_path},
        ${tmdbMovie.original_language},
        ${genres},
        ${tmdbMovie.popularity},
        ${tmdbMovie.vote_average},
        ${tmdbMovie.vote_count}
      )
      ON CONFLICT (tmdb_id) DO UPDATE SET
        title = EXCLUDED.title,
        original_title = EXCLUDED.original_title,
        overview = EXCLUDED.overview,
        release_date = EXCLUDED.release_date,
        runtime_minutes = EXCLUDED.runtime_minutes,
        poster_path = EXCLUDED.poster_path,
        backdrop_path = EXCLUDED.backdrop_path,
        original_language = EXCLUDED.original_language,
        genres = EXCLUDED.genres,
        tmdb_popularity = EXCLUDED.tmdb_popularity,
        tmdb_vote_average = EXCLUDED.tmdb_vote_average,
        tmdb_vote_count = EXCLUDED.tmdb_vote_count,
        updated_at = NOW()
      RETURNING *
    `
    console.log("[v0] Insert successful, result:", result[0]?.title)
    return transformMovie(result[0])
  } catch (insertError) {
    console.error("[v0] Database insert error:", insertError)
    throw insertError
  }
}

// Search movies via TMDB (returns TMDB results, not local)
export async function searchMovies(query: string, page = 1) {
  const client = createTMDBClient()
  if (!client) {
    throw new Error("TMDB API key not configured")
  }

  return client.searchMovies(query, page)
}

// Get popular movies from TMDB
export async function getPopularMovies(page = 1) {
  const client = createTMDBClient()
  if (!client) {
    throw new Error("TMDB API key not configured")
  }

  return client.getPopularMovies(page)
}

// Get locally cached movies with pagination
export async function getCachedMovies(
  options: {
    page?: number
    limit?: number
    search?: string
    sortBy?: "popularity" | "rating" | "title" | "date"
  } = {},
): Promise<{ movies: LocalMovie[]; total: number }> {
  const { page = 1, limit = 20, search, sortBy = "popularity" } = options
  const offset = (page - 1) * limit

  const sortMap: Record<string, string> = {
    popularity: "tmdb_popularity DESC NULLS LAST",
    rating: "tmdb_vote_average DESC NULLS LAST",
    title: "title ASC",
    date: "release_date DESC NULLS LAST",
  }
  const orderClause = sortMap[sortBy] || sortMap.popularity

  let results: any[]
  let countResult: any[]

  if (search) {
    results = await sql`
      SELECT * FROM movies
      WHERE title ILIKE ${"%" + search + "%"}
      ORDER BY ${sql.unsafe(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `
    countResult = await sql`
      SELECT COUNT(*) as count FROM movies
      WHERE title ILIKE ${"%" + search + "%"}
    `
  } else {
    results = await sql`
      SELECT * FROM movies
      ORDER BY ${sql.unsafe(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `
    countResult = await sql`SELECT COUNT(*) as count FROM movies`
  }

  return {
    movies: results.map(transformMovie),
    total: Number(countResult[0]?.count || 0),
  }
}

// Get movie by internal (numeric) ID with genres from movie_genres/genres tables
export async function getMovieByInternalId(movieId: number): Promise<{ movie: any; genres: any[] } | null> {
  const movieResult = await sql`
    SELECT * FROM movies WHERE id = ${movieId}
  `

  if (movieResult.length === 0) {
    return null
  }

  const genresResult = await sql`
    SELECT g.id, g.name
    FROM genres g
    JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id = ${movieId}
  `

  return { movie: movieResult[0], genres: genresResult }
}

// Get media info for movie or TV show by TMDB ID
export async function getMediaInfo(tmdbId: number, mediaType: "movie" | "tv") {
  if (mediaType === "tv") {
    const result = await sql`
      SELECT 
        id::int as tmdb_id,
        name as title,
        poster_path,
        first_air_date as release_date,
        overview,
        vote_average,
        'tv' as media_type
      FROM tv_shows
      WHERE id = ${tmdbId}
    `
    return result[0] || null
  }

  const result = await sql`
    SELECT 
      tmdb_id::int,
      title,
      poster_path,
      release_date,
      overview,
      tmdb_vote_average as vote_average,
      'movie' as media_type
    FROM movies
    WHERE tmdb_id = ${tmdbId}
  `
  return result[0] || null
}
