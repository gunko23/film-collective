import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "./client"
import type { TMDBMovie, TMDBCredits } from "./client"

const sql = neon(process.env.DATABASE_URL!)

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type SyncResult = {
  success: boolean
  message: string
  itemsProcessed: number
  errors?: string[]
}

// ... existing code for syncGenres and upsertMovie stays the same ...

// Sync all genres from TMDB
export async function syncGenres(): Promise<SyncResult> {
  const client = createTMDBClient()
  if (!client) {
    return { success: false, message: "TMDB API key not configured", itemsProcessed: 0 }
  }

  // Create log entry
  const logResult = await sql`
    INSERT INTO sync_log (sync_type, status, started_at)
    VALUES ('genres', 'running', NOW())
    RETURNING id
  `
  const logId = logResult[0].id

  try {
    const tmdbGenres = await client.getGenres()

    for (const genre of tmdbGenres) {
      await sql`
        INSERT INTO genres (id, name)
        VALUES (${genre.id}, ${genre.name})
        ON CONFLICT (id) DO UPDATE SET name = ${genre.name}
      `
    }

    await sql`
      UPDATE sync_log
      SET status = 'completed', items_processed = ${tmdbGenres.length}, total_items = ${tmdbGenres.length}, completed_at = NOW()
      WHERE id = ${logId}
    `

    return {
      success: true,
      message: `Synced ${tmdbGenres.length} genres`,
      itemsProcessed: tmdbGenres.length,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await sql`
      UPDATE sync_log
      SET status = 'failed', error_message = ${errorMessage}, completed_at = NOW()
      WHERE id = ${logId}
    `
    return { success: false, message: errorMessage, itemsProcessed: 0 }
  }
}

// Helper to upsert a movie
async function upsertMovie(tmdbMovie: TMDBMovie) {
  await sql`
    INSERT INTO movies (
      id, title, original_title, overview, tagline, poster_path, backdrop_path,
      release_date, runtime, vote_average, vote_count, popularity, adult, status,
      original_language, budget, revenue, imdb_id, homepage,
      production_companies, production_countries, spoken_languages,
      last_synced_at, updated_at
    )
    VALUES (
      ${tmdbMovie.id},
      ${tmdbMovie.title},
      ${tmdbMovie.original_title},
      ${tmdbMovie.overview},
      ${tmdbMovie.tagline || null},
      ${tmdbMovie.poster_path},
      ${tmdbMovie.backdrop_path},
      ${tmdbMovie.release_date},
      ${tmdbMovie.runtime || null},
      ${tmdbMovie.vote_average},
      ${tmdbMovie.vote_count},
      ${tmdbMovie.popularity},
      ${tmdbMovie.adult},
      ${tmdbMovie.status || null},
      ${tmdbMovie.original_language},
      ${tmdbMovie.budget || null},
      ${tmdbMovie.revenue || null},
      ${tmdbMovie.imdb_id || null},
      ${tmdbMovie.homepage || null},
      ${tmdbMovie.production_companies ? JSON.stringify(tmdbMovie.production_companies) : null},
      ${tmdbMovie.production_countries ? JSON.stringify(tmdbMovie.production_countries) : null},
      ${tmdbMovie.spoken_languages ? JSON.stringify(tmdbMovie.spoken_languages) : null},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = ${tmdbMovie.title},
      original_title = ${tmdbMovie.original_title},
      overview = ${tmdbMovie.overview},
      tagline = ${tmdbMovie.tagline || null},
      poster_path = ${tmdbMovie.poster_path},
      backdrop_path = ${tmdbMovie.backdrop_path},
      release_date = ${tmdbMovie.release_date},
      runtime = ${tmdbMovie.runtime || null},
      vote_average = ${tmdbMovie.vote_average},
      vote_count = ${tmdbMovie.vote_count},
      popularity = ${tmdbMovie.popularity},
      adult = ${tmdbMovie.adult},
      status = ${tmdbMovie.status || null},
      original_language = ${tmdbMovie.original_language},
      budget = ${tmdbMovie.budget || null},
      revenue = ${tmdbMovie.revenue || null},
      imdb_id = ${tmdbMovie.imdb_id || null},
      homepage = ${tmdbMovie.homepage || null},
      production_companies = ${tmdbMovie.production_companies ? JSON.stringify(tmdbMovie.production_companies) : null},
      production_countries = ${tmdbMovie.production_countries ? JSON.stringify(tmdbMovie.production_countries) : null},
      spoken_languages = ${tmdbMovie.spoken_languages ? JSON.stringify(tmdbMovie.spoken_languages) : null},
      last_synced_at = NOW(),
      updated_at = NOW()
  `

  // Sync genre relationships if available
  if (tmdbMovie.genres) {
    // Remove existing genre relationships
    await sql`DELETE FROM movie_genres WHERE movie_id = ${tmdbMovie.id}`

    // Add new genre relationships
    for (const genre of tmdbMovie.genres) {
      await sql`
        INSERT INTO movie_genres (movie_id, genre_id)
        VALUES (${tmdbMovie.id}, ${genre.id})
        ON CONFLICT DO NOTHING
      `
    }
  }
}

// Sync popular movies - uses basic data from list to avoid rate limiting
export async function syncPopularMovies(pages = 1): Promise<SyncResult> {
  const client = createTMDBClient()
  if (!client) {
    return { success: false, message: "TMDB API key not configured", itemsProcessed: 0 }
  }

  const logResult = await sql`
    INSERT INTO sync_log (sync_type, status, metadata, started_at)
    VALUES ('popular', 'running', ${JSON.stringify({ pages })}, NOW())
    RETURNING id
  `
  const logId = logResult[0].id

  const errors: string[] = []
  let totalProcessed = 0

  try {
    for (let page = 1; page <= pages; page++) {
      const response = await client.getPopularMovies(page)

      for (const movie of response.results) {
        try {
          // Use basic movie data from the list - no extra API call needed
          // This avoids rate limiting issues
          await sql`
            INSERT INTO movies (
              id, title, original_title, overview, poster_path, backdrop_path,
              release_date, vote_average, vote_count, popularity, adult,
              original_language, last_synced_at, updated_at
            )
            VALUES (
              ${movie.id},
              ${movie.title},
              ${movie.original_title},
              ${movie.overview},
              ${movie.poster_path},
              ${movie.backdrop_path},
              ${movie.release_date},
              ${movie.vote_average},
              ${movie.vote_count},
              ${movie.popularity},
              ${movie.adult},
              ${movie.original_language},
              NOW(),
              NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              title = ${movie.title},
              original_title = ${movie.original_title},
              overview = ${movie.overview},
              poster_path = ${movie.poster_path},
              backdrop_path = ${movie.backdrop_path},
              release_date = ${movie.release_date},
              vote_average = ${movie.vote_average},
              vote_count = ${movie.vote_count},
              popularity = ${movie.popularity},
              adult = ${movie.adult},
              original_language = ${movie.original_language},
              last_synced_at = NOW(),
              updated_at = NOW()
          `
          totalProcessed++
        } catch (error) {
          errors.push(`Failed to sync movie ${movie.id}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      // Delay between pages to be safe
      if (page < pages) {
        await delay(500)
      }
    }

    await sql`
      UPDATE sync_log
      SET status = 'completed', items_processed = ${totalProcessed}, total_items = ${pages * 20},
          error_message = ${errors.length > 0 ? errors.join("; ") : null}, completed_at = NOW()
      WHERE id = ${logId}
    `

    return {
      success: true,
      message: `Synced ${totalProcessed} popular movies`,
      itemsProcessed: totalProcessed,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await sql`
      UPDATE sync_log
      SET status = 'failed', items_processed = ${totalProcessed}, error_message = ${errorMessage}, completed_at = NOW()
      WHERE id = ${logId}
    `
    return { success: false, message: errorMessage, itemsProcessed: totalProcessed, errors }
  }
}

// Sync movie with full details and credits (makes 2 API calls per movie)
export async function syncMovieWithCredits(movieId: number): Promise<SyncResult> {
  const client = createTMDBClient()
  if (!client) {
    return { success: false, message: "TMDB API key not configured", itemsProcessed: 0 }
  }

  try {
    // Get movie details
    const movie = await client.getMovieDetails(movieId)
    await upsertMovie(movie)

    // Small delay before next request
    await delay(300)

    // Get and sync credits
    const credits = await client.getMovieCredits(movieId)
    await syncCredits(movieId, credits)

    return {
      success: true,
      message: `Synced movie "${movie.title}" with credits`,
      itemsProcessed: 1,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      itemsProcessed: 0,
    }
  }
}

// Helper to sync credits
async function syncCredits(movieId: number, credits: TMDBCredits) {
  // Remove existing credits for this movie
  await sql`DELETE FROM movie_credits WHERE movie_id = ${movieId}`

  // Sync cast (limit to top 10)
  const topCast = credits.cast.slice(0, 10)
  for (const member of topCast) {
    // Upsert person
    await sql`
      INSERT INTO people (id, name, profile_path, known_for_department)
      VALUES (${member.id}, ${member.name}, ${member.profile_path}, ${member.known_for_department})
      ON CONFLICT (id) DO UPDATE SET
        name = ${member.name},
        profile_path = ${member.profile_path},
        known_for_department = ${member.known_for_department},
        updated_at = NOW()
    `

    // Add credit
    await sql`
      INSERT INTO movie_credits (movie_id, person_id, credit_type, character, "order")
      VALUES (${movieId}, ${member.id}, 'cast', ${member.character}, ${member.order})
      ON CONFLICT DO NOTHING
    `
  }

  // Sync key crew (directors, writers, producers)
  const keyCrew = credits.crew
    .filter((c) => ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"].includes(c.job))
    .slice(0, 10)

  for (const member of keyCrew) {
    // Upsert person
    await sql`
      INSERT INTO people (id, name, profile_path, known_for_department)
      VALUES (${member.id}, ${member.name}, ${member.profile_path}, ${member.known_for_department})
      ON CONFLICT (id) DO UPDATE SET
        name = ${member.name},
        profile_path = ${member.profile_path},
        known_for_department = ${member.known_for_department},
        updated_at = NOW()
    `

    // Add credit
    await sql`
      INSERT INTO movie_credits (movie_id, person_id, credit_type, job, department)
      VALUES (${movieId}, ${member.id}, 'crew', ${member.job}, ${member.department})
      ON CONFLICT DO NOTHING
    `
  }
}

// Get sync history
export async function getSyncHistory(limit = 20) {
  const results = await sql`
    SELECT id, sync_type, status, items_processed, total_items, error_message, metadata, started_at, completed_at
    FROM sync_log
    ORDER BY started_at DESC
    LIMIT ${limit}
  `
  return results
}
