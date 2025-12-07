const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export type TMDBMovie = {
  id: number
  title: string
  original_title: string
  overview: string
  tagline?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  runtime?: number
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  status?: string
  original_language: string
  budget?: number
  revenue?: number
  imdb_id?: string
  homepage?: string
  genres?: { id: number; name: string }[]
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[]
  production_countries?: { iso_3166_1: string; name: string }[]
  spoken_languages?: { iso_639_1: string; name: string; english_name: string }[]
}

export type TMDBGenre = {
  id: number
  name: string
}

export type TMDBPerson = {
  id: number
  name: string
  profile_path: string | null
  biography?: string
  birthday?: string
  deathday?: string
  place_of_birth?: string
  known_for_department?: string
  popularity: number
  imdb_id?: string
  homepage?: string
}

export type TMDBCredits = {
  cast: {
    id: number
    name: string
    profile_path: string | null
    character: string
    order: number
    known_for_department: string
  }[]
  crew: {
    id: number
    name: string
    profile_path: string | null
    job: string
    department: string
    known_for_department: string
  }[]
}

export type TMDBVideo = {
  id: string
  key: string
  name: string
  site: string
  size: number
  type: "Trailer" | "Teaser" | "Clip" | "Featurette" | "Behind the Scenes" | "Bloopers"
  official: boolean
  published_at: string
}

export type TMDBVideosResponse = {
  id: number
  results: TMDBVideo[]
}

export type TMDBMovieListResponse = {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

class TMDBClient {
  private apiKey: string

  constructor() {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) {
      throw new Error("TMDB_API_KEY environment variable is not set")
    }
    this.apiKey = apiKey
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}, retries = 5): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.set("api_key", this.apiKey)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url.toString())

        // Handle rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After")
          // Wait longer: minimum 2 seconds, use Retry-After header if provided, or exponential backoff
          const waitTime = retryAfter
            ? Math.max(Number.parseInt(retryAfter, 10) * 1000, 2000)
            : Math.max(2000, Math.pow(2, attempt + 1) * 1000)
          console.log(`TMDB rate limited (attempt ${attempt + 1}/${retries}). Waiting ${waitTime}ms...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`TMDB API error ${response.status}: ${errorText.substring(0, 100)}`)
        }

        return response.json()
      } catch (error) {
        // If it's our own error, rethrow it
        if (error instanceof Error && error.message.startsWith("TMDB API error")) {
          throw error
        }
        // Network errors - retry with backoff
        if (attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt + 1) * 1000
          console.log(`Network error (attempt ${attempt + 1}/${retries}). Waiting ${waitTime}ms...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
        throw error
      }
    }

    throw new Error("TMDB API rate limit exceeded. Please wait a moment and try again.")
  }

  // Get all movie genres
  async getGenres(): Promise<TMDBGenre[]> {
    const data = await this.fetch<{ genres: TMDBGenre[] }>("/genre/movie/list")
    return data.genres
  }

  // Get popular movies
  async getPopularMovies(page = 1): Promise<TMDBMovieListResponse> {
    return this.fetch<TMDBMovieListResponse>("/movie/popular", { page: page.toString() })
  }

  // Get now playing movies
  async getNowPlayingMovies(page = 1): Promise<TMDBMovieListResponse> {
    return this.fetch<TMDBMovieListResponse>("/movie/now_playing", { page: page.toString() })
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1): Promise<TMDBMovieListResponse> {
    return this.fetch<TMDBMovieListResponse>("/movie/top_rated", { page: page.toString() })
  }

  // Get upcoming movies
  async getUpcomingMovies(page = 1): Promise<TMDBMovieListResponse> {
    return this.fetch<TMDBMovieListResponse>("/movie/upcoming", { page: page.toString() })
  }

  // Get movie details
  async getMovieDetails(movieId: number): Promise<TMDBMovie> {
    return this.fetch<TMDBMovie>(`/movie/${movieId}`)
  }

  // Get movie credits (cast and crew)
  async getMovieCredits(movieId: number): Promise<TMDBCredits> {
    return this.fetch<TMDBCredits>(`/movie/${movieId}/credits`)
  }

  // Get person details
  async getPersonDetails(personId: number): Promise<TMDBPerson> {
    return this.fetch<TMDBPerson>(`/person/${personId}`)
  }

  // Search movies
  async searchMovies(query: string, page = 1): Promise<TMDBMovieListResponse> {
    return this.fetch<TMDBMovieListResponse>("/search/movie", {
      query,
      page: page.toString(),
    })
  }

  // Discover movies with filters
  async discoverMovies(
    options: {
      page?: number
      sortBy?: string
      withGenres?: string
      year?: number
      voteAverageGte?: number
    } = {},
  ): Promise<TMDBMovieListResponse> {
    const params: Record<string, string> = {}
    if (options.page) params.page = options.page.toString()
    if (options.sortBy) params.sort_by = options.sortBy
    if (options.withGenres) params.with_genres = options.withGenres
    if (options.year) params.year = options.year.toString()
    if (options.voteAverageGte) params["vote_average.gte"] = options.voteAverageGte.toString()

    return this.fetch<TMDBMovieListResponse>("/discover/movie", params)
  }

  // Get movie videos (trailers, clips, etc.)
  async getMovieVideos(movieId: number): Promise<TMDBVideosResponse> {
    return this.fetch<TMDBVideosResponse>(`/movie/${movieId}/videos`)
  }
}

// Helper to get image URLs
export function getImageUrl(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500",
): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

// Export a function to create the client (handles missing API key gracefully)
export function createTMDBClient(): TMDBClient | null {
  try {
    return new TMDBClient()
  } catch {
    return null
  }
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
  const client = createTMDBClient()
  if (!client) return null
  return client.getMovieDetails(movieId)
}

export async function getMovieVideos(movieId: number): Promise<TMDBVideo[]> {
  const client = createTMDBClient()
  if (!client) return []
  const response = await client.getMovieVideos(movieId)
  return response.results || []
}

export async function getMovieCredits(movieId: number): Promise<TMDBCredits | null> {
  const client = createTMDBClient()
  if (!client) return null
  return client.getMovieCredits(movieId)
}

export { TMDBClient }
