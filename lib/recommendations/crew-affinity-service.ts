/**
 * Crew Affinity Service
 *
 * Pre-computes and caches director/actor affinities per user.
 * Replaces the per-request TMDB credit fetching with single DB queries.
 *
 * Also caches movie credits (director_ids, top_actor_ids) on the movies table
 * so candidate credit enrichment is a single DB query instead of TMDB API calls.
 */

import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "@/lib/tmdb/client"

const sql = neon(process.env.DATABASE_URL!)

// ============================================
// Types
// ============================================

export type DirectorAffinity = {
  personId: number
  name: string
  avgScore: number
  movieCount: number
}

export type ActorAffinity = {
  personId: number
  name: string
  avgScore: number
  movieCount: number
}

// ============================================
// Fix 1: Cached Crew Affinities
// ============================================

/**
 * Get cached crew affinities for one or more users.
 * Returns combined director + actor affinities across all provided user IDs.
 */
export async function getCachedCrewAffinities(userIds: string[]): Promise<{
  directors: DirectorAffinity[]
  actors: ActorAffinity[]
}> {
  if (userIds.length === 0) return { directors: [], actors: [] }

  try {
    const rows = await sql`
      SELECT
        person_id,
        person_name,
        role,
        AVG(avg_score) AS avg_score,
        SUM(movie_count)::int AS movie_count
      FROM user_crew_affinities
      WHERE user_id = ANY(${userIds}::uuid[])
      GROUP BY person_id, person_name, role
      HAVING SUM(movie_count) >= 2
      ORDER BY AVG(avg_score) DESC
    `

    const directors: DirectorAffinity[] = []
    const actors: ActorAffinity[] = []

    for (const row of rows) {
      const entry = {
        personId: Number(row.person_id),
        name: row.person_name,
        avgScore: Number(row.avg_score),
        movieCount: Number(row.movie_count),
      }
      if (row.role === "director") {
        directors.push(entry)
      } else if (row.role === "actor") {
        actors.push(entry)
      }
    }

    return { directors, actors }
  } catch (error) {
    console.error("[CrewAffinity] Error fetching cached affinities:", error)
    return { directors: [], actors: [] }
  }
}

/**
 * Rebuild crew affinities for a single user.
 * Called after a user submits a new rating (fire-and-forget).
 *
 * 1. Query user's top 30 rated movies (score >= 70)
 * 2. For each movie, check if movies.director_ids / top_actor_ids are populated
 *    - If not, fetch from TMDB and cache on the movies row
 * 3. Aggregate: group by person_id, count movies, compute avg score
 * 4. Filter to people appearing in 2+ highly-rated movies
 * 5. Upsert into user_crew_affinities (DELETE + INSERT for the user)
 */
