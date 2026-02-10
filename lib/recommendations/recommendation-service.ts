import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "@/lib/tmdb/client"
import { getParentalGuideBatch } from "@/lib/parental-guide/parental-guide-service"
import { batchGetCachedOmdbScores, getMoviesNeedingOmdbFetch, backgroundFetchOmdbBatch, type CachedOmdbScores } from "@/lib/omdb/omdb-cache"
import { calculateCompositeQualityScore, getQualityBonus, getAcclaimedMoodBonus } from "@/lib/recommendations/quality-score"
import { generateRecommendationReasoning, getLovedMovies, getDislikedMovies } from "@/lib/recommendations/reasoning-service"
import { getCachedCrewAffinities, getCachedCandidateCredits } from "@/lib/recommendations/crew-affinity-service"
import { getSoloCollectiveInfluence, getGroupCollectiveInfluence, type CollectiveInfluenceEntry } from "@/lib/recommendations/collective-influence-service"
import { batchGetCachedMoodScores, calculateRuleBasedMoodScores, calculateMoodFitScore, type MoodScores } from "@/lib/recommendations/mood-score-service"

const sql = neon(process.env.DATABASE_URL!)

function timer(label: string) {
  const start = Date.now()
  return {
    done: () => {
      const ms = Date.now() - start
      console.log(`[Perf] ${label}: ${ms}ms`)
      return ms
    }
  }
}

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
// Quality & Recommendation History Config
// ============================================

const QUALITY_GATES = {
  MIN_VOTE_COUNT: 50,
  MIN_VOTE_AVERAGE: 5.0,
  ACCLAIMED_MIN_VOTE_COUNT: 200,
  ACCLAIMED_MIN_VOTE_AVERAGE: 7.0,
}

const RECENT_RECOMMENDATION_WINDOW_DAYS = 30
const REPEAT_PENALTY = 15 // Score penalty for movies recommended in last 30 days
const PREVIOUSLY_SHOWN_PENALTY = 25 // Score penalty for movies shown earlier in current session

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
  mood?: "fun" | "funny" | "intense" | "emotional" | "mindless" | "acclaimed" | "scary" | null
  moods?: string[] // Multi-mood selection (union of mood filters)
  audience?: "anyone" | "teens" | "adults"
  maxRuntime?: number | null // In minutes
  contentRating?: string | null // "G", "PG", "PG-13", "R" - will include this and lower
  parentalFilters?: ParentalFilters | null
  page?: number // For pagination/shuffle - different pages return different results
  era?: string | null // e.g. "1980s", "1990s" — filters to that decade
  startYear?: number | null // e.g. 2000 — only movies from this year onwards
  streamingProviders?: number[] | null // TMDB watch provider IDs to filter by
  excludeTmdbIds?: number[] | null // Previously shown movies to exclude on shuffle
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
  mood?: "fun" | "funny" | "intense" | "emotional" | "mindless" | "acclaimed" | "scary" | null
  moods?: string[] // Multi-mood selection (union of mood filters)
  audience?: "anyone" | "teens" | "adults"
  maxRuntime?: number | null
  contentRating?: string | null
  parentalFilters?: ParentalFilters | null
  page?: number
  era?: string | null
  startYear?: number | null
  streamingProviders?: number[] | null
  excludeTmdbIds?: number[] | null
}

export type SoloTonightPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
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
  moods: string[]
  audience: string
  moodPreferGenres: number[]
  moodSoftAvoidGenres: number[]
  moodScores: MoodScores | null
  collectiveInfluence: CollectiveInfluenceEntry | null
  selectedMemberRating: { avgScore: number; raterCount: number } | null
  previouslyShownTmdbIds: Set<number>
  recentlyRecommendedTmdbIds: Set<number>
  internalSignal: { avgScore: number; raterCount: number } | null
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
 * Batch fetch selected members' actual ratings for candidate movies.
 * Used for the endorsement signal — when selected members have already
 * rated a movie, their scores inform whether to boost or penalize it.
 */
async function getSelectedMemberRatings(
  memberIds: string[],
  tmdbIds: number[]
): Promise<Map<number, { avgScore: number; raterCount: number; ratings: number[] }>> {
  if (memberIds.length === 0 || tmdbIds.length === 0) return new Map()

  const result = await sql`
    SELECT
      m.tmdb_id,
      umr.overall_score
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    WHERE umr.user_id = ANY(${memberIds}::uuid[])
      AND m.tmdb_id = ANY(${tmdbIds}::int[])
  `

  // Group by tmdb_id
  const ratingsMap = new Map<number, number[]>()
  for (const row of result) {
    const tmdbId = Number(row.tmdb_id)
    if (!ratingsMap.has(tmdbId)) {
      ratingsMap.set(tmdbId, [])
    }
    ratingsMap.get(tmdbId)!.push(Number(row.overall_score))
  }

  // Compute aggregates
  const resultMap = new Map<number, { avgScore: number; raterCount: number; ratings: number[] }>()
  for (const [tmdbId, ratings] of ratingsMap) {
    const avgScore = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
    resultMap.set(tmdbId, { avgScore, raterCount: ratings.length, ratings })
  }

  return resultMap
}

/**
 * Get TMDB IDs of movies recently recommended to any of the given members.
 * Used for cross-session deprioritization to prevent repeat recommendations.
 * Gracefully returns empty set if the recommendation_history table doesn't exist yet.
 */
