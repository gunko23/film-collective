import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"

const TMDB_API_KEY = process.env.TMDB_API_KEY

type LetterboxdRating = {
  name: string
  year: string
  letterboxdUri: string
  rating: string // "0.5" to "5.0" in 0.5 increments
  watchedDate?: string
  rewatch?: string
}

type LetterboxdWatchlistItem = {
  name: string
  year: string
  letterboxdUri: string
}

/**
 * Search TMDB for a movie by title and year
 */
async function searchTMDBMovie(title: string, year: string): Promise<number | null> {
  if (!TMDB_API_KEY) return null

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`
    const res = await fetch(searchUrl)
    
    if (!res.ok) return null
    
    const data = await res.json()
    
    if (data.results && data.results.length > 0) {
      // Return the first result's ID
      return data.results[0].id
    }
    
    // Try without year if no results
    const searchUrlNoYear = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    const resNoYear = await fetch(searchUrlNoYear)
    
    if (!resNoYear.ok) return null
    
    const dataNoYear = await resNoYear.json()
    
    if (dataNoYear.results && dataNoYear.results.length > 0) {
      return dataNoYear.results[0].id
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Ensure a movie exists in our database, fetching from TMDB if needed
 */
async function ensureMovieExists(tmdbId: number): Promise<string | null> {
  // Check if movie already exists
  const existing = await sql`
    SELECT id FROM movies WHERE tmdb_id = ${tmdbId}
  `
  
  if (existing.length > 0) {
    return existing[0].id
  }
  
  // Fetch from TMDB and insert
  if (!TMDB_API_KEY) return null
  
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    )
    
    if (!res.ok) return null
    
    const movie = await res.json()
    
    const inserted = await sql`
      INSERT INTO movies (
        tmdb_id, title, original_title, overview, release_date,
        runtime_minutes, poster_path, backdrop_path, original_language,
        genres, tmdb_popularity, tmdb_vote_average, tmdb_vote_count
      ) VALUES (
        ${movie.id},
        ${movie.title},
        ${movie.original_title},
        ${movie.overview},
        ${movie.release_date || null},
        ${movie.runtime || null},
        ${movie.poster_path},
        ${movie.backdrop_path},
        ${movie.original_language},
        ${JSON.stringify(movie.genres || [])},
        ${movie.popularity},
        ${movie.vote_average},
        ${movie.vote_count}
      )
      ON CONFLICT (tmdb_id) DO UPDATE SET
        title = EXCLUDED.title,
        updated_at = NOW()
      RETURNING id
    `
    
    return inserted[0]?.id || null
  } catch (error) {
    console.error(`Failed to fetch movie ${tmdbId} from TMDB:`, error)
    return null
  }
}

/**
 * Convert Letterboxd 0.5-5.0 rating to our 0-100 scale
 */
function convertRating(letterboxdRating: string): number {
  const rating = parseFloat(letterboxdRating)
  // Letterboxd: 0.5-5.0 → Our scale: 0-100
  return Math.round((rating / 5) * 100)
}

/**
 * POST /api/user/import/letterboxd
 * 
 * Accepts Letterboxd CSV data and imports ratings/watchlist
 */
export async function POST(request: Request) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { type, data } = await request.json()
    
    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid request. Expected { type: 'ratings' | 'watchlist', data: [...] }" },
        { status: 400 }
      )
    }

    // Get user's internal ID
    const userResult = await sql`
      SELECT id FROM users WHERE id = ${user.id}::uuid
    `
    
    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const userId = userResult[0].id

    if (type === "ratings") {
      return await importRatings(userId, data as LetterboxdRating[])
    } else if (type === "watchlist") {
      return await importWatchlist(userId, data as LetterboxdWatchlistItem[])
    } else {
      return NextResponse.json({ error: "Invalid type. Use 'ratings' or 'watchlist'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Letterboxd import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    )
  }
}

async function importRatings(userId: string, ratings: LetterboxdRating[]) {
  let imported = 0
  let skipped = 0
  let notFound = 0
  let failed = 0
  const errors: string[] = []

  for (const item of ratings) {
    try {
      // Skip entries without ratings
      if (!item.rating) {
        skipped++
        continue
      }

      // Search for movie on TMDB
      const tmdbId = await searchTMDBMovie(item.name, item.year)
      
      if (!tmdbId) {
        notFound++
        if (errors.length < 10) {
          errors.push(`Not found: "${item.name}" (${item.year})`)
        }
        continue
      }

      // Ensure movie exists in our database
      const movieId = await ensureMovieExists(tmdbId)
      
      if (!movieId) {
        failed++
        continue
      }

      // Convert rating
      const overallScore = convertRating(item.rating)

      // Insert or update rating
      await sql`
        INSERT INTO user_movie_ratings (
          user_id, movie_id, overall_score, rated_at, extra_notes
        ) VALUES (
          ${userId}::uuid,
          ${movieId}::uuid,
          ${overallScore},
          ${item.watchedDate ? new Date(item.watchedDate) : new Date()},
          ${'Imported from Letterboxd'}
        )
        ON CONFLICT (user_id, movie_id) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          updated_at = NOW()
      `

      imported++

      // Small delay to avoid rate limiting
      if (imported % 10 === 0) {
        await new Promise(r => setTimeout(r, 100))
      }
    } catch (error) {
      failed++
      console.error(`Failed to import "${item.name}":`, error)
    }
  }

  return NextResponse.json({
    success: true,
    type: "ratings",
    summary: {
      total: ratings.length,
      imported,
      skipped,
      notFound,
      failed,
    },
    errors: errors.length > 0 ? errors : undefined,
  })
}

async function importWatchlist(userId: string, watchlist: LetterboxdWatchlistItem[]) {
  let imported = 0
  let skipped = 0
  let notFound = 0
  let failed = 0
  const errors: string[] = []

  for (const item of watchlist) {
    try {
      // Search for movie on TMDB
      const tmdbId = await searchTMDBMovie(item.name, item.year)
      
      if (!tmdbId) {
        notFound++
        if (errors.length < 10) {
          errors.push(`Not found: "${item.name}" (${item.year})`)
        }
        continue
      }

      // Ensure movie exists in our database
      const movieId = await ensureMovieExists(tmdbId)
      
      if (!movieId) {
        failed++
        continue
      }

      // Check if already in watchlist
      const existing = await sql`
        SELECT id FROM user_watchlist_entries 
        WHERE user_id = ${userId}::uuid AND movie_id = ${movieId}::uuid
      `
      
      if (existing.length > 0) {
        skipped++
        continue
      }

      // Add to watchlist
      await sql`
        INSERT INTO user_watchlist_entries (user_id, movie_id)
        VALUES (${userId}::uuid, ${movieId}::uuid)
        ON CONFLICT (user_id, movie_id) DO NOTHING
      `

      imported++

      // Small delay to avoid rate limiting
      if (imported % 10 === 0) {
        await new Promise(r => setTimeout(r, 100))
      }
    } catch (error) {
      failed++
      console.error(`Failed to import "${item.name}":`, error)
    }
  }

  return NextResponse.json({
    success: true,
    type: "watchlist",
    summary: {
      total: watchlist.length,
      imported,
      skipped,
      notFound,
      failed,
    },
    errors: errors.length > 0 ? errors : undefined,
  })
}