export async function rebuildUserCrewAffinities(userId: string): Promise<void> {
  try {
    // Step 1: Get user's top 30 rated movies with score >= 70
    const topRated = await sql`
      SELECT
        m.tmdb_id,
        m.id AS movie_uuid,
        umr.overall_score,
        m.director_ids,
        m.top_actor_ids,
        m.credits_fetched_at
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ${userId}::uuid
        AND umr.overall_score >= 70
      ORDER BY umr.overall_score DESC
      LIMIT 30
    `

    if (topRated.length === 0) {
      // No highly-rated movies — clear any stale affinities
      await sql`DELETE FROM user_crew_affinities WHERE user_id = ${userId}::uuid`
      return
    }

    // Step 2: Ensure credits are cached for all movies
    const moviesMissingCredits = topRated.filter(
      (m: any) => !m.credits_fetched_at
    )

    if (moviesMissingCredits.length > 0) {
      const tmdb = createTMDBClient()
      if (tmdb) {
        // Fetch in parallel batches of 10
        for (let i = 0; i < moviesMissingCredits.length; i += 10) {
          const batch = moviesMissingCredits.slice(i, i + 10)
          const results = await Promise.all(
            batch.map((m: any) =>
              tmdb.getMovieCredits(m.tmdb_id).catch(() => null)
            )
          )

          for (let j = 0; j < batch.length; j++) {
            const credits = results[j]
            if (!credits) continue

            const directorIds = credits.crew
              .filter((c: any) => c.job === "Director")
              .map((c: any) => c.id)

            const topActorIds = credits.cast
              .sort((a: any, b: any) => a.order - b.order)
              .slice(0, 3)
              .map((a: any) => a.id)

            const directorNames: Record<number, string> = {}
            for (const c of credits.crew) {
              if (c.job === "Director") directorNames[c.id] = c.name
            }
            const actorNames: Record<number, string> = {}
            for (const a of credits.cast.slice(0, 3)) {
              actorNames[a.id] = a.name
            }

            // Cache on movies row
            await sql`
              UPDATE movies
              SET director_ids = ${JSON.stringify(directorIds)}::jsonb,
                  top_actor_ids = ${JSON.stringify(topActorIds)}::jsonb,
                  director_names = ${JSON.stringify(directorNames)}::jsonb,
                  actor_names = ${JSON.stringify(actorNames)}::jsonb,
                  credits_fetched_at = NOW()
              WHERE tmdb_id = ${batch[j].tmdb_id}
            `

            // Update the in-memory record for aggregation below
            batch[j].director_ids = directorIds
            batch[j].top_actor_ids = topActorIds
            batch[j]._directorNames = directorNames
            batch[j]._actorNames = actorNames
          }
        }
      }
    }

    // Re-query to get fresh data after any TMDB fetches
    const moviesWithCredits = await sql`
      SELECT
        m.tmdb_id,
        umr.overall_score,
        m.director_ids,
        m.top_actor_ids,
        m.director_names,
        m.actor_names
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ${userId}::uuid
        AND umr.overall_score >= 70
        AND m.credits_fetched_at IS NOT NULL
      ORDER BY umr.overall_score DESC
      LIMIT 30
    `

    // Step 3: Aggregate by person
    const directorMap = new Map<number, { name: string; totalScore: number; count: number }>()
    const actorMap = new Map<number, { name: string; totalScore: number; count: number }>()

    for (const movie of moviesWithCredits) {
      const score = Number(movie.overall_score)
      const directorIds = (movie.director_ids as number[]) || []
      const topActorIds = (movie.top_actor_ids as number[]) || []
      const directorNames = (movie.director_names as Record<string, string>) || {}
      const actorNames = (movie.actor_names as Record<string, string>) || {}

      for (const dirId of directorIds) {
        const existing = directorMap.get(dirId)
        if (existing) {
          existing.totalScore += score
          existing.count++
        } else {
          directorMap.set(dirId, {
            name: directorNames[String(dirId)] || `Person ${dirId}`,
            totalScore: score,
            count: 1,
          })
        }
      }

      for (const actId of topActorIds) {
        const existing = actorMap.get(actId)
        if (existing) {
          existing.totalScore += score
          existing.count++
        } else {
          actorMap.set(actId, {
            name: actorNames[String(actId)] || `Person ${actId}`,
            totalScore: score,
            count: 1,
          })
        }
      }
    }

    // Step 4: Filter to 2+ movies
    const directorAffinities = Array.from(directorMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([personId, v]) => ({
        personId,
        name: v.name,
        avgScore: v.totalScore / v.count,
        movieCount: v.count,
        role: "director" as const,
      }))

    const actorAffinities = Array.from(actorMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([personId, v]) => ({
        personId,
        name: v.name,
        avgScore: v.totalScore / v.count,
        movieCount: v.count,
        role: "actor" as const,
      }))

    const allAffinities = [...directorAffinities, ...actorAffinities]

    // Step 5: DELETE + INSERT for user
    await sql`DELETE FROM user_crew_affinities WHERE user_id = ${userId}::uuid`

    if (allAffinities.length > 0) {
      // Build batch insert values
      const values = allAffinities.map(a => [
        userId,
        a.personId,
        a.name,
        a.role,
        Math.round(a.avgScore * 100) / 100,
        a.movieCount,
      ])

      // Insert in chunks to avoid overly long query strings
      for (let i = 0; i < values.length; i += 50) {
        const chunk = values.slice(i, i + 50)
        for (const row of chunk) {
          await sql`
            INSERT INTO user_crew_affinities (user_id, person_id, person_name, role, avg_score, movie_count, updated_at)
            VALUES (${row[0]}::uuid, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, NOW())
          `
        }
      }
    }

    console.log(`[CrewAffinity] Rebuilt affinities for user ${userId}: ${directorAffinities.length} directors, ${actorAffinities.length} actors`)
  } catch (error) {
    console.error(`[CrewAffinity] Error rebuilding affinities for user ${userId}:`, error)
  }
}