async function getRecentRecommendationHistory(
  memberIds: string[],
  windowDays: number = RECENT_RECOMMENDATION_WINDOW_DAYS
): Promise<Set<number>> {
  if (memberIds.length === 0) return new Set()
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - windowDays)
    const result = await sql`
      SELECT DISTINCT tmdb_id
      FROM recommendation_history
      WHERE user_id = ANY(${memberIds}::uuid[])
        AND shown_at > ${cutoffDate.toISOString()}::timestamptz
    `
    return new Set(result.map((r: any) => Number(r.tmdb_id)))
  } catch {
    // Table may not exist yet — graceful fallback
    return new Set()
  }
}

/**
 * Log recommended movies for cross-session deduplication.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function logRecommendationHistory(
  userId: string,
  tmdbIds: number[],
  context: string = "tonights_pick"
): Promise<void> {
  if (tmdbIds.length === 0) return
  try {
    await sql`
      INSERT INTO recommendation_history (user_id, tmdb_id, context, shown_at)
      SELECT ${userId}::uuid, unnest(${tmdbIds}::int[]), ${context}, NOW()
    `
  } catch (e) {
    console.error("[RecommendationHistory] Error logging:", e)
  }
}

/**
 * Clean up recommendation_history rows older than 90 days.
 * Should be called periodically (e.g., fire-and-forget after recommendations).
 */
async function cleanupOldRecommendationHistory(): Promise<void> {
  try {
    await sql`DELETE FROM recommendation_history WHERE shown_at < NOW() - INTERVAL '90 days'`
  } catch {
    // Table may not exist yet — ignore
  }
}

/**
 * Get TMDB IDs of movies dismissed ("Not Interested") by ANY of the given members.
 * Returns a Set for O(1) lookup — we skip if any member dismissed.
 */
