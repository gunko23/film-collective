import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "@/lib/tmdb/client"
import { getParentalGuideBatch } from "@/lib/parental-guide/parental-guide-service"
import { batchGetCachedOmdbScores, getMoviesNeedingOmdbFetch, backgroundFetchOmdbBatch, type CachedOmdbScores } from "@/lib/omdb/omdb-cache"
import { calculateCompositeQualityScore, getQualityBonus, getAcclaimedMoodBonus } from "@/lib/recommendations/quality-score"
import { getLovedMovies, getDislikedMovies } from "@/lib/recommendations/reasoning-service"
import { getCachedCrewAffinities, getCachedCandidateCredits } from "@/lib/recommendations/crew-affinity-service"
import { generateAndPublishReasoning } from "@/lib/recommendations/reasoning-publisher"

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
  popularity?: number
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
  // Concession stand pairings (from LLM)
  pairings?: { cocktail: { name: string; desc: string }; zeroproof: { name: string; desc: string }; snack: { name: string; desc: string } } | null
  // Brief parental content summary (from LLM)
  parentalSummary?: string | null
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
  era?: string | null // e.g. "1980s", "1990s" — filters to that decade
  startYear?: number | null // e.g. 2000 — only movies from this year onwards
  streamingProviders?: number[] | null // TMDB watch provider IDs to filter by
  includeTV?: boolean
}

export type TonightPickResponse = {
  recommendations: MovieRecommendation[]
  groupProfile: {
    memberCount: number
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
  reasoningChannel?: string
}

export type SoloTonightPickRequest = {
  userId: string
  mood?: "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null
  maxRuntime?: number | null
  contentRating?: string | null
  parentalFilters?: ParentalFilters | null
  page?: number
  era?: string | null
  startYear?: number | null
  streamingProviders?: number[] | null
}

export type SoloTonightPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
  reasoningChannel?: string
}

// ============================================
// Internal Types for Enhanced Scoring
// ============================================

// DirectorAffinity and ActorAffinity types imported from crew-affinity-service
type DirectorAffinity = {
  personId: number
  name: string
  avgScore: number
  movieCount: number
}

type ActorAffinity = {
  personId: number
  name: string
  avgScore: number
  movieCount: number
}

type EraPreference = {
  decade: string
  avgScore: number
  ratingCount: number
}

type CollabRecommendation = {
  tmdbId: number
  peerScore: number
  peerCount: number
}

type ScoringContext = {
  preferredGenres: GenrePreference[]
  dislikedGenres: Set<number>
  seenByCount: number
  totalMembers: number
  totalSeen: number
  soloMode: boolean
  directorAffinities: DirectorAffinity[]
  actorAffinities: ActorAffinity[]
  eraPreferences: EraPreference[]
  collabScoreMap: Map<number, number>
  candidateDirectorIds: Set<number>
  candidateTopActorIds: Set<number>
  candidateReleaseDecade: string | null
  omdbScores: CachedOmdbScores | null
  mood: string | null
  moodPreferGenres: number[]
  moodSoftAvoidGenres: number[]
}

