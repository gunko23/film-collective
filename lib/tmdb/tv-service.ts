import { neon } from "@neondatabase/serverless"
import { createTMDBClient, type TMDBTVShow } from "./client"

const sql = neon(process.env.DATABASE_URL!)

export type LocalTVShow = {
  id: number
  name: string
  originalName: string | null
  overview: string | null
  firstAirDate: string | null
  lastAirDate: string | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  posterPath: string | null
  backdropPath: string | null
  originalLanguage: string | null
  genres: { id: number; name: string }[] | null
  popularity: number | null
  voteAverage: number | null
  voteCount: number | null
  createdAt: string
  updatedAt: string
}

function transformTVShow(row: any): LocalTVShow {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    overview: row.overview,
    firstAirDate: row.first_air_date,
    lastAirDate: row.last_air_date,
    numberOfSeasons: row.number_of_seasons,
    numberOfEpisodes: row.number_of_episodes,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    originalLanguage: row.original_language,
    genres: row.genres,
    popularity: row.popularity ? Number(row.popularity) : null,
    voteAverage: row.vote_average ? Number(row.vote_average) : null,
    voteCount: row.vote_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getOrFetchTVShow(tmdbId: number): Promise<LocalTVShow | null> {
  // Check local database first
  try {
    const existing = await sql`
      SELECT * FROM tv_shows WHERE id = ${tmdbId}
    `

    if (existing.length > 0) {
      return transformTVShow(existing[0])
    }
  } catch (dbError) {
    console.error("Database lookup error:", dbError)
  }

  // Not in local DB - fetch from TMDB and cache
  const client = createTMDBClient()
  if (!client) {
    throw new Error("TMDB API key not configured")
  }

  try {
    const tmdbShow = await client.getTVShowDetails(tmdbId)
    return await cacheTVShow(tmdbShow)
  } catch (error) {
    console.error("Failed to fetch TV show from TMDB:", error)
    return null
  }
}

export async function cacheTVShow(tmdbShow: TMDBTVShow): Promise<LocalTVShow> {
  const genres = tmdbShow.genres ? JSON.stringify(tmdbShow.genres) : null
  const networks = tmdbShow.networks ? JSON.stringify(tmdbShow.networks) : null
  const createdBy = tmdbShow.created_by ? JSON.stringify(tmdbShow.created_by) : null
  const productionCompanies = tmdbShow.production_companies ? JSON.stringify(tmdbShow.production_companies) : null
  const episodeRunTime = tmdbShow.episode_run_time || []
  const originCountry = tmdbShow.origin_country || []

  const result = await sql`
    INSERT INTO tv_shows (
      id, name, original_name, overview, first_air_date,
      last_air_date, number_of_seasons, number_of_episodes,
      poster_path, backdrop_path, original_language,
      genres, popularity, vote_average, vote_count,
      status, tagline, type, homepage, in_production,
      networks, created_by, production_companies,
      episode_run_time, origin_country
    ) VALUES (
      ${tmdbShow.id},
      ${tmdbShow.name},
      ${tmdbShow.original_name},
      ${tmdbShow.overview},
      ${tmdbShow.first_air_date || null},
      ${tmdbShow.last_air_date || null},
      ${tmdbShow.number_of_seasons || null},
      ${tmdbShow.number_of_episodes || null},
      ${tmdbShow.poster_path},
      ${tmdbShow.backdrop_path},
      ${tmdbShow.original_language},
      ${genres},
      ${tmdbShow.popularity},
      ${tmdbShow.vote_average},
      ${tmdbShow.vote_count},
      ${tmdbShow.status || null},
      ${tmdbShow.tagline || null},
      ${tmdbShow.type || null},
      ${tmdbShow.homepage || null},
      ${tmdbShow.in_production || false},
      ${networks},
      ${createdBy},
      ${productionCompanies},
      ${episodeRunTime},
      ${originCountry}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      original_name = EXCLUDED.original_name,
      overview = EXCLUDED.overview,
      first_air_date = EXCLUDED.first_air_date,
      last_air_date = EXCLUDED.last_air_date,
      number_of_seasons = EXCLUDED.number_of_seasons,
      number_of_episodes = EXCLUDED.number_of_episodes,
      poster_path = EXCLUDED.poster_path,
      backdrop_path = EXCLUDED.backdrop_path,
      original_language = EXCLUDED.original_language,
      genres = EXCLUDED.genres,
      popularity = EXCLUDED.popularity,
      vote_average = EXCLUDED.vote_average,
      vote_count = EXCLUDED.vote_count,
      status = EXCLUDED.status,
      tagline = EXCLUDED.tagline,
      type = EXCLUDED.type,
      homepage = EXCLUDED.homepage,
      in_production = EXCLUDED.in_production,
      networks = EXCLUDED.networks,
      created_by = EXCLUDED.created_by,
      production_companies = EXCLUDED.production_companies,
      episode_run_time = EXCLUDED.episode_run_time,
      origin_country = EXCLUDED.origin_country,
      updated_at = NOW()
    RETURNING *
  `

  return transformTVShow(result[0])
}

export async function getOrFetchEpisode(
  tvShowId: number,
  seasonNumber: number,
  episodeId: number,
): Promise<{ episodeId: number; tvShowId: number } | null> {
  // First ensure the TV show exists
  const tvShow = await getOrFetchTVShow(tvShowId)
  if (!tvShow) {
    console.error("Failed to get/fetch TV show:", tvShowId)
    return null
  }

  // Check if episode already exists
  try {
    const existingEpisode = await sql`
      SELECT id FROM tv_episodes WHERE id = ${episodeId}
    `
    if (existingEpisode.length > 0) {
      return { episodeId, tvShowId }
    }
  } catch (dbError) {
    console.error("Database lookup error for episode:", dbError)
  }

  // Fetch season details from TMDB (includes all episodes)
  const client = createTMDBClient()
  if (!client) {
    throw new Error("TMDB API key not configured")
  }

  try {
    const seasonDetails = await client.getTVSeasonDetails(tvShowId, seasonNumber)

    // Cache the season first
    await sql`
      INSERT INTO tv_seasons (
        id, tv_show_id, season_number, name, overview,
        poster_path, air_date, episode_count, vote_average
      ) VALUES (
        ${seasonDetails.id},
        ${tvShowId},
        ${seasonDetails.season_number},
        ${seasonDetails.name},
        ${seasonDetails.overview},
        ${seasonDetails.poster_path},
        ${seasonDetails.air_date || null},
        ${seasonDetails.episodes?.length || 0},
        ${seasonDetails.vote_average || 0}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        overview = EXCLUDED.overview,
        poster_path = EXCLUDED.poster_path,
        air_date = EXCLUDED.air_date,
        episode_count = EXCLUDED.episode_count,
        vote_average = EXCLUDED.vote_average,
        updated_at = NOW()
    `

    // Cache all episodes from this season
    for (const episode of seasonDetails.episodes || []) {
      const crew = episode.crew ? JSON.stringify(episode.crew) : null
      const guestStars = episode.guest_stars ? JSON.stringify(episode.guest_stars) : null

      await sql`
        INSERT INTO tv_episodes (
          id, tv_show_id, season_id, season_number, episode_number,
          name, overview, still_path, air_date, runtime,
          vote_average, vote_count, crew, guest_stars
        ) VALUES (
          ${episode.id},
          ${tvShowId},
          ${seasonDetails.id},
          ${episode.season_number},
          ${episode.episode_number},
          ${episode.name},
          ${episode.overview},
          ${episode.still_path},
          ${episode.air_date || null},
          ${episode.runtime || null},
          ${episode.vote_average || 0},
          ${episode.vote_count || 0},
          ${crew},
          ${guestStars}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          overview = EXCLUDED.overview,
          still_path = EXCLUDED.still_path,
          air_date = EXCLUDED.air_date,
          runtime = EXCLUDED.runtime,
          vote_average = EXCLUDED.vote_average,
          vote_count = EXCLUDED.vote_count,
          crew = EXCLUDED.crew,
          guest_stars = EXCLUDED.guest_stars,
          updated_at = NOW()
      `
    }

    return { episodeId, tvShowId }
  } catch (error) {
    console.error("Failed to fetch/cache episode from TMDB:", error)
    return null
  }
}
