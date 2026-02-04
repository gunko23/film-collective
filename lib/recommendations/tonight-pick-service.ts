import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "@/lib/tmdb/client"
import { getParentalGuideBatch, type ParentalGuideResult } from "@/lib/parental-guide/parental-guide-service"

const sql = neon(process.env.DATABASE_URL!)

// Severity level order for comparison
const SEVERITY_ORDER: Record<string, number> = {
  "None": 0,
  "Mild": 1,
  "Moderate": 2,
  "Severe": 3,
}

/**
 * Check if a severity level exceeds the maximum allowed
 * Returns true if the content should be EXCLUDED (exceeds limit)
 */
function exceedsSeverityLimit(
  actual: "None" | "Mild" | "Moderate" | "Severe" | null | undefined,
  max: "None" | "Mild" | "Moderate" | "Severe" | null | undefined
): boolean {
  // If no max set, allow everything
  if (!max) return false
  // If no actual data, allow it (don't filter out movies without data)
  if (!actual) return false
  
  return SEVERITY_ORDER[actual] > SEVERITY_ORDER[max]
}

// ============================================
// Types
// ============================================

export type GroupMember = {
  userId: string
  name: string
  avatarUrl: string | null
}

export type GenrePreference = {
  genreId: number
  genreName: string
  avgScore: number
  ratingCount: number
}

export type ParentalGuideInfo = {
  sexNudity: "None" | "Mild" | "Moderate" | "Severe" | null
  violence: "None" | "Mild" | "Moderate" | "Severe" | null
  profanity: "None" | "Mild" | "Moderate" | "Severe" | null
  alcoholDrugsSmoking: "None" | "Mild" | "Moderate" | "Severe" | null
  frighteningIntense: "None" | "Mild" | "Moderate" | "Severe" | null
}

export type MovieRecommendation = {
  tmdbId: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  runtime: number | null
  genres: { id: number; name: string }[]
  voteAverage: number
  certification?: string | null
  imdbId?: string | null
  // Group-specific scores
  groupFitScore: number
  genreMatchScore: number
  // Explanation for why this was recommended
  reasoning: string[]
  // Which members have seen it (if any partial overlap)
  seenBy: string[]
  // Parental guide data (from IMDb)
  parentalGuide?: ParentalGuideInfo | null
}

export type ParentalFilters = {
  maxViolence?: "None" | "Mild" | "Moderate" | "Severe" | null
  maxSexNudity?: "None" | "Mild" | "Moderate" | "Severe" | null
  maxProfanity?: "None" | "Mild" | "Moderate" | "Severe" | null
  maxSubstances?: "None" | "Mild" | "Moderate" | "Severe" | null
  maxFrightening?: "None" | "Mild" | "Moderate" | "Severe" | null
}

export type TonightPickRequest = {
  collectiveId: string
  memberIds: string[] // Who's watching tonight
  mood?: "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null
  maxRuntime?: number | null // In minutes
  contentRating?: string | null // "G", "PG", "PG-13", "R" - will include this and lower
  parentalFilters?: ParentalFilters | null
  page?: number // For pagination/shuffle - different pages return different results
  includeTV?: boolean
}

export type TonightPickResponse = {
  recommendations: MovieRecommendation[]
  groupProfile: {
    memberCount: number
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

export type SoloTonightPickRequest = {
  userId: string
  mood?: "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null
  maxRuntime?: number | null
  contentRating?: string | null
  parentalFilters?: ParentalFilters | null
  page?: number
}

export type SoloTonightPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

// ============================================
// Core Recommendation Logic
// ============================================

/**
 * Get genre preferences for a set of members
 * Returns genres that multiple members have rated highly
 */
async function getGroupGenrePreferences(memberIds: string[]): Promise<GenrePreference[]> {
  if (memberIds.length === 0) return []

  // Get genre stats for the selected members
  const result = await sql`
    SELECT 
      genre_element->>'id' as genre_id,
      genre_element->>'name' as genre_name,
      AVG(umr.overall_score) as avg_score,
      COUNT(DISTINCT umr.user_id) as raters_count,
      COUNT(*) as rating_count
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id,
    LATERAL jsonb_array_elements(m.genres) AS genre_element
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
    GROUP BY genre_element->>'id', genre_element->>'name'
    HAVING COUNT(DISTINCT umr.user_id) >= ${Math.max(1, Math.floor(memberIds.length / 2))}
    ORDER BY avg_score DESC, rating_count DESC
  `

  return result.map((row: any) => ({
    genreId: parseInt(row.genre_id),
    genreName: row.genre_name,
    avgScore: Number(row.avg_score),
    ratingCount: Number(row.rating_count),
  }))
}

/**
 * Get all TMDB IDs of movies that any of the selected members have rated
 */
async function getSeenMovieTmdbIds(memberIds: string[]): Promise<Map<number, string[]>> {
  if (memberIds.length === 0) return new Map()

  const result = await sql`
    SELECT 
      m.tmdb_id,
      u.id as user_id,
      u.name as user_name
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    JOIN users u ON umr.user_id = u.id
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
  `

  // Map of tmdbId -> array of user names who have seen it
  const seenMap = new Map<number, string[]>()
  for (const row of result) {
    const tmdbId = Number(row.tmdb_id)
    if (!seenMap.has(tmdbId)) {
      seenMap.set(tmdbId, [])
    }
    seenMap.get(tmdbId)!.push(row.user_name || "Unknown")
  }

  return seenMap
}

/**
 * Get movies that members have rated poorly (to avoid similar content)
 */
async function getDislikedGenres(memberIds: string[]): Promise<Set<number>> {
  if (memberIds.length === 0) return new Set()

  const result = await sql`
    SELECT DISTINCT
      (genre_element->>'id')::int as genre_id
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id,
    LATERAL jsonb_array_elements(m.genres) AS genre_element
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
      AND umr.overall_score < 40
    GROUP BY genre_element->>'id'
    HAVING COUNT(*) >= 2
  `

  return new Set(result.map((row: any) => row.genre_id))
}

/**
 * Calculate how well a movie fits the group's preferences
 */
function calculateGroupFitScore(
  movie: any,
  preferredGenres: GenrePreference[],
  dislikedGenres: Set<number>,
  seenByCount: number,
  totalMembers: number,
  soloMode: boolean = false
): { score: number; reasoning: string[] } {
  const reasoning: string[] = []
  let score = 50 // Base score

  const movieGenreIds = new Set((movie.genres || []).map((g: any) => g.id))

  // Boost for matching preferred genres
  let genreMatchCount = 0
  for (const pref of preferredGenres.slice(0, 5)) {
    if (movieGenreIds.has(pref.genreId)) {
      genreMatchCount++
      score += 8
    }
  }
  if (genreMatchCount > 0) {
    reasoning.push(`Matches ${genreMatchCount} of your ${soloMode ? "" : "group's "}favorite genres`)
  }

  // Penalty for disliked genres
  let dislikedMatchCount = 0
  for (const genreId of movieGenreIds) {
    if (dislikedGenres.has(genreId)) {
      dislikedMatchCount++
      score -= 15
    }
  }
  if (dislikedMatchCount > 0) {
    reasoning.push(`Contains ${dislikedMatchCount} genre(s) you ${soloMode ? "tend" : "your group tends"} to rate lower`)
  }

  // Penalty if some members have already seen it
  if (seenByCount > 0) {
    const penaltyMultiplier = seenByCount / totalMembers
    score -= Math.round(30 * penaltyMultiplier)
    if (soloMode) {
      reasoning.push("You may have seen this")
    } else {
      reasoning.push(`${seenByCount} member(s) may have seen this`)
    }
  }

  // Boost for well-reviewed films (TMDB score)
  if (movie.vote_average >= 7.5) {
    score += 10
    reasoning.push("Highly rated on TMDB")
  } else if (movie.vote_average >= 7.0) {
    score += 5
    reasoning.push("Well reviewed")
  }

  // Stronger boost for popular/mainstream films
  // This helps surface movies people are more likely to have heard of and can find to watch
  const popularity = movie.popularity || 0
  if (popularity > 100) {
    score += 15
    reasoning.push("Popular & widely available")
  } else if (popularity > 50) {
    score += 10
  } else if (popularity > 20) {
    score += 5
  }

  // Boost for movies with many votes (indicates mainstream appeal)
  const voteCount = movie.vote_count || 0
  if (voteCount > 5000) {
    score += 10
  } else if (voteCount > 1000) {
    score += 5
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning,
  }
}

/**
 * Map mood to TMDB genre IDs and sort preferences
 */
function getMoodFilters(mood: TonightPickRequest["mood"]): {
  preferGenres: number[]
  avoidGenres: number[]
  sortBy: string
} {
  switch (mood) {
    case "fun":
      return {
        preferGenres: [35, 16, 10751], // Comedy, Animation, Family
        avoidGenres: [27, 53], // Horror, Thriller
        sortBy: "popularity.desc",
      }
    case "intense":
      return {
        preferGenres: [28, 53, 80, 27], // Action, Thriller, Crime, Horror
        avoidGenres: [10749, 10751], // Romance, Family
        sortBy: "vote_average.desc",
      }
    case "emotional":
      return {
        preferGenres: [18, 10749], // Drama, Romance
        avoidGenres: [28, 27], // Action, Horror
        sortBy: "vote_average.desc",
      }
    case "mindless":
      return {
        preferGenres: [28, 35, 12], // Action, Comedy, Adventure
        avoidGenres: [18, 99], // Drama, Documentary
        sortBy: "popularity.desc",
      }
    case "acclaimed":
      return {
        preferGenres: [],
        avoidGenres: [],
        sortBy: "vote_average.desc",
      }
    default:
      return {
        preferGenres: [],
        avoidGenres: [],
        sortBy: "popularity.desc",
      }
  }
}

// ============================================
// Shared Recommendation Logic
// ============================================

type FetchAndScoreOptions = {
  memberIds: string[]
  mood?: "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null
  maxRuntime?: number | null
  contentRating?: string | null
  parentalFilters?: ParentalFilters | null
  page?: number
  soloMode?: boolean
}

async function _fetchAndScoreMovies(options: FetchAndScoreOptions): Promise<{
  recommendations: MovieRecommendation[]
  genres: GenrePreference[]
  totalRatings: number
}> {
  const { memberIds, mood, maxRuntime, contentRating, parentalFilters, page = 1, soloMode = false } = options

  const pageOffset = (page - 1) * 3

  const [groupGenres, seenMovies, dislikedGenres] = await Promise.all([
    getGroupGenrePreferences(memberIds),
    getSeenMovieTmdbIds(memberIds),
    getDislikedGenres(memberIds),
  ])

  const moodFilters = getMoodFilters(mood)

  const tmdb = createTMDBClient()
  if (!tmdb) {
    throw new Error("TMDB client not available")
  }

  const preferredGenreIds = groupGenres.slice(0, 3).map((g) => g.genreId)
  const combinedGenres = [...new Set([...moodFilters.preferGenres, ...preferredGenreIds])]

  const candidateMovies: any[] = []

  const discoverOptions: any = {
    page: 1,
    sortBy: moodFilters.sortBy,
    voteAverageGte: 6.0,
    voteCountGte: 200,
  }

  if (mood === "acclaimed") {
    if (contentRating) {
      discoverOptions.voteAverageGte = 7.0
      discoverOptions.voteCountGte = 500
    } else {
      discoverOptions.voteAverageGte = 7.5
      discoverOptions.voteCountGte = 1000
    }
  }

  if (combinedGenres.length > 0) {
    discoverOptions.withGenres = combinedGenres.slice(0, 3).join(",")
  }

  if (maxRuntime) {
    discoverOptions.withRuntimeLte = maxRuntime
  }

  if (contentRating) {
    discoverOptions.certificationCountry = "US"
    discoverOptions.certificationLte = contentRating
  }

  const page1 = await tmdb.discoverMovies({ ...discoverOptions, page: 1 + pageOffset })
  candidateMovies.push(...page1.results)

  const page2 = await tmdb.discoverMovies({ ...discoverOptions, page: 2 + pageOffset })
  candidateMovies.push(...page2.results)

  const page3 = await tmdb.discoverMovies({ ...discoverOptions, page: 3 + pageOffset })
  candidateMovies.push(...page3.results)

  if (!contentRating) {
    const popularMovies = await tmdb.getPopularMovies(1 + pageOffset)
    candidateMovies.push(...popularMovies.results)

    const popularMovies2 = await tmdb.getPopularMovies(2 + pageOffset)
    candidateMovies.push(...popularMovies2.results)

    if (!maxRuntime) {
      const topRated = await tmdb.getTopRatedMovies(1 + pageOffset)
      candidateMovies.push(...topRated.results)
    }
  } else {
    const page4 = await tmdb.discoverMovies({ ...discoverOptions, page: 4 + pageOffset })
    candidateMovies.push(...page4.results)

    const popularDiscover = await tmdb.discoverMovies({
      ...discoverOptions,
      sortBy: "popularity.desc",
      page: 1 + pageOffset
    })
    candidateMovies.push(...popularDiscover.results)

    const popularDiscover2 = await tmdb.discoverMovies({
      ...discoverOptions,
      sortBy: "popularity.desc",
      page: 2 + pageOffset
    })
    candidateMovies.push(...popularDiscover2.results)
  }

  const uniqueMovies = Array.from(
    new Map(candidateMovies.map((m) => [m.id, m])).values()
  )

  const scoredMovies: MovieRecommendation[] = []

  for (const movie of uniqueMovies) {
    if (maxRuntime && movie.runtime && movie.runtime > maxRuntime) {
      continue
    }

    const seenBy = seenMovies.get(movie.id) || []

    if (seenBy.length >= memberIds.length) {
      continue
    }

    const movieGenreIds = (movie.genres || []).map((g: any) => g.id)
    const hasAvoidedGenre = moodFilters.avoidGenres.some((g) => movieGenreIds.includes(g))
    if (hasAvoidedGenre && mood) {
      continue
    }

    const { score, reasoning } = calculateGroupFitScore(
      movie,
      groupGenres,
      dislikedGenres,
      seenBy.length,
      memberIds.length,
      soloMode
    )

    const genreMatchCount = groupGenres
      .slice(0, 5)
      .filter((g) => movieGenreIds.includes(g.genreId)).length
    const genreMatchScore = (genreMatchCount / Math.min(5, groupGenres.length)) * 100 || 50

    scoredMovies.push({
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      runtime: movie.runtime || null,
      genres: movie.genres || [],
      voteAverage: movie.vote_average,
      certification: contentRating || null,
      groupFitScore: score,
      genreMatchScore,
      reasoning,
      seenBy,
    })
  }

  scoredMovies.sort((a, b) => b.groupFitScore - a.groupFitScore)

  let candidates = scoredMovies.slice(0, 50)

  const parentalGuideData = await getParentalGuideBatch(
    candidates.map(m => ({ tmdbId: m.tmdbId }))
  )

  const hasParentalFilters = parentalFilters && (
    parentalFilters.maxViolence ||
    parentalFilters.maxSexNudity ||
    parentalFilters.maxProfanity ||
    parentalFilters.maxSubstances ||
    parentalFilters.maxFrightening
  )

  const filteredMovies: MovieRecommendation[] = []

  for (const movie of candidates) {
    const pg = parentalGuideData.get(movie.tmdbId)

    if (pg) {
      movie.parentalGuide = {
        sexNudity: pg.sexNudity,
        violence: pg.violence,
        profanity: pg.profanity,
        alcoholDrugsSmoking: pg.alcoholDrugsSmoking,
        frighteningIntense: pg.frighteningIntense,
      }
    }

    if (hasParentalFilters && pg) {
      if (exceedsSeverityLimit(pg.violence, parentalFilters?.maxViolence)) continue
      if (exceedsSeverityLimit(pg.sexNudity, parentalFilters?.maxSexNudity)) continue
      if (exceedsSeverityLimit(pg.profanity, parentalFilters?.maxProfanity)) continue
      if (exceedsSeverityLimit(pg.alcoholDrugsSmoking, parentalFilters?.maxSubstances)) continue
      if (exceedsSeverityLimit(pg.frighteningIntense, parentalFilters?.maxFrightening)) continue
    }

    filteredMovies.push(movie)

    if (filteredMovies.length >= 12) break
  }

  return {
    recommendations: filteredMovies.slice(0, 12),
    genres: groupGenres.slice(0, 5),
    totalRatings: groupGenres.reduce((sum, g) => sum + g.ratingCount, 0),
  }
}

// ============================================
// Main Recommendation Function (Group)
// ============================================

export async function getTonightsPick(request: TonightPickRequest): Promise<TonightPickResponse> {
  const { collectiveId, memberIds, mood, maxRuntime, contentRating, parentalFilters, page = 1 } = request

  // Validate members belong to the collective
  const validMembers = await sql`
    SELECT u.id, u.name
    FROM users u
    JOIN collective_memberships cm ON u.id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
      AND u.id = ANY(${memberIds}::uuid[])
  `

  if (validMembers.length === 0) {
    throw new Error("No valid members selected")
  }

  const validMemberIds = validMembers.map((m: any) => m.id)

  const result = await _fetchAndScoreMovies({
    memberIds: validMemberIds,
    mood,
    maxRuntime,
    contentRating,
    parentalFilters,
    page,
  })

  return {
    recommendations: result.recommendations,
    groupProfile: {
      memberCount: validMemberIds.length,
      sharedGenres: result.genres,
      totalRatings: result.totalRatings,
    },
  }
}

// ============================================
// Solo Recommendation Function
// ============================================

export async function getSoloTonightsPick(request: SoloTonightPickRequest): Promise<SoloTonightPickResponse> {
  const { userId, mood, maxRuntime, contentRating, parentalFilters, page = 1 } = request

  // Validate user exists
  const userResult = await sql`SELECT id FROM users WHERE id = ${userId}::uuid`
  if (userResult.length === 0) {
    throw new Error("User not found")
  }

  const result = await _fetchAndScoreMovies({
    memberIds: [userId],
    mood,
    maxRuntime,
    contentRating,
    parentalFilters,
    page,
    soloMode: true,
  })

  return {
    recommendations: result.recommendations,
    userProfile: {
      sharedGenres: result.genres,
      totalRatings: result.totalRatings,
    },
  }
}

// ============================================
// Helper: Get collective members for selection UI
// ============================================

export async function getCollectiveMembersForPick(collectiveId: string): Promise<GroupMember[]> {
  const result = await sql`
    SELECT 
      u.id as user_id,
      u.name,
      u.avatar_url
    FROM users u
    JOIN collective_memberships cm ON u.id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY u.name ASC
  `

  return result.map((row: any) => ({
    userId: row.user_id,
    name: row.name || "Unknown",
    avatarUrl: row.avatar_url,
  }))
}