function getDecade(releaseDate: string | null | undefined): string | null {
  if (!releaseDate) return null
  const year = parseInt(releaseDate.substring(0, 4))
  if (isNaN(year)) return null
  return `${Math.floor(year / 10) * 10}s`
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
 * Get era/decade preferences based on members' ratings
 * Returns decades sorted by average score (only decades with 5+ ratings)
 */
async function getEraPreferences(memberIds: string[]): Promise<EraPreference[]> {
  if (memberIds.length === 0) return []
  try {
    const result = await sql`
      SELECT
        (FLOOR(EXTRACT(YEAR FROM m.release_date) / 10) * 10)::int || 's' AS decade,
        AVG(umr.overall_score) AS avg_score,
        COUNT(*) AS rating_count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ANY(${memberIds}::uuid[])
        AND m.release_date IS NOT NULL
      GROUP BY (FLOOR(EXTRACT(YEAR FROM m.release_date) / 10) * 10)
      HAVING COUNT(*) >= 5
      ORDER BY avg_score DESC
    `
    return result.map((row: any) => ({
      decade: row.decade,
      avgScore: Number(row.avg_score),
      ratingCount: Number(row.rating_count),
    }))
  } catch {
    return []
  }
}

// getMemberTopRatedTmdbIds removed — replaced by getCachedCrewAffinities

/**
 * Find taste-similar peers: users in shared collectives with >= 5 shared movie ratings
 * and average score difference < 20 points
 */
async function getTasteSimilarPeers(memberIds: string[]): Promise<string[]> {
  if (memberIds.length === 0) return []
  try {
    const result = await sql`
      SELECT DISTINCT peer.user_id AS peer_id
      FROM collective_memberships member
      JOIN collective_memberships peer
        ON member.collective_id = peer.collective_id
        AND peer.user_id != ALL(${memberIds}::uuid[])
      JOIN user_movie_ratings umr_member
        ON umr_member.user_id = member.user_id
      JOIN user_movie_ratings umr_peer
        ON umr_peer.user_id = peer.user_id
        AND umr_peer.movie_id = umr_member.movie_id
      WHERE member.user_id = ANY(${memberIds}::uuid[])
      GROUP BY peer.user_id
      HAVING COUNT(DISTINCT umr_member.movie_id) >= 5
        AND AVG(ABS(umr_member.overall_score - umr_peer.overall_score)) < 20
    `
    return result.map((row: any) => row.peer_id)
  } catch {
    return []
  }
}

/**
 * Get collaborative recommendations: movies that taste-similar peers rated highly
 * that the current members haven't seen
 */
async function getCollaborativeRecommendations(
  memberIds: string[],
  peerIds: string[],
  seenTmdbIds: Set<number>
): Promise<CollabRecommendation[]> {
  if (peerIds.length === 0) return []
  try {
    const result = await sql`
      SELECT
        m.tmdb_id,
        AVG(umr.overall_score) AS peer_score,
        COUNT(DISTINCT umr.user_id) AS peer_count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ANY(${peerIds}::uuid[])
        AND umr.overall_score >= 75
        AND m.tmdb_id NOT IN (
          SELECT m2.tmdb_id FROM user_movie_ratings umr2
          JOIN movies m2 ON umr2.movie_id = m2.id
          WHERE umr2.user_id = ANY(${memberIds}::uuid[])
        )
      GROUP BY m.tmdb_id
      HAVING COUNT(DISTINCT umr.user_id) >= 2
      ORDER BY peer_score DESC
      LIMIT 20
    `
    return result
      .map((row: any) => ({
        tmdbId: Number(row.tmdb_id),
        peerScore: Number(row.peer_score),
        peerCount: Number(row.peer_count),
      }))
      .filter((r: CollabRecommendation) => !seenTmdbIds.has(r.tmdbId))
  } catch {
    return []
  }
}

// buildCrewAffinities removed — replaced by getCachedCrewAffinities

// fetchCandidateCredits removed — replaced by getCachedCandidateCredits

/**
 * Calculate how well a movie fits the group's preferences
 * Uses ScoringContext for enhanced scoring with crew affinity, era, and collaborative signals
 */
function calculateGroupFitScore(
  movie: any,
  ctx: ScoringContext
): { score: number; reasoning: string[] } {
  const reasoning: string[] = []
  let score = 50 // Base score

  const movieGenreIds = new Set<number>(
    movie.genres
      ? (movie.genres).map((g: any) => g.id)
      : (movie.genre_ids || [])
  )

  // --- Genre match (weighted by member ratings, top 8 genres, max ~+40) ---
  let genreBoost = 0
  let genreMatchCount = 0
  for (const pref of ctx.preferredGenres.slice(0, 8)) {
    if (movieGenreIds.has(pref.genreId)) {
      genreMatchCount++
      const confidence = Math.min(1, pref.ratingCount / 10)
      genreBoost += (pref.avgScore / 100) * 15 * confidence
    }
  }
  score += Math.round(genreBoost)
  if (genreMatchCount > 0) {
    reasoning.push(`Matches ${genreMatchCount} of your ${ctx.soloMode ? "" : "group's "}favorite genres`)
  }

  // --- Disliked genre penalty (-15 each) ---
  let dislikedMatchCount = 0
  for (const genreId of movieGenreIds) {
    if (ctx.dislikedGenres.has(genreId)) {
      dislikedMatchCount++
      score -= 15
    }
  }
  if (dislikedMatchCount > 0) {
    reasoning.push(`Contains ${dislikedMatchCount} genre(s) you ${ctx.soloMode ? "tend" : "your group tends"} to rate lower`)
  }

  // --- Seen penalty (-30 scaled by ratio) ---
  if (ctx.seenByCount > 0) {
    const penaltyMultiplier = ctx.seenByCount / ctx.totalMembers
    score -= Math.round(30 * penaltyMultiplier)
    if (ctx.soloMode) {
      reasoning.push("You may have seen this")
    } else {
      reasoning.push(`${ctx.seenByCount} member(s) may have seen this`)
    }
  }

  // --- Mood-based genre scoring ---
  if (ctx.moodPreferGenres.length > 0 || ctx.moodSoftAvoidGenres.length > 0) {
    let moodMatchCount = 0
    for (const genreId of ctx.moodPreferGenres) {
      if (movieGenreIds.has(genreId)) {
        moodMatchCount++
        score += 10
      }
    }
    if (moodMatchCount > 0) {
      reasoning.push("Fits the mood you're looking for")
    }

    let softAvoidCount = 0
    for (const genreId of ctx.moodSoftAvoidGenres) {
      if (movieGenreIds.has(genreId)) {
        softAvoidCount++
        score -= 12
      }
    }
    if (softAvoidCount > 0) {
      reasoning.push("Tone may not fully match your mood")
    }
  }

  // --- Quality bonus (composite OMDb or TMDB fallback, max +15) ---
  const qualityResult = calculateCompositeQualityScore(ctx.omdbScores, movie.vote_average, movie.popularity || 0)
  const { bonus: qualityBonus, reasoning: qualityReasoning } = getQualityBonus(qualityResult)
  score += qualityBonus
  if (qualityReasoning) reasoning.push(qualityReasoning)

  // --- Acclaimed mood bonus (critic-score-based, only when mood = "acclaimed") ---
  if (ctx.mood === "acclaimed") {
    const { bonus: acclaimedBonus, reasoning: acclaimedReasoning } = getAcclaimedMoodBonus(ctx.omdbScores)
    score += acclaimedBonus
    if (acclaimedReasoning.length > 0) {
      reasoning.push(acclaimedReasoning.join(", "))
    }
  }

  // --- Availability signal (max +13) ---
  // Scales with how much the group has seen — power users need more popularity weight
  // because their candidate pool is already niche after seen-filtering
  const popularity = movie.popularity || 0
  const voteCount = movie.vote_count || 0

  let availabilityBonus = 0

  if (popularity > 100) availabilityBonus += 8
  else if (popularity > 50) availabilityBonus += 5
  else if (popularity > 20) availabilityBonus += 2

  if (voteCount > 5000) availabilityBonus += 5
  else if (voteCount > 2000) availabilityBonus += 3
  else if (voteCount > 1000) availabilityBonus += 1

  availabilityBonus = Math.min(13, availabilityBonus)
  score += availabilityBonus

  if (popularity > 100 || voteCount > 5000) {
    reasoning.push("Widely known & easy to find")
  }

  // --- Director affinity (max +12) ---
  if (ctx.candidateDirectorIds.size > 0 && ctx.directorAffinities.length > 0) {
    for (const aff of ctx.directorAffinities) {
      if (ctx.candidateDirectorIds.has(aff.personId)) {
        const bonus = Math.round((aff.avgScore / 100) * 12)
        score += bonus
        reasoning.push(`Directed by ${aff.name}, whose films you rate highly`)
        break // Only count top matching director
      }
    }
  }

  // --- Actor affinity (max +12, up to +6 per actor) ---
  if (ctx.candidateTopActorIds.size > 0 && ctx.actorAffinities.length > 0) {
    let actorBonus = 0
    const matchedActors: string[] = []
    for (const aff of ctx.actorAffinities) {
      if (ctx.candidateTopActorIds.has(aff.personId)) {
        const bonus = Math.round((aff.avgScore / 100) * 6)
        actorBonus += bonus
        matchedActors.push(aff.name)
        if (actorBonus >= 12) break
      }
    }
    actorBonus = Math.min(12, actorBonus)
    score += actorBonus
    if (matchedActors.length > 0) {
      reasoning.push(`Stars ${matchedActors.slice(0, 2).join(" & ")}, who you enjoy`)
    }
  }

  // --- Era preference (max +5) ---
  if (ctx.candidateReleaseDecade && ctx.eraPreferences.length > 0) {
    if (ctx.eraPreferences[0]?.decade === ctx.candidateReleaseDecade) {
      score += 5
      reasoning.push(`From the ${ctx.candidateReleaseDecade}, your favorite era`)
    }
  }

  // --- Collaborative filtering (max +20) ---
  const collabScore = ctx.collabScoreMap.get(movie.id)
  if (collabScore) {
    const bonus = Math.round((collabScore / 100) * 20)
    score += bonus
    reasoning.push("Loved by people with similar taste")
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning,
  }
}

/**
 * Deduplicate franchise entries — keep only the highest-scoring movie
 * from any group of movies that share the same franchise.
 *
 * Uses title similarity since TMDB discover results don't include
 * belongs_to_collection. Array must be pre-sorted by score descending.
 */
function deduplicateFranchises(movies: MovieRecommendation[]): MovieRecommendation[] {
  function getBaseTitle(title: string): string {
    return title
      .replace(/\s*[:\-–—]\s*Part\s+\w+$/i, "")
      .replace(/\s+\d+\s*$/, "")
      .replace(/\s+[IVXLC]+\s*$/, "")
      .replace(/\s*[:\-–—]\s*Chapter\s+\w+$/i, "")
      .trim()
  }

  const seen = new Map<string, number>()
  const result: MovieRecommendation[] = []

  for (const movie of movies) {
    const baseTitle = getBaseTitle(movie.title).toLowerCase()

    if (seen.has(baseTitle)) {
      continue
    }

    seen.set(baseTitle, result.length)
    result.push(movie)
  }

  return result
}

/**
 * Map mood to TMDB genre IDs and sort preferences
 */
function getMoodFilters(mood: TonightPickRequest["mood"]): {
  preferGenres: number[]
  avoidGenres: number[]
  softAvoidGenres: number[]  // Penalized in scoring but not excluded
  sortBy: string
} {
  switch (mood) {
    case "fun":
      return {
        preferGenres: [35, 16, 10751, 12],  // Comedy, Animation, Family, Adventure
        avoidGenres: [27, 10752],             // Horror, War — hard exclude
        softAvoidGenres: [18, 53, 80, 9648],  // Drama, Thriller, Crime, Mystery — penalized in scoring
        sortBy: "popularity.desc",
      }
    case "intense":
      return {
        preferGenres: [28, 53, 80, 27],       // Action, Thriller, Crime, Horror
        avoidGenres: [],
        softAvoidGenres: [10749, 10751, 16],   // Romance, Family, Animation
        sortBy: "vote_average.desc",
      }
    case "emotional":
      return {
        preferGenres: [18, 10749],             // Drama, Romance
        avoidGenres: [],
        softAvoidGenres: [27, 28],             // Horror, Action
        sortBy: "vote_average.desc",
      }
    case "mindless":
      return {
        preferGenres: [28, 35, 12],            // Action, Comedy, Adventure
        avoidGenres: [],
        softAvoidGenres: [18, 99, 36],         // Drama, Documentary, History
        sortBy: "popularity.desc",
      }
    case "acclaimed":
      return {
        preferGenres: [],
        avoidGenres: [],
        softAvoidGenres: [],
        sortBy: "vote_average.desc",
      }
    default:
      return {
        preferGenres: [],
        avoidGenres: [],
        softAvoidGenres: [],
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
  era?: string | null
  startYear?: number | null
  streamingProviders?: number[] | null
}

async function _fetchAndScoreMovies(options: FetchAndScoreOptions): Promise<{
  recommendations: MovieRecommendation[]
  genres: GenrePreference[]
  totalRatings: number
  lovedMovies: { title: string; avgScore: number }[]
  dislikedMovies: { title: string; avgScore: number }[]
}> {
  const { memberIds, mood, maxRuntime, contentRating, parentalFilters, page = 1, soloMode = false, era, startYear, streamingProviders } = options

  const pageOffset = (page - 1) * 3

  // ── Phase 1: Parallel DB queries ──
  const [groupGenres, seenMovies, dislikedGenreSet, eraPreferences, crewAffinitiesResult, peerIds] = await Promise.all([
    getGroupGenrePreferences(memberIds),
    getSeenMovieTmdbIds(memberIds),
    getDislikedGenres(memberIds),
    getEraPreferences(memberIds),
    getCachedCrewAffinities(memberIds),
    getTasteSimilarPeers(memberIds),
  ])

  const moodFilters = getMoodFilters(mood)

  const tmdb = createTMDBClient()
  if (!tmdb) {
    throw new Error("TMDB client not available")
  }

  // ── Filter Pressure System ──
  // Calculate cumulative filter pressure to detect when filters stack too aggressively
  const totalSeen = seenMovies.size
  let filterPressure = 0

  if (mood === "acclaimed") filterPressure += 3
  else if (mood === "emotional" || mood === "intense") filterPressure += 1
  else if (mood) filterPressure += 0.5

  if (era) filterPressure += 3
  else if (startYear) filterPressure += 1

  if (maxRuntime && maxRuntime <= 120) filterPressure += 2
  else if (maxRuntime && maxRuntime <= 150) filterPressure += 1

  if (contentRating === "G") filterPressure += 4
  else if (contentRating === "PG") filterPressure += 3
  else if (contentRating === "PG-13") filterPressure += 2
  else if (contentRating === "R") filterPressure += 1

  if (totalSeen > 500) filterPressure += 3
  else if (totalSeen > 200) filterPressure += 2
  else if (totalSeen > 50) filterPressure += 1

  if (parentalFilters) {
    const activeParentalFilters = [
      parentalFilters.maxViolence,
      parentalFilters.maxSexNudity,
      parentalFilters.maxProfanity,
      parentalFilters.maxSubstances,
      parentalFilters.maxFrightening,
    ].filter(Boolean).length
    filterPressure += activeParentalFilters * 0.5
  }

  if (streamingProviders && streamingProviders.length > 0) {
    // Streaming filter is quite restrictive — pressure scales with fewer services
    if (streamingProviders.length <= 2) filterPressure += 3
    else if (streamingProviders.length <= 4) filterPressure += 2
    else filterPressure += 1
  }

  const pressureTier = filterPressure <= 3 ? "low"
                     : filterPressure <= 6 ? "medium"
                     : "high"

  // Dynamic floors — relax as pressure increases to prevent candidate pool collapse
  const baseVoteCountFloor = totalSeen > 500 ? 2000
                           : totalSeen > 200 ? 1000
                           : totalSeen > 50  ? 500
                           : 200
  const voteCountFloor = pressureTier === "high" ? Math.round(baseVoteCountFloor * 0.3)
                       : pressureTier === "medium" ? Math.round(baseVoteCountFloor * 0.6)
                       : baseVoteCountFloor

  const baseVoteAverageFloor = totalSeen > 500 ? 6.5 : totalSeen > 200 ? 6.2 : 6.0
  const voteAverageFloor = pressureTier === "high" ? Math.max(5.5, baseVoteAverageFloor - 0.8)
                         : pressureTier === "medium" ? Math.max(5.8, baseVoteAverageFloor - 0.4)
                         : baseVoteAverageFloor

  const basePopularityFloor = totalSeen > 500 ? 20
                            : totalSeen > 200 ? 12
                            : totalSeen > 50  ? 5
                            : 0
  const dynamicPopularityFloor = pressureTier === "high" ? 0
                               : pressureTier === "medium" ? Math.round(basePopularityFloor * 0.5)
                               : basePopularityFloor

  const extraPressurePages = pressureTier === "high" ? 4
                           : pressureTier === "medium" ? 2
                           : 0

  console.log(`[Recommendations] Filter pressure: ${filterPressure} (${pressureTier})`, {
    mood: mood || "none",
    era: era || startYear || "none",
    maxRuntime: maxRuntime || "none",
    contentRating: contentRating || "none",
    streamingProviders: streamingProviders?.length || 0,
    totalSeen,
    voteCountFloor,
    voteAverageFloor,
    dynamicPopularityFloor,
    extraPressurePages,
  })

  const preferredGenreIds = groupGenres.slice(0, 3).map((g) => g.genreId)
  const combinedGenres = [...new Set([...moodFilters.preferGenres, ...preferredGenreIds])]

  const discoverOptions: any = {
    page: 1,
    sortBy: moodFilters.sortBy,
    voteAverageGte: voteAverageFloor,
    voteCountGte: voteCountFloor,
  }

  if (mood === "acclaimed") {
    if (contentRating) {
      discoverOptions.voteAverageGte = pressureTier === "high" ? 6.5
                                     : pressureTier === "medium" ? 7.0
                                     : Math.max(voteAverageFloor, 7.0)
      discoverOptions.voteCountGte = Math.max(voteCountFloor, 500)
    } else {
      discoverOptions.voteAverageGte = pressureTier === "high" ? 6.5
                                     : pressureTier === "medium" ? 7.0
                                     : Math.max(voteAverageFloor, 7.5)
      discoverOptions.voteCountGte = Math.max(voteCountFloor, 1000)
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

  // Date range filters: era (specific decade) takes precedence over startYear (minimum year)
  const eraDateRange: { primaryReleaseDateGte?: string; primaryReleaseDateLte?: string } = {}
  if (era) {
    const decadeStart = parseInt(era) // "1980s" → 1980
    if (!isNaN(decadeStart)) {
      eraDateRange.primaryReleaseDateGte = `${decadeStart}-01-01`
      eraDateRange.primaryReleaseDateLte = `${decadeStart + 9}-12-31`
    }
  } else if (startYear) {
    eraDateRange.primaryReleaseDateGte = `${startYear}-01-01`
  }
  if (eraDateRange.primaryReleaseDateGte) {
    discoverOptions.primaryReleaseDateGte = eraDateRange.primaryReleaseDateGte
  }
  if (eraDateRange.primaryReleaseDateLte) {
    discoverOptions.primaryReleaseDateLte = eraDateRange.primaryReleaseDateLte
  }

  // Streaming provider filter — applied to all discover calls
  const streamingParams: { withWatchProviders?: string; watchRegion?: string; withWatchMonetizationTypes?: string } = {}
  if (streamingProviders && streamingProviders.length > 0) {
    streamingParams.withWatchProviders = streamingProviders.join("|")
    streamingParams.watchRegion = "US"
    streamingParams.withWatchMonetizationTypes = "flatrate"
    Object.assign(discoverOptions, streamingParams)
  }

  // ── Phase 2: Collab recs + TMDB discovers in parallel ──
  // Crew affinities already loaded from cache in Phase 1
  const crewAffinities = crewAffinitiesResult
  const seenTmdbIds = new Set(seenMovies.keys())

  const tmdbDiscoverPromises: Promise<any>[] = [
    tmdb.discoverMovies({ ...discoverOptions, page: 1 + pageOffset }),
    tmdb.discoverMovies({ ...discoverOptions, page: 2 + pageOffset }),
    tmdb.discoverMovies({ ...discoverOptions, page: 3 + pageOffset }),
    // Wildcard discover: no genre filter, high-quality movies
    tmdb.discoverMovies({
      page: 1 + pageOffset,
      sortBy: "vote_average.desc",
      voteAverageGte: Math.max(voteAverageFloor, 7.0),
      voteCountGte: Math.max(voteCountFloor, 500),
      ...(maxRuntime ? { withRuntimeLte: maxRuntime } : {}),
      ...(contentRating ? { certificationCountry: "US", certificationLte: contentRating } : {}),
      ...eraDateRange,
      ...streamingParams,
    }),
  ]

  if (!contentRating) {
    if (eraDateRange.primaryReleaseDateGte || eraDateRange.primaryReleaseDateLte || streamingParams.withWatchProviders) {
      // When streaming, era, or date filters are active, use discover endpoint (popular/top-rated endpoints don't support these params)
      tmdbDiscoverPromises.push(
        tmdb.discoverMovies({ sortBy: "popularity.desc", page: 1 + pageOffset, voteCountGte: voteCountFloor, ...eraDateRange, ...streamingParams }),
        tmdb.discoverMovies({ sortBy: "popularity.desc", page: 2 + pageOffset, voteCountGte: voteCountFloor, ...eraDateRange, ...streamingParams }),
      )
      if (!maxRuntime) {
        tmdbDiscoverPromises.push(
          tmdb.discoverMovies({ sortBy: "vote_average.desc", page: 1 + pageOffset, voteAverageGte: Math.max(voteAverageFloor, 7.0), voteCountGte: Math.max(voteCountFloor, 300), ...eraDateRange, ...streamingParams }),
        )
      }
    } else {
      tmdbDiscoverPromises.push(
        tmdb.getPopularMovies(1 + pageOffset),
        tmdb.getPopularMovies(2 + pageOffset),
      )
      if (!maxRuntime) {
        tmdbDiscoverPromises.push(tmdb.getTopRatedMovies(1 + pageOffset))
      }
    }
  } else {
    tmdbDiscoverPromises.push(
      tmdb.discoverMovies({ ...discoverOptions, page: 4 + pageOffset }),
      tmdb.discoverMovies({ ...discoverOptions, sortBy: "popularity.desc", page: 1 + pageOffset }),
      tmdb.discoverMovies({ ...discoverOptions, sortBy: "popularity.desc", page: 2 + pageOffset }),
    )
  }

  const [collabRecs, ...tmdbResults] = await Promise.all([
    getCollaborativeRecommendations(memberIds, peerIds, seenTmdbIds),
    ...tmdbDiscoverPromises,
  ])

  const candidateMovies: any[] = []
  for (const result of tmdbResults) {
    if (result?.results) candidateMovies.push(...result.results)
  }

  // Power users need deeper pages since they've seen the obvious results
  const extraPageDepth = totalSeen > 500 ? 3
                       : totalSeen > 200 ? 2
                       : 0
  if (extraPageDepth > 0) {
    const deepDiscoverOptions = {
      ...discoverOptions,
      voteCountGte: Math.max(voteCountFloor, 1500),
      voteAverageGte: 6.8,
    }
    const deepPages = await Promise.all(
      Array.from({ length: extraPageDepth }, (_, i) =>
        tmdb.discoverMovies({ ...deepDiscoverOptions, page: 4 + pageOffset + i })
      )
    )
    deepPages.forEach(p => candidateMovies.push(...p.results))
  }

  // ── Pressure-based extra fetches (parallelized) ──
  if (extraPressurePages > 0) {
    const broadOptions = {
      ...discoverOptions,
      voteCountGte: voteCountFloor,
      voteAverageGte: voteAverageFloor,
    }

    const pressurePromises: Promise<any>[] = Array.from({ length: extraPressurePages }, (_, i) =>
      tmdb.discoverMovies({ ...broadOptions, page: 5 + pageOffset + extraPageDepth + i })
    )

    // Mood-only genres (without preference genre intersection)
    if (moodFilters.preferGenres.length > 0) {
      pressurePromises.push(
        tmdb.discoverMovies({
          ...broadOptions,
          withGenres: moodFilters.preferGenres.slice(0, 2).join(","),
          page: 1 + pageOffset,
        })
      )
    }

    // Genre-less discover — just quality + hard filters
    pressurePromises.push(
      tmdb.discoverMovies({
        page: 1 + pageOffset,
        sortBy: "vote_average.desc",
        voteCountGte: voteCountFloor,
        voteAverageGte: voteAverageFloor,
        ...(maxRuntime ? { withRuntimeLte: maxRuntime } : {}),
        ...(contentRating ? { certificationCountry: "US", certificationLte: contentRating } : {}),
        ...eraDateRange,
        ...streamingParams,
      })
    )

    const pressureResults = await Promise.all(pressurePromises)
    pressureResults.forEach(p => candidateMovies.push(...p.results))
  }

  // ── Phase 3: Inject collab candidates not already in pool ──
  const collabScoreMap = new Map<number, number>()
  for (const rec of collabRecs) {
    collabScoreMap.set(rec.tmdbId, rec.peerScore)
  }

  const candidateTmdbIds = new Set(candidateMovies.map((m: any) => m.id))
  const missingCollabIds = collabRecs
    .filter((r) => !candidateTmdbIds.has(r.tmdbId))
    .slice(0, 10)
    .map((r) => r.tmdbId)

  if (missingCollabIds.length > 0) {
    const collabDetails = await Promise.all(
      missingCollabIds.map((id) => tmdb.getMovieDetails(id).catch(() => null))
    )
    for (const movie of collabDetails) {
      if (movie) candidateMovies.push(movie)
    }
  }

  let uniqueMovies = Array.from(
    new Map(candidateMovies.map((m) => [m.id, m])).values()
  )

  // Hard-filter by era/startYear — catches any candidates from non-discover sources
  if (eraDateRange.primaryReleaseDateGte || eraDateRange.primaryReleaseDateLte) {
    uniqueMovies = uniqueMovies.filter((m: any) => {
      const rd = m.release_date
      if (!rd) return false
      if (eraDateRange.primaryReleaseDateGte && rd < eraDateRange.primaryReleaseDateGte) return false
      if (eraDateRange.primaryReleaseDateLte && rd > eraDateRange.primaryReleaseDateLte) return false
      return true
    })
  }

  // ── Emergency fallback — pool size check ──
  // Count viable candidates (at least one member hasn't seen it)
  const viableCandidates = uniqueMovies.filter((m: any) => {
    const seenBy = seenMovies.get(m.id) || []
    return seenBy.length < memberIds.length
  })

  const MIN_VIABLE_POOL = 15
  if (viableCandidates.length < MIN_VIABLE_POOL) {
    console.log(`[Recommendations] Low candidate pool: ${viableCandidates.length}. Running emergency fetch.`)

    const emergencyOptions: any = {
      sortBy: "popularity.desc",
      voteCountGte: 100,
      voteAverageGte: 5.5,
      ...(maxRuntime ? { withRuntimeLte: maxRuntime } : {}),
      ...(contentRating ? { certificationCountry: "US", certificationLte: contentRating } : {}),
      ...eraDateRange,
      ...streamingParams,
    }

    const emergencyPages = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        tmdb.discoverMovies({ ...emergencyOptions, page: i + 1 + pageOffset })
      )
    )
    emergencyPages.forEach(p => candidateMovies.push(...p.results))

    // Re-deduplicate and re-apply era filter
    const reDeduped = Array.from(
      new Map(candidateMovies.map((m) => [m.id, m])).values()
    )
    uniqueMovies = reDeduped
    if (eraDateRange.primaryReleaseDateGte || eraDateRange.primaryReleaseDateLte) {
      uniqueMovies = uniqueMovies.filter((m: any) => {
        const rd = m.release_date
        if (!rd) return false
        if (eraDateRange.primaryReleaseDateGte && rd < eraDateRange.primaryReleaseDateGte) return false
        if (eraDateRange.primaryReleaseDateLte && rd > eraDateRange.primaryReleaseDateLte) return false
        return true
      })
    }
  }

  console.log(`[Recommendations] Pool stats:`, {
    totalCandidatesFetched: candidateMovies.length,
    afterDedup: uniqueMovies.length,
    viableBeforeScoring: viableCandidates.length,
    emergencyFetchUsed: viableCandidates.length < MIN_VIABLE_POOL,
  })

  // ── Phase 3.5: Batch load cached OMDb scores ──
  const candidateTmdbIdsForOmdb = uniqueMovies.map((m: any) => m.id as number)
  const omdbScoresMap = await batchGetCachedOmdbScores(candidateTmdbIdsForOmdb)

  // ── Phase 4: First-pass scoring (without credits) ──
  const firstPassScored: (MovieRecommendation & { _movie: any })[] = []

  for (const movie of uniqueMovies) {
    if (maxRuntime && movie.runtime && movie.runtime > maxRuntime) {
      continue
    }

    const seenBy = seenMovies.get(movie.id) || []

    if (seenBy.length >= memberIds.length) {
      continue
    }

    const movieGenreIds = movie.genres
      ? (movie.genres).map((g: any) => g.id)
      : (movie.genre_ids || [])
    const hasAvoidedGenre = moodFilters.avoidGenres.some((g: number) => movieGenreIds.includes(g))
    if (hasAvoidedGenre && mood) {
      continue
    }

    const ctx: ScoringContext = {
      preferredGenres: groupGenres,
      dislikedGenres: dislikedGenreSet,
      seenByCount: seenBy.length,
      totalMembers: memberIds.length,
      totalSeen,
      soloMode,
      directorAffinities: crewAffinities.directors,
      actorAffinities: crewAffinities.actors,
      eraPreferences,
      collabScoreMap,
      // Empty for first pass — populated after credit enrichment
      candidateDirectorIds: new Set(),
      candidateTopActorIds: new Set(),
      candidateReleaseDecade: getDecade(movie.release_date),
      omdbScores: omdbScoresMap.get(movie.id) || null,
      mood: mood || null,
      moodPreferGenres: mood ? moodFilters.preferGenres : [],
      moodSoftAvoidGenres: mood ? moodFilters.softAvoidGenres : [],
    }

    const { score, reasoning } = calculateGroupFitScore(movie, ctx)

    const genreMatchCount = groupGenres
      .slice(0, 5)
      .filter((g) => movieGenreIds.includes(g.genreId)).length
    const genreMatchScore = (genreMatchCount / Math.min(5, groupGenres.length)) * 100 || 50

    firstPassScored.push({
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      runtime: movie.runtime || null,
      genres: movie.genres || [],
      voteAverage: movie.vote_average,
      popularity: movie.popularity || 0,
      certification: contentRating || null,
      groupFitScore: score,
      genreMatchScore,
      reasoning,
      seenBy,
      _movie: movie,
    })
  }

  firstPassScored.sort((a, b) => b.groupFitScore - a.groupFitScore)

  // ── Background OMDb pre-fetch for top 50 (fire-and-forget) ──
  // Moved here from after Phase 6 to pre-fetch for more candidates earlier
  const top50TmdbIds = firstPassScored.slice(0, 50).map(m => m.tmdbId)
  getMoviesNeedingOmdbFetch(top50TmdbIds)
    .then(needsFetch => {
      if (needsFetch.length > 0) {
        console.log(`[OMDb] Background pre-fetching ${needsFetch.length} movies (top 50)`)
        backgroundFetchOmdbBatch(needsFetch, 20).catch(e =>
          console.error("[OMDb] Background pre-fetch error:", e)
        )
      }
    })
    .catch(e => console.error("[OMDb] Error checking for pre-fetch needs:", e))

  // ── Phase 5: Credit enrichment for top 30 ──
  const top30 = firstPassScored.slice(0, 30)
  const hasAffinities = crewAffinities.directors.length > 0 || crewAffinities.actors.length > 0

  let scoredMovies: MovieRecommendation[]

  if (hasAffinities && top30.length > 0) {
    const creditsMap = await getCachedCandidateCredits(
      top30.map((m) => m.tmdbId)
    )

    // Re-score with credits
    const reScored: MovieRecommendation[] = top30.map((entry) => {
      const creds = creditsMap.get(entry.tmdbId)
      const seenBy = seenMovies.get(entry.tmdbId) || []

      const ctx: ScoringContext = {
        preferredGenres: groupGenres,
        dislikedGenres: dislikedGenreSet,
        seenByCount: seenBy.length,
        totalMembers: memberIds.length,
        totalSeen,
        soloMode,
        directorAffinities: crewAffinities.directors,
        actorAffinities: crewAffinities.actors,
        eraPreferences,
        collabScoreMap,
        candidateDirectorIds: creds?.directorIds || new Set(),
        candidateTopActorIds: creds?.topActorIds || new Set(),
        candidateReleaseDecade: getDecade(entry.releaseDate),
        omdbScores: omdbScoresMap.get(entry.tmdbId) || null,
        mood: mood || null,
        moodPreferGenres: mood ? moodFilters.preferGenres : [],
        moodSoftAvoidGenres: mood ? moodFilters.softAvoidGenres : [],
      }

      const { score, reasoning } = calculateGroupFitScore(entry._movie, ctx)

      return {
        tmdbId: entry.tmdbId,
        title: entry.title,
        overview: entry.overview,
        posterPath: entry.posterPath,
        backdropPath: entry.backdropPath,
        releaseDate: entry.releaseDate,
        runtime: entry.runtime,
        genres: entry.genres,
        voteAverage: entry.voteAverage,
        popularity: entry.popularity,
        certification: entry.certification,
        groupFitScore: score,
        genreMatchScore: entry.genreMatchScore,
        reasoning,
        seenBy,
      }
    })

    reScored.sort((a, b) => b.groupFitScore - a.groupFitScore)
    scoredMovies = reScored
  } else {
    // No affinities — use first-pass scores directly
    scoredMovies = top30.map(({ _movie, ...rest }) => rest)
  }

  // ── Post-scoring popularity floor ──
  // Prevents truly obscure films from making final results
  // Collab recommendations bypass this — if a taste-similar peer loved it, it's worth showing
  // Disabled under high filter pressure to prevent pool collapse
  if (dynamicPopularityFloor > 0) {
    const collabTmdbIds = new Set(collabRecs.map((r: CollabRecommendation) => r.tmdbId))
    scoredMovies = scoredMovies.filter(m => {
      const moviePopularity = m.popularity || 0
      return moviePopularity >= dynamicPopularityFloor || collabTmdbIds.has(m.tmdbId)
    })
  }

  // ── Franchise deduplication ──
  // Keep only the highest-scoring movie from each franchise to prevent sequel flooding
  scoredMovies = deduplicateFranchises(scoredMovies)
  console.log(`[Recommendations] Post-dedup pool: ${scoredMovies.length} movies`)

  // ── Phase 6: Parental guide filtering + taste context (parallel) ──
  let candidates = scoredMovies.slice(0, 50)

  const [parentalGuideData, lovedMovies, dislikedMovies] = await Promise.all([
    getParentalGuideBatch(candidates.map(m => ({ tmdbId: m.tmdbId }))),
    getLovedMovies(memberIds),
    getDislikedMovies(memberIds),
  ])

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

    if (filteredMovies.length >= 10) break
  }

  const finalResults = filteredMovies.slice(0, 10)

  // Background OMDb fetch for final results moved to after Phase 4 (top 50 pre-fetch)

  return {
    recommendations: finalResults,
    genres: groupGenres.slice(0, 5),
    totalRatings: groupGenres.reduce((sum, g) => sum + g.ratingCount, 0),
    lovedMovies,
    dislikedMovies,
  }
}

// ============================================
// Main Recommendation Function (Group)
// ============================================

export async function getTonightsPick(request: TonightPickRequest): Promise<TonightPickResponse> {
  const { collectiveId, memberIds, mood, maxRuntime, contentRating, parentalFilters, page = 1, era, startYear, streamingProviders } = request

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
    era,
    startYear,
    streamingProviders,
  })

  // Fire-and-forget: generate LLM reasoning asynchronously via Ably
  const reasoningChannel = `reasoning-${validMemberIds[0]}-${Date.now()}`
  generateAndPublishReasoning({
    recommendations: result.recommendations,
    lovedMovies: result.lovedMovies,
    dislikedMovies: result.dislikedMovies,
    mood: mood || null,
    soloMode: false,
    memberCount: validMemberIds.length,
    channelId: reasoningChannel,
  }).catch(e => console.error("[Recommendations] Async reasoning error:", e))

  return {
    recommendations: result.recommendations,
    groupProfile: {
      memberCount: validMemberIds.length,
      sharedGenres: result.genres,
      totalRatings: result.totalRatings,
    },
    reasoningChannel,
  }
}

// ============================================
// Solo Recommendation Function
// ============================================

export async function getSoloTonightsPick(request: SoloTonightPickRequest): Promise<SoloTonightPickResponse> {
  const { userId, mood, maxRuntime, contentRating, parentalFilters, page = 1, era, startYear, streamingProviders } = request

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
    era,
    startYear,
    streamingProviders,
  })

  // Fire-and-forget: generate LLM reasoning asynchronously via Ably
  const reasoningChannel = `reasoning-${userId}-${Date.now()}`
  generateAndPublishReasoning({
    recommendations: result.recommendations,
    lovedMovies: result.lovedMovies,
    dislikedMovies: result.dislikedMovies,
    mood: mood || null,
    soloMode: true,
    memberCount: 1,
    channelId: reasoningChannel,
  }).catch(e => console.error("[Recommendations] Async reasoning error:", e))

  return {
    recommendations: result.recommendations,
    userProfile: {
      sharedGenres: result.genres,
      totalRatings: result.totalRatings,
    },
    reasoningChannel,
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