async function getDismissedMovieTmdbIds(memberIds: string[]): Promise<Set<number>> {
  if (memberIds.length === 0) return new Set()

  const result = await sql`
    SELECT DISTINCT movie_id FROM user_dismissed_movies
    WHERE user_id = ANY(${memberIds}::uuid[])
  `

  return new Set(result.map((r: any) => Number(r.movie_id)))
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

/**
 * Fetch high-quality candidates from Film Collective's own movies database.
 * These are movies that platform users have watched and rated, providing far
 * richer signal than TMDB discover results.
 */
async function getInternalCandidates(
  memberIds: string[],
  options: {
    moods?: string[]
    maxRuntime?: number | null
    era?: string | null
    startYear?: number | null
    audience?: string
    excludeTmdbIds?: number[] | null
    limit?: number
  }
): Promise<any[]> {
  const { moods = [], maxRuntime, era, startYear, audience, excludeTmdbIds, limit = 100 } = options
  try {
    // Pre-compute era date bounds for parameterized query
    let eraStartDate: string | null = null
    let eraEndDate: string | null = null
    if (era) {
      if (era === "Pre-40s") {
        eraEndDate = "1939-12-31"
      } else {
        const decadeStart = parseInt(era)
        if (!isNaN(decadeStart)) {
          eraStartDate = `${decadeStart}-01-01`
          eraEndDate = `${decadeStart + 9}-12-31`
        }
      }
    } else if (startYear) {
      eraStartDate = `${startYear}-01-01`
    }

    const result = await sql`
      SELECT
        m.tmdb_id AS id,
        m.title,
        m.overview,
        m.genres,
        m.tmdb_vote_average::float AS vote_average,
        m.tmdb_popularity::float AS popularity,
        m.release_date::text AS release_date,
        m.poster_path,
        m.backdrop_path,
        m.runtime_minutes AS runtime,
        m.tmdb_vote_count AS vote_count,
        AVG(umr.overall_score)::float AS internal_avg_score,
        COUNT(DISTINCT umr.user_id)::int AS internal_rater_count
      FROM movies m
      JOIN user_movie_ratings umr ON m.id = umr.movie_id
      WHERE m.poster_path IS NOT NULL
        AND m.overview IS NOT NULL AND m.overview != ''
        AND m.genres IS NOT NULL AND jsonb_array_length(m.genres) > 0
        AND NOT (
          -- Exclude movies seen by ALL selected members
          (SELECT COUNT(DISTINCT umr2.user_id) FROM user_movie_ratings umr2
           WHERE umr2.movie_id = m.id AND umr2.user_id = ANY(${memberIds}::uuid[]))
          >= ${memberIds.length}
        )
        AND m.tmdb_id NOT IN (
          SELECT movie_id FROM user_dismissed_movies
          WHERE user_id = ANY(${memberIds}::uuid[])
        )
        ${excludeTmdbIds && excludeTmdbIds.length > 0 ? sql`AND m.tmdb_id != ALL(${excludeTmdbIds}::int[])` : sql``}
        ${maxRuntime ? sql`AND (m.runtime_minutes IS NULL OR m.runtime_minutes <= ${maxRuntime})` : sql``}
        ${eraStartDate && eraEndDate ? sql`AND m.release_date >= ${eraStartDate} AND m.release_date <= ${eraEndDate}` : eraStartDate ? sql`AND m.release_date >= ${eraStartDate}` : eraEndDate ? sql`AND m.release_date <= ${eraEndDate}` : sql``}
        ${audience === "adults" ? sql`AND NOT (m.genres @> '[{"id": 10751}]'::jsonb OR m.genres @> '[{"id": 16}]'::jsonb)` : sql``}
      GROUP BY m.id, m.tmdb_id, m.title, m.overview, m.genres, m.tmdb_vote_average,
               m.tmdb_popularity, m.release_date, m.poster_path, m.backdrop_path,
               m.runtime_minutes, m.tmdb_vote_count, m.mood_scores
      HAVING COUNT(DISTINCT umr.user_id) >= 2
      ORDER BY AVG(umr.overall_score) * LN(COUNT(DISTINCT umr.user_id) + 1) DESC
      LIMIT ${limit}
    `

    return result.map((row: any) => ({
      id: Number(row.id),
      title: row.title,
      overview: row.overview,
      genres: typeof row.genres === "string" ? JSON.parse(row.genres) : row.genres,
      vote_average: Number(row.vote_average) || 0,
      popularity: Number(row.popularity) || 0,
      release_date: row.release_date,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      runtime: row.runtime ? Number(row.runtime) : null,
      vote_count: row.vote_count ? Number(row.vote_count) : 0,
      // Extra fields for internal signal bonus
      _internal_avg_score: Number(row.internal_avg_score),
      _internal_rater_count: Number(row.internal_rater_count),
    }))
  } catch (e) {
    console.error("[InternalCandidates] Error:", e)
    return []
  }
}

/**
 * Batch fetch avg rating + rater count for candidates that exist in the internal DB.
 * Used to add internal signal bonuses to TMDB-sourced candidates.
 */
async function getInternalSignalBatch(
  tmdbIds: number[]
): Promise<Map<number, { avgScore: number; raterCount: number }>> {
  if (tmdbIds.length === 0) return new Map()
  try {
    const result = await sql`
      SELECT
        m.tmdb_id,
        AVG(umr.overall_score)::float AS avg_score,
        COUNT(DISTINCT umr.user_id)::int AS rater_count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE m.tmdb_id = ANY(${tmdbIds}::int[])
      GROUP BY m.tmdb_id
      HAVING COUNT(DISTINCT umr.user_id) >= 2
    `
    const map = new Map<number, { avgScore: number; raterCount: number }>()
    for (const row of result) {
      map.set(Number(row.tmdb_id), {
        avgScore: Math.round(Number(row.avg_score)),
        raterCount: Number(row.rater_count),
      })
    }
    return map
  } catch (e) {
    console.error("[InternalSignalBatch] Error:", e)
    return new Map()
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
  // Track which signal categories fire for the well-rounded bonus
  const signalCategories = new Set<string>()

  // --- Dynamic base score (55, up from 50) ---
  let score = 55

  const movieGenreIds = new Set<number>(
    movie.genres
      ? (movie.genres).map((g: any) => g.id)
      : (movie.genre_ids || [])
  )

  // +3 base bonus if the movie matches at least 1 preferred genre
  const matchesAnyPreferredGenre = ctx.preferredGenres.some(p => movieGenreIds.has(p.genreId))
  if (matchesAnyPreferredGenre) {
    score += 3
  }

  // --- Genre match (weighted by member ratings, top 8 genres) ---
  // Top 3 matches use multiplier 18, matches 4-8 use multiplier 15
  let genreBoost = 0
  let genreMatchCount = 0
  for (let i = 0; i < Math.min(8, ctx.preferredGenres.length); i++) {
    const pref = ctx.preferredGenres[i]
    if (movieGenreIds.has(pref.genreId)) {
      genreMatchCount++
      const confidence = Math.min(1, pref.ratingCount / 10)
      const multiplier = genreMatchCount <= 3 ? 18 : 15
      genreBoost += (pref.avgScore / 100) * multiplier * confidence
    }
  }
  score += Math.round(genreBoost)
  if (genreMatchCount > 0) {
    signalCategories.add("genre")
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

  // --- Seen penalty (softened in group mode: -15, full -30 in solo mode) ---
  if (ctx.seenByCount > 0) {
    const penaltyMultiplier = ctx.seenByCount / ctx.totalMembers
    const basePenalty = ctx.soloMode ? 30 : 15
    score -= Math.round(basePenalty * penaltyMultiplier)
    if (ctx.soloMode) {
      reasoning.push("You may have seen this")
    } else {
      reasoning.push(`${ctx.seenByCount} member(s) may have seen this`)
    }
  }

  // --- Selected member endorsement (max +30, or -10 penalty for disliked) ---
  if (ctx.selectedMemberRating && ctx.seenByCount > 0 && ctx.seenByCount < ctx.totalMembers) {
    const { avgScore, raterCount } = ctx.selectedMemberRating
    if (avgScore >= 85) {
      score += 30
      signalCategories.add("endorsement")
      reasoning.push(`Rated ${avgScore}/100 by ${raterCount} member${raterCount > 1 ? "s" : ""} in your group`)
    } else if (avgScore >= 70) {
      score += 20
      signalCategories.add("endorsement")
      reasoning.push(`Rated ${avgScore}/100 by ${raterCount} member${raterCount > 1 ? "s" : ""} in your group`)
    } else if (avgScore >= 55) {
      score += 10
      signalCategories.add("endorsement")
      reasoning.push(`Rated ${avgScore}/100 by ${raterCount} member${raterCount > 1 ? "s" : ""} in your group`)
    } else if (avgScore < 40) {
      score -= 10
      reasoning.push(`Rated only ${avgScore}/100 by ${raterCount} member${raterCount > 1 ? "s" : ""} in your group`)
    }
  }

  // --- Previously shown penalty (shuffle deprioritization) ---
  if (ctx.previouslyShownTmdbIds.has(movie.id)) {
    score -= PREVIOUSLY_SHOWN_PENALTY
  }

  // --- Recently recommended penalty (cross-session deprioritization) ---
  if (ctx.recentlyRecommendedTmdbIds.has(movie.id)) {
    score -= REPEAT_PENALTY
  }

  // --- Mood affinity scoring (per-movie mood scores with geometric mean for multi-mood AND semantics) ---
  if (ctx.moods.length > 0 && ctx.moodScores) {
    const { score: moodFit, passesThreshold } = calculateMoodFitScore(ctx.moodScores, ctx.moods)

    // Scale: 0.0-1.0 mood fit → 0 to +40 points
    const moodBonus = Math.round(moodFit * 40)
    score += moodBonus

    if (moodFit >= 0.35) signalCategories.add("mood")

    if (moodFit >= 0.6) {
      reasoning.push(ctx.moods.length > 1
        ? `Great match for your ${ctx.moods.join(" + ")} mood`
        : `Fits the ${ctx.moods[0]} mood well`)
    } else if (moodFit >= 0.35) {
      reasoning.push("Somewhat fits your mood")
    }

    // Penalty for not passing threshold on any mood
    if (!passesThreshold) {
      score -= 20
    }
  } else if (ctx.moods.length > 0) {
    // Fallback: no mood scores available, use legacy genre-based scoring (reduced weight)
    let moodMatchCount = 0
    for (const genreId of ctx.moodPreferGenres) {
      if (movieGenreIds.has(genreId)) {
        moodMatchCount++
        score += 5
      }
    }
    if (moodMatchCount > 0) {
      reasoning.push("Genre fits your mood")
    }
    let softAvoidCount = 0
    for (const genreId of ctx.moodSoftAvoidGenres) {
      if (movieGenreIds.has(genreId)) {
        softAvoidCount++
        score -= 6
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
  if (qualityBonus > 0) signalCategories.add("quality")
  if (qualityReasoning) reasoning.push(qualityReasoning)

  // --- Acclaimed mood bonus (critic-score-based, only when mood includes "acclaimed") ---
  if (ctx.moods.includes("acclaimed")) {
    const { bonus: acclaimedBonus, reasoning: acclaimedReasoning } = getAcclaimedMoodBonus(ctx.omdbScores)
    score += acclaimedBonus
    if (acclaimedReasoning.length > 0) {
      reasoning.push(acclaimedReasoning.join(", "))
    }
  }

  // --- Audience scoring penalty ---
  if (ctx.audience === "teens") {
    // If movie has BOTH Animation (16) AND Family (10751), penalize for teen audience
    if (movieGenreIds.has(16) && movieGenreIds.has(10751)) {
      score -= 8
    }
  } else if (ctx.audience === "adults") {
    // Penalize Family genre content for adult audience
    if (movieGenreIds.has(10751)) {
      score -= 15
      reasoning.push("May be too family-oriented for your audience")
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

  // --- Vote count confidence boost (log-scale, max +5) ---
  // Continuous signal complementing the step-based availability bonus
  if (voteCount > 0) {
    const logBoost = Math.min(Math.log10(voteCount) / 5, 1.0)
    const voteConfidenceBonus = Math.round(logBoost * 5)
    score += voteConfidenceBonus
  }

  // --- Director affinity (max +12) ---
  if (ctx.candidateDirectorIds.size > 0 && ctx.directorAffinities.length > 0) {
    for (const aff of ctx.directorAffinities) {
      if (ctx.candidateDirectorIds.has(aff.personId)) {
        const bonus = Math.round((aff.avgScore / 100) * 12)
        score += bonus
        signalCategories.add("crew")
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
      signalCategories.add("crew")
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
    signalCategories.add("collabFiltering")
    reasoning.push("Loved by people with similar taste")
  }

  // --- Collective friend influence (max +30) ---
  if (ctx.collectiveInfluence) {
    const { avgScore, raterCount, raterNames } = ctx.collectiveInfluence

    let influenceBonus = Math.round((avgScore / 100) * 30)

    if (raterCount >= 3) influenceBonus = Math.min(30, influenceBonus + 7)
    else if (raterCount >= 2) influenceBonus = Math.min(30, influenceBonus + 4)

    score += influenceBonus
    signalCategories.add("collectiveInfluence")

    if (ctx.soloMode) {
      if (raterCount === 1) {
        reasoning.push(`${raterNames[0]} rated this ${avgScore}/100`)
      } else {
        reasoning.push(`${raterNames.slice(0, 3).join(", ")} loved this (avg ${avgScore}/100)`)
      }
    } else {
      if (raterCount === 1) {
        reasoning.push(`${raterNames[0]} in your collective rated this ${avgScore}/100`)
      } else {
        reasoning.push(`${raterNames.slice(0, 3).join(" & ")} in your collective loved this`)
      }
    }
  }

  // --- Internal DB signal (max +15) ---
  // Movies rated by Film Collective users have proven real-world appeal
  if (ctx.internalSignal) {
    const { avgScore, raterCount } = ctx.internalSignal
    let internalBonus = 0

    // Scale by rating quality
    if (avgScore >= 80) internalBonus += 8
    else if (avgScore >= 65) internalBonus += 4

    // Scale by confidence (more raters = more reliable)
    if (raterCount >= 5) internalBonus += 7
    else if (raterCount >= 3) internalBonus += 5
    else if (raterCount >= 2) internalBonus += 3

    internalBonus = Math.min(15, internalBonus)
    score += internalBonus

    if (internalBonus > 0) {
      signalCategories.add("internalDB")
      reasoning.push(`Rated by ${raterCount} Film Collective member${raterCount > 1 ? "s" : ""}`)
    }
  }

  // --- Mood dampening: scale down non-mood bonuses for poor mood fits ---
  if (ctx.moods.length > 0 && ctx.moodScores) {
    const { score: moodFit } = calculateMoodFitScore(ctx.moodScores, ctx.moods)
    if (moodFit < 0.5) {
      // At moodFit=0.4: dampening = 0.9 (mild)
      // At moodFit=0.25: dampening = 0.75 (moderate)
      // At moodFit=0.1: dampening = 0.6 (strong)
      const dampening = 0.5 + (moodFit * 1.0) // 0.5-1.0 range
      const bonusAboveBase = score - 55
      if (bonusAboveBase > 0) {
        score = 55 + Math.round(bonusAboveBase * dampening)
      }
    }
  }

  // --- Well-rounded match bonus (+5 if 3+ signal categories fire) ---
  if (signalCategories.size >= 3) {
    score += 5
    reasoning.push("Strong match across multiple dimensions")
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
    case "scary":
      return {
        preferGenres: [27, 53, 9648],            // Horror, Thriller, Mystery
        avoidGenres: [],
        softAvoidGenres: [10751, 16, 35, 10749], // Family, Animation, Comedy, Romance
        sortBy: "popularity.desc",
      }
    case "funny":
      return {
        preferGenres: [35, 16],                   // Comedy, Animation
        avoidGenres: [],
        softAvoidGenres: [27, 10752, 18],         // Horror, War, Drama (without comedy)
        sortBy: "popularity.desc",
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

/**
 * Merge mood filters for multiple selected moods.
 * preferGenres: union of all moods' preferred genres
 * avoidGenres: intersection — only exclude genres ALL moods avoid
 * softAvoidGenres: union, minus anything in preferGenres
 * sortBy: "acclaimed" in moods → vote_average.desc, else popularity.desc
 */
function getMultiMoodFilters(moods: string[]): {
  preferGenres: number[]
  avoidGenres: number[]
  softAvoidGenres: number[]
  sortBy: string
} {
  if (moods.length === 0) {
    return { preferGenres: [], avoidGenres: [], softAvoidGenres: [], sortBy: "popularity.desc" }
  }
  if (moods.length === 1) {
    return getMoodFilters(moods[0] as any)
  }

  const allFilters = moods.map(m => getMoodFilters(m as any))

  // Union of preferred genres
  const preferSet = new Set<number>()
  for (const f of allFilters) {
    for (const g of f.preferGenres) preferSet.add(g)
  }

  // Intersection of avoid genres — only hard-exclude if ALL moods avoid it
  const avoidSets = allFilters.map(f => new Set(f.avoidGenres))
  const avoidGenres: number[] = []
  if (avoidSets.length > 0) {
    for (const g of avoidSets[0]) {
      if (avoidSets.every(s => s.has(g))) {
        avoidGenres.push(g)
      }
    }
  }

  // Union of soft avoid, minus anything in prefer
  const softAvoidSet = new Set<number>()
  for (const f of allFilters) {
    for (const g of f.softAvoidGenres) {
      if (!preferSet.has(g)) softAvoidSet.add(g)
    }
  }

  // Sort: acclaimed in moods → vote_average, else popularity
  const sortBy = moods.includes("acclaimed") ? "vote_average.desc" : "popularity.desc"

  return {
    preferGenres: Array.from(preferSet),
    avoidGenres,
    softAvoidGenres: Array.from(softAvoidSet),
    sortBy,
  }
}

// ============================================
// Shared Recommendation Logic
// ============================================

type FetchAndScoreOptions = {
  memberIds: string[]
  moods?: string[]
  audience?: "anyone" | "teens" | "adults"
  maxRuntime?: number | null
  contentRating?: string | null
  parentalFilters?: ParentalFilters | null
  page?: number
  soloMode?: boolean
  era?: string | null
  startYear?: number | null
  streamingProviders?: number[] | null
  collectiveId?: string | null
  excludeTmdbIds?: number[] | null
}

async function _fetchAndScoreMovies(options: FetchAndScoreOptions): Promise<{
  recommendations: MovieRecommendation[]
  genres: GenrePreference[]
  totalRatings: number
  lovedMovies: { title: string; avgScore: number }[]
  dislikedMovies: { title: string; avgScore: number }[]
  collectiveInfluenceMap: Map<number, CollectiveInfluenceEntry>
}> {
  const { memberIds, moods: rawMoods, audience = "anyone", maxRuntime, contentRating, parentalFilters, page = 1, soloMode = false, era, startYear, streamingProviders, collectiveId, excludeTmdbIds } = options
  const moods = rawMoods || []

  const totalTimer = timer("_fetchAndScoreMovies TOTAL")
  const pageOffset = (page - 1) * 3
  const excludeSet = new Set(excludeTmdbIds || [])

  // ── Phase 1: Parallel DB queries ──
  const t1 = timer("Phase 1: DB queries (parallel)")
  const [groupGenres, seenMovies, dismissedTmdbIds, dislikedGenreSet, eraPreferences, crewAffinitiesResult, peerIds, recentlyRecommendedTmdbIds, internalCandidates] = await Promise.all([
    getGroupGenrePreferences(memberIds),
    getSeenMovieTmdbIds(memberIds),
    getDismissedMovieTmdbIds(memberIds),
    getDislikedGenres(memberIds),
    getEraPreferences(memberIds),
    getCachedCrewAffinities(memberIds),
    getTasteSimilarPeers(memberIds),
    getRecentRecommendationHistory(memberIds),
    getInternalCandidates(memberIds, { moods, maxRuntime, era, startYear, audience, excludeTmdbIds }),
  ])
  t1.done()

  const moodFilters = getMultiMoodFilters(moods)

  const tmdb = createTMDBClient()
  if (!tmdb) {
    throw new Error("TMDB client not available")
  }

  // ── Filter Pressure System ──
  // Calculate cumulative filter pressure to detect when filters stack too aggressively
  const totalSeen = seenMovies.size
  let filterPressure = 0

  if (moods.includes("acclaimed")) filterPressure += 3
  else if (moods.includes("emotional") || moods.includes("intense")) filterPressure += 1
  else if (moods.length > 0) filterPressure += 0.5
  // Multi-mood AND semantics is moderately restrictive
  if (moods.length > 1) filterPressure += 2

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
    moods: moods.length > 0 ? moods.join("+") : "none",
    audience,
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

  if (moods.includes("acclaimed")) {
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
    if (era === "Pre-40s") {
      // No lower bound — everything up to 1939
      eraDateRange.primaryReleaseDateLte = "1939-12-31"
    } else {
      const decadeStart = parseInt(era) // "1980s" → 1980
      if (!isNaN(decadeStart)) {
        eraDateRange.primaryReleaseDateGte = `${decadeStart}-01-01`
        eraDateRange.primaryReleaseDateLte = `${decadeStart + 9}-12-31`
      }
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

  // Audience filter — applied to discover options
  if (audience === "teens") {
    if (!contentRating) {
      discoverOptions.certificationCountry = "US"
      discoverOptions.certificationGte = "PG"
    }
  } else if (audience === "adults") {
    // Exclude Animation (16) + Family (10751) genres
    discoverOptions.withoutGenres = "16,10751"
    if (!contentRating) {
      discoverOptions.certificationCountry = "US"
      discoverOptions.certificationGte = "PG-13"
    }
  }

  // ── Phase 2: Collab recs + TMDB discovers in parallel ──
  // Crew affinities already loaded from cache in Phase 1
  const crewAffinities = crewAffinitiesResult
  const seenTmdbIds = new Set(seenMovies.keys())

  const t2 = timer("Phase 2: TMDB discovers")
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
  t2.done()

  // Seed with internal DB candidates first — TMDB results are added after
  const candidateMovies: any[] = [...internalCandidates]
  for (const result of tmdbResults) {
    if (result?.results) candidateMovies.push(...result.results)
  }

  // Power users need deeper pages since they've seen the obvious results
  const extraPageDepth = totalSeen > 500 ? 3
                       : totalSeen > 200 ? 2
                       : 0
  if (extraPageDepth > 0) {
    const t2a = timer("Phase 2a: Power user deep pages")
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
    t2a.done()
  }

  // ── Pressure-based extra fetches (parallelized) ──
  if (extraPressurePages > 0) {
    const t2b = timer("Phase 2b: Pressure extra fetches")
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
    t2b.done()
  }

  // ── Phase 3: Inject collab candidates not already in pool ──
  const t2d = timer("Phase 2d: Collaborative filtering candidates")
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

  t2d.done()

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

  // ── Collective influence: friends' taste ──
  const t2e = timer("Phase 2e: Collective influence query + injection")
  const collectiveInfluenceMap = soloMode
    ? await getSoloCollectiveInfluence(memberIds[0])
    : collectiveId
      ? await getGroupCollectiveInfluence(collectiveId, memberIds)
      : new Map<number, CollectiveInfluenceEntry>()

  // Inject influence movies not already in candidate pool
  const candidateTmdbIdsSet = new Set(uniqueMovies.map((m: any) => m.id))
  const missingInfluenceIds = Array.from(collectiveInfluenceMap.keys())
    .filter(tmdbId => !candidateTmdbIdsSet.has(tmdbId))
    .slice(0, 25)

  if (missingInfluenceIds.length > 0) {
    const influenceDetails = await Promise.all(
      missingInfluenceIds.map(id => tmdb.getMovieDetails(id).catch(() => null))
    )
    for (const movie of influenceDetails) {
      if (movie) {
        uniqueMovies.push(movie)
        candidateTmdbIdsSet.add(movie.id)
      }
    }
  }

  console.log(`[Recommendations] Collective influence: ${collectiveInfluenceMap.size} movies from friends`)
  t2e.done()

  // ── Emergency fallback — pool size check ──
  // Count viable candidates (at least one member hasn't seen it)
  const viableCandidates = uniqueMovies.filter((m: any) => {
    const seenBy = seenMovies.get(m.id) || []
    return seenBy.length < memberIds.length
  })

  const MIN_VIABLE_POOL = 15
  if (viableCandidates.length < MIN_VIABLE_POOL) {
    const t2c = timer("Phase 2c: Emergency fallback")
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
    t2c.done()
  }

  console.log(`[Perf] Candidate pool size after dedup: ${uniqueMovies.length}`)
  console.log(`[Recommendations] Pool stats:`, {
    internalCandidates: internalCandidates.length,
    totalCandidatesFetched: candidateMovies.length,
    afterDedup: uniqueMovies.length,
    viableBeforeScoring: viableCandidates.length,
    emergencyFetchUsed: viableCandidates.length < MIN_VIABLE_POOL,
  })

  // ── Quality gate: filter low-quality and thin-metadata candidates ──
  const qualityGateVoteCount = moods.includes("acclaimed")
    ? QUALITY_GATES.ACCLAIMED_MIN_VOTE_COUNT
    : QUALITY_GATES.MIN_VOTE_COUNT
  const qualityGateVoteAverage = moods.includes("acclaimed")
    ? QUALITY_GATES.ACCLAIMED_MIN_VOTE_AVERAGE
    : QUALITY_GATES.MIN_VOTE_AVERAGE

  const beforeQualityGate = uniqueMovies.length
  uniqueMovies = uniqueMovies.filter((m: any) => {
    const vc = m.vote_count || 0
    const va = m.vote_average || 0

    // Hard quality floor — not enough votes or poorly rated
    if (vc < qualityGateVoteCount || va < qualityGateVoteAverage) return false

    // Thin metadata — no overview means bad mood scores, no poster means broken UI
    if (!m.overview || m.overview.trim() === "") return false
    if (!m.poster_path) return false

    // At least 1 genre for scoring to work
    const genres = m.genres || m.genre_ids || []
    if (genres.length === 0) return false

    return true
  })

  if (beforeQualityGate !== uniqueMovies.length) {
    console.log(`[Quality Gate] Filtered ${beforeQualityGate - uniqueMovies.length} candidates (${beforeQualityGate} → ${uniqueMovies.length})`)
  }

  // ── Phase 3.5: Batch load cached OMDb + mood scores + selected member ratings + internal signal (parallel) ──
  const t3 = timer("Phase 3: OMDb + mood + member ratings + internal signal batch load")
  const candidateTmdbIdsForOmdb = uniqueMovies.map((m: any) => m.id as number)
  // Only fetch selected member ratings for movies that at least one member has seen
  const seenCandidateTmdbIds = candidateTmdbIdsForOmdb.filter(id => seenMovies.has(id))

  // Build initial internal signal map from internal candidates (they already have avg_score + rater_count)
  const internalSignalMap = new Map<number, { avgScore: number; raterCount: number }>()
  for (const ic of internalCandidates) {
    if (ic._internal_avg_score && ic._internal_rater_count >= 2) {
      internalSignalMap.set(ic.id, {
        avgScore: Math.round(ic._internal_avg_score),
        raterCount: ic._internal_rater_count,
      })
    }
  }

  const [omdbScoresMap, moodScoresMap, selectedMemberRatingsMap, externalInternalSignalMap] = await Promise.all([
    batchGetCachedOmdbScores(candidateTmdbIdsForOmdb),
    batchGetCachedMoodScores(candidateTmdbIdsForOmdb),
    soloMode
      ? Promise.resolve(new Map<number, { avgScore: number; raterCount: number; ratings: number[] }>())
      : getSelectedMemberRatings(memberIds, seenCandidateTmdbIds),
    // Fetch internal signal for TMDB-sourced candidates that might also exist in our DB
    getInternalSignalBatch(candidateTmdbIdsForOmdb),
  ])

  // Merge external internal signal into the map (external query covers all candidates)
  for (const [tmdbId, signal] of externalInternalSignalMap) {
    if (!internalSignalMap.has(tmdbId)) {
      internalSignalMap.set(tmdbId, signal)
    }
  }

  t3.done()

  // ── Phase 4: First-pass scoring (without credits) ──
  const t4 = timer("Phase 4: First-pass scoring")
  const firstPassScored: (MovieRecommendation & { _movie: any })[] = []

  for (const movie of uniqueMovies) {
    // Previously shown movies are now deprioritized via scoring penalty, not hard-excluded

    // Skip movies dismissed ("Not Interested") by any participant
    if (dismissedTmdbIds.has(movie.id)) {
      continue
    }

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
    if (hasAvoidedGenre && moods.length > 0) {
      continue
    }

    const cachedMoodScores = moodScoresMap.get(movie.id) || null
    const movieMoodScores = cachedMoodScores || (moods.length > 0
      ? calculateRuleBasedMoodScores({
          genres: movie.genres || movie.genre_ids?.map((id: number) => ({ id })) || [],
          vote_average: movie.vote_average,
          popularity: movie.popularity,
          runtime: movie.runtime,
          overview: movie.overview,
          omdbScores: omdbScoresMap.get(movie.id) || null,
        })
      : null)

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
      moods,
      audience,
      moodPreferGenres: moods.length > 0 ? moodFilters.preferGenres : [],
      moodSoftAvoidGenres: moods.length > 0 ? moodFilters.softAvoidGenres : [],
      moodScores: movieMoodScores,
      collectiveInfluence: collectiveInfluenceMap.get(movie.id) || null,
      selectedMemberRating: selectedMemberRatingsMap.get(movie.id) || null,
      previouslyShownTmdbIds: excludeSet,
      recentlyRecommendedTmdbIds,
      internalSignal: internalSignalMap.get(movie.id) || null,
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

  // ── Mood threshold gating (progressive lowering) ──
  // Filter out movies that fail mood threshold on any selected mood.
  // Only applies to movies with cached LLM mood scores (don't penalize unscored movies).
  if (moods.length > 0) {
    const applyMoodGating = (threshold: number) => {
      return firstPassScored.filter(entry => {
        const cached = moodScoresMap.get(entry.tmdbId)
        if (!cached) return true // Don't exclude unscored movies
        const { passesThreshold } = calculateMoodFitScore(cached, moods, threshold)
        return passesThreshold
      })
    }

    let gated = applyMoodGating(0.4)
    if (gated.length < 15) {
      console.log(`[Mood Gating] Only ${gated.length} candidates at threshold 0.4, lowering to 0.25`)
      gated = applyMoodGating(0.25)
    }
    if (gated.length < 10) {
      console.log(`[Mood Gating] Only ${gated.length} candidates at threshold 0.25, lowering to 0.15`)
      gated = applyMoodGating(0.15)
    }
    if (gated.length < 10) {
      console.log(`[Mood Gating] Only ${gated.length} candidates at threshold 0.15, disabling threshold`)
      // Keep all candidates — the affinity scoring in calculateGroupFitScore still ranks them
    } else {
      firstPassScored.length = 0
      firstPassScored.push(...gated)
    }
  }

  t4.done()

  console.log(`[Perf] Candidates scored: ${firstPassScored.length}, top score: ${firstPassScored[0]?.groupFitScore}, bottom of top 30: ${firstPassScored[29]?.groupFitScore}`)

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
  const t5 = timer("Phase 5: Credit enrichment + re-scoring")
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

      const reCachedMoodScores = moodScoresMap.get(entry.tmdbId) || null
      const reMovieMoodScores = reCachedMoodScores || (moods.length > 0
        ? calculateRuleBasedMoodScores({
            genres: entry.genres || [],
            vote_average: entry.voteAverage,
            popularity: entry.popularity,
            runtime: entry.runtime || undefined,
            overview: entry.overview,
            omdbScores: omdbScoresMap.get(entry.tmdbId) || null,
          })
        : null)

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
        moods,
        audience,
        moodPreferGenres: moods.length > 0 ? moodFilters.preferGenres : [],
        moodSoftAvoidGenres: moods.length > 0 ? moodFilters.softAvoidGenres : [],
        moodScores: reMovieMoodScores,
        collectiveInfluence: collectiveInfluenceMap.get(entry.tmdbId) || null,
        selectedMemberRating: selectedMemberRatingsMap.get(entry.tmdbId) || null,
        previouslyShownTmdbIds: excludeSet,
        recentlyRecommendedTmdbIds,
        internalSignal: internalSignalMap.get(entry.tmdbId) || null,
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

  t5.done()

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
  const t6 = timer("Phase 6: Parental guide + taste context")
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

    if (filteredMovies.length >= 5) break
  }

  const finalResults = filteredMovies.slice(0, 5)
  t6.done()

  // Background OMDb fetch for final results (complements the top-50 pre-fetch after Phase 4)
  const finalTmdbIds = finalResults.map(m => m.tmdbId)
  getMoviesNeedingOmdbFetch(finalTmdbIds)
    .then(needsFetch => {
      if (needsFetch.length > 0) {
        console.log(`[OMDb] Background fetching ${needsFetch.length} final result movies`)
        backgroundFetchOmdbBatch(needsFetch, 20).catch(e =>
          console.error("[OMDb] Background fetch error (final):", e)
        )
      }
    })
    .catch(e => console.error("[OMDb] Error checking final results for fetch:", e))

  // Background: periodically clean up old recommendation history (fire-and-forget)
  if (Math.random() < 0.05) {
    cleanupOldRecommendationHistory().catch(() => {})
  }

  totalTimer.done()

  return {
    recommendations: finalResults,
    genres: groupGenres.slice(0, 5),
    totalRatings: groupGenres.reduce((sum, g) => sum + g.ratingCount, 0),
    lovedMovies,
    dislikedMovies,
    collectiveInfluenceMap,
  }
}

// ============================================
// Main Recommendation Function (Group)
// ============================================

export async function getTonightsPick(request: TonightPickRequest): Promise<TonightPickResponse> {
  const tTotal = timer("getTonightsPick TOTAL")
  const { collectiveId, memberIds, mood, moods: rawMoods, audience, maxRuntime, contentRating, parentalFilters, page = 1, era, startYear, streamingProviders, excludeTmdbIds } = request
  // Normalize: support both single mood (backward compat) and multi-mood
  const moods = rawMoods || (mood ? [mood] : [])

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

  const tFetch = timer("Pipeline: _fetchAndScoreMovies")
  const result = await _fetchAndScoreMovies({
    memberIds: validMemberIds,
    moods,
    audience: audience || "anyone",
    maxRuntime,
    contentRating,
    parentalFilters,
    page,
    era,
    startYear,
    streamingProviders,
    collectiveId,
    excludeTmdbIds,
  })
  tFetch.done()

  // Generate LLM reasoning synchronously before returning
  const tReasoning = timer("Pipeline: generateRecommendationReasoning")
  const llmReasoning = await generateRecommendationReasoning({
    recommendations: result.recommendations,
    lovedMovies: result.lovedMovies,
    dislikedMovies: result.dislikedMovies,
    moods,
    soloMode: false,
    memberCount: validMemberIds.length,
    collectiveInfluence: result.collectiveInfluenceMap,
  })
  tReasoning.done()

  for (const rec of result.recommendations) {
    const llmData = llmReasoning.get(rec.tmdbId)
    if (llmData) {
      rec.reasoning = [llmData.summary]
      if (llmData.pairings) rec.pairings = llmData.pairings
      if (llmData.parentalSummary) rec.parentalSummary = llmData.parentalSummary
    }
  }

  tTotal.done()

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
  const tTotal = timer("getSoloTonightsPick TOTAL")
  const { userId, mood, moods: rawMoods, audience, maxRuntime, contentRating, parentalFilters, page = 1, era, startYear, streamingProviders, excludeTmdbIds } = request
  const moods = rawMoods || (mood ? [mood] : [])

  // Validate user exists
  const userResult = await sql`SELECT id FROM users WHERE id = ${userId}::uuid`
  if (userResult.length === 0) {
    throw new Error("User not found")
  }

  const tFetch = timer("Pipeline: _fetchAndScoreMovies")
  const result = await _fetchAndScoreMovies({
    memberIds: [userId],
    moods,
    audience: audience || "anyone",
    maxRuntime,
    contentRating,
    parentalFilters,
    page,
    soloMode: true,
    era,
    startYear,
    streamingProviders,
    collectiveId: null,
    excludeTmdbIds,
  })
  tFetch.done()

  // Generate LLM reasoning synchronously before returning
  const tReasoning = timer("Pipeline: generateRecommendationReasoning")
  const llmReasoning = await generateRecommendationReasoning({
    recommendations: result.recommendations,
    lovedMovies: result.lovedMovies,
    dislikedMovies: result.dislikedMovies,
    moods,
    soloMode: true,
    memberCount: 1,
    collectiveInfluence: result.collectiveInfluenceMap,
  })
  tReasoning.done()

  for (const rec of result.recommendations) {
    const llmData = llmReasoning.get(rec.tmdbId)
    if (llmData) {
      rec.reasoning = [llmData.summary]
      if (llmData.pairings) rec.pairings = llmData.pairings
      if (llmData.parentalSummary) rec.parentalSummary = llmData.parentalSummary
    }
  }

  tTotal.done()

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