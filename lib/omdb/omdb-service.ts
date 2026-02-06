/**
 * OMDb API Service
 * Fetches movie ratings from OMDb (IMDb, Rotten Tomatoes, Metacritic)
 * Used internally for recommendation quality scoring — never exposed to clients
 */

const OMDB_BASE_URL = "https://www.omdbapi.com"

export type OmdbRatings = {
  imdbRating: number | null     // 0-10 scale
  imdbVotes: number | null      // raw vote count
  rottenTomatoesScore: number | null  // 0-100 percentage
  metacriticScore: number | null      // 0-100 score
  rated: string | null          // "PG-13", "R", etc.
}

type OmdbApiResponse = {
  Response: "True" | "False"
  Error?: string
  imdbRating?: string
  imdbVotes?: string
  Metascore?: string
  Rated?: string
  Ratings?: Array<{ Source: string; Value: string }>
}

function parseImdbRating(raw: string | undefined): number | null {
  if (!raw || raw === "N/A") return null
  const parsed = parseFloat(raw)
  return isNaN(parsed) ? null : parsed
}

function parseImdbVotes(raw: string | undefined): number | null {
  if (!raw || raw === "N/A") return null
  const cleaned = raw.replace(/,/g, "")
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? null : parsed
}

function parseRottenTomatoesScore(ratings: Array<{ Source: string; Value: string }> | undefined): number | null {
  if (!ratings) return null
  const rt = ratings.find(r => r.Source === "Rotten Tomatoes")
  if (!rt) return null
  const match = rt.Value.match(/^(\d+)%$/)
  return match ? parseInt(match[1], 10) : null
}

function parseMetacriticScore(raw: string | undefined): number | null {
  if (!raw || raw === "N/A") return null
  const parsed = parseInt(raw, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * Fetch OMDb data by IMDb ID (e.g. "tt0133093")
 * Returns parsed ratings or null on failure
 */
export async function fetchOmdbByImdbId(imdbId: string): Promise<OmdbRatings | null> {
  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey) {
    console.warn("[OMDb] OMDB_API_KEY not configured")
    return null
  }

  try {
    const url = `${OMDB_BASE_URL}/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (!response.ok) {
      console.error(`[OMDb] HTTP ${response.status} for ${imdbId}`)
      return null
    }

    const data: OmdbApiResponse = await response.json()

    if (data.Response === "False") {
      console.warn(`[OMDb] API error for ${imdbId}: ${data.Error}`)
      return null
    }

    return {
      imdbRating: parseImdbRating(data.imdbRating),
      imdbVotes: parseImdbVotes(data.imdbVotes),
      rottenTomatoesScore: parseRottenTomatoesScore(data.Ratings),
      metacriticScore: parseMetacriticScore(data.Metascore),
      rated: data.Rated && data.Rated !== "N/A" ? data.Rated : null,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error(`[OMDb] Timeout fetching ${imdbId}`)
    } else {
      console.error(`[OMDb] Error fetching ${imdbId}:`, error)
    }
    return null
  }
}

/**
 * Fetch OMDb data by title and optional year
 * Fallback when IMDb ID is not available
 */
export async function fetchOmdbByTitle(title: string, year?: number): Promise<OmdbRatings | null> {
  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey) {
    console.warn("[OMDb] OMDB_API_KEY not configured")
    return null
  }

  try {
    let url = `${OMDB_BASE_URL}/?t=${encodeURIComponent(title)}&type=movie&apikey=${apiKey}`
    if (year) {
      url += `&y=${year}`
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (!response.ok) {
      console.error(`[OMDb] HTTP ${response.status} for title "${title}"`)
      return null
    }

    const data: OmdbApiResponse = await response.json()

    if (data.Response === "False") {
      return null
    }

    return {
      imdbRating: parseImdbRating(data.imdbRating),
      imdbVotes: parseImdbVotes(data.imdbVotes),
      rottenTomatoesScore: parseRottenTomatoesScore(data.Ratings),
      metacriticScore: parseMetacriticScore(data.Metascore),
      rated: data.Rated && data.Rated !== "N/A" ? data.Rated : null,
    }
  } catch (error) {
    console.error(`[OMDb] Error fetching title "${title}":`, error)
    return null
  }
}