// ============================================
// Fix 2: Cached Candidate Credits
// ============================================

/**
 * Get cached credits for a batch of TMDB IDs.
 * Returns map of tmdbId -> { directorIds, topActorIds }.
 * For movies missing cached credits, fetches from TMDB and caches them.
 */
export async function getCachedCandidateCredits(
  tmdbIds: number[]
): Promise<Map<number, { directorIds: Set<number>; topActorIds: Set<number> }>> {
  const result = new Map<number, { directorIds: Set<number>; topActorIds: Set<number> }>()
  if (tmdbIds.length === 0) return result

  try {
    // Query movies table for cached credits
    const cached = await sql`
      SELECT
        tmdb_id,
        director_ids,
        top_actor_ids,
        credits_fetched_at
      FROM movies
      WHERE tmdb_id = ANY(${tmdbIds}::int[])
    `

    const missingTmdbIds: number[] = []

    for (const row of cached) {
      if (row.credits_fetched_at && row.director_ids && row.top_actor_ids) {
        // Cached — parse JSONB arrays
        const directorIds = new Set<number>((row.director_ids as number[]) || [])
        const topActorIds = new Set<number>((row.top_actor_ids as number[]) || [])
        result.set(Number(row.tmdb_id), { directorIds, topActorIds })
      } else {
        missingTmdbIds.push(Number(row.tmdb_id))
      }
    }

    // For movies not in our DB at all, add them to missing
    const dbTmdbIds = new Set(cached.map((r: any) => Number(r.tmdb_id)))
    for (const id of tmdbIds) {
      if (!dbTmdbIds.has(id) && !missingTmdbIds.includes(id)) {
        missingTmdbIds.push(id)
      }
    }

    // Fetch missing credits from TMDB in parallel batches of 10
    if (missingTmdbIds.length > 0) {
      const tmdb = createTMDBClient()
      if (tmdb) {
        for (let i = 0; i < missingTmdbIds.length; i += 10) {
          const batch = missingTmdbIds.slice(i, i + 10)
          const creditResults = await Promise.all(
            batch.map(id => tmdb.getMovieCredits(id).catch(() => null))
          )

          for (let j = 0; j < batch.length; j++) {
            const credits = creditResults[j]
            if (!credits) continue

            const directorIds = new Set<number>()
            const directorIdsArr: number[] = []
            for (const crew of credits.crew) {
              if (crew.job === "Director") {
                directorIds.add(crew.id)
                directorIdsArr.push(crew.id)
              }
            }

            const topActorIds = new Set<number>()
            const topActorIdsArr: number[] = []
            const topCast = credits.cast
              .sort((a: any, b: any) => a.order - b.order)
              .slice(0, 3)
            for (const actor of topCast) {
              topActorIds.add(actor.id)
              topActorIdsArr.push(actor.id)
            }

            result.set(batch[j], { directorIds, topActorIds })

            // Build name maps for caching
            const directorNames: Record<number, string> = {}
            for (const c of credits.crew) {
              if (c.job === "Director") directorNames[c.id] = c.name
            }
            const actorNames: Record<number, string> = {}
            for (const a of topCast) {
              actorNames[a.id] = a.name
            }

            // Fire-and-forget: cache back to movies table
            sql`
              UPDATE movies
              SET director_ids = ${JSON.stringify(directorIdsArr)}::jsonb,
                  top_actor_ids = ${JSON.stringify(topActorIdsArr)}::jsonb,
                  director_names = ${JSON.stringify(directorNames)}::jsonb,
                  actor_names = ${JSON.stringify(actorNames)}::jsonb,
                  credits_fetched_at = NOW()
              WHERE tmdb_id = ${batch[j]}
            `.catch((e: any) => console.error(`[CrewAffinity] Error caching credits for ${batch[j]}:`, e))
          }
        }
      }
    }

    return result
  } catch (error) {
    console.error("[CrewAffinity] Error getting cached candidate credits:", error)
    return result
  }
}
