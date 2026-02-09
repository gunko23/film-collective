/**
 * Collective Influence Service
 *
 * Provides "friend influence" scoring signal for recommendations.
 * Finds movies loved by friends in shared collectives that the requesting
 * user(s) haven't rated yet.
 */

import { sql } from "@/lib/db"

export type CollectiveInfluenceEntry = {
  avgScore: number
  raterCount: number
  raterNames: string[]
}

/**
 * Solo mode: finds movies loved by friends across ALL collectives the user belongs to.
 * Excludes movies the user has already rated.
 */
export async function getSoloCollectiveInfluence(
  userId: string
): Promise<Map<number, CollectiveInfluenceEntry>> {
  try {
    const rows = await sql`
      SELECT m.tmdb_id, u.name as rater_name, umr.overall_score as score
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      JOIN users u ON umr.user_id = u.id
      JOIN collective_memberships cm ON cm.user_id = umr.user_id
      JOIN collective_memberships my_cm
        ON my_cm.collective_id = cm.collective_id
        AND my_cm.user_id = ${userId}
      WHERE umr.user_id != ${userId}
        AND umr.overall_score >= 70
        AND m.tmdb_id NOT IN (
          SELECT m2.tmdb_id FROM user_movie_ratings umr2
          JOIN movies m2 ON umr2.movie_id = m2.id
          WHERE umr2.user_id = ${userId}
        )
      ORDER BY umr.overall_score DESC
    `

    return groupInfluenceRows(rows)
  } catch (error) {
    console.error("[CollectiveInfluence] Error fetching solo influence:", error)
    return new Map()
  }
}

/**
 * Group mode: finds movies loved by NON-SELECTED members of a SPECIFIC collective.
 * Excludes movies any selected member has already rated.
 */
export async function getGroupCollectiveInfluence(
  collectiveId: string,
  selectedMemberIds: string[]
): Promise<Map<number, CollectiveInfluenceEntry>> {
  try {
    const rows = await sql`
      SELECT m.tmdb_id, u.name as rater_name, umr.overall_score as score
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      JOIN users u ON umr.user_id = u.id
      JOIN collective_memberships cm
        ON cm.user_id = umr.user_id
        AND cm.collective_id = ${collectiveId}::uuid
      WHERE umr.user_id != ALL(${selectedMemberIds}::uuid[])
        AND umr.overall_score >= 70
        AND m.tmdb_id NOT IN (
          SELECT m2.tmdb_id FROM user_movie_ratings umr2
          JOIN movies m2 ON umr2.movie_id = m2.id
          WHERE umr2.user_id = ANY(${selectedMemberIds}::uuid[])
        )
      ORDER BY umr.overall_score DESC
    `

    return groupInfluenceRows(rows)
  } catch (error) {
    console.error("[CollectiveInfluence] Error fetching group influence:", error)
    return new Map()
  }
}

/**
 * Post-process: group rows by tmdb_id, deduplicate raters by name,
 * compute avgScore and raterCount.
 */
function groupInfluenceRows(
  rows: any[]
): Map<number, CollectiveInfluenceEntry> {
  const grouped = new Map<number, { scores: number[]; names: Set<string> }>()

  for (const row of rows) {
    const tmdbId = Number(row.tmdb_id)
    const name = row.rater_name || "Unknown"
    const score = Number(row.score)

    if (!grouped.has(tmdbId)) {
      grouped.set(tmdbId, { scores: [], names: new Set() })
    }

    const entry = grouped.get(tmdbId)!
    // A person may appear multiple times if in multiple shared collectives — deduplicate
    if (!entry.names.has(name)) {
      entry.names.add(name)
      entry.scores.push(score)
    }
  }

  const result = new Map<number, CollectiveInfluenceEntry>()
  for (const [tmdbId, data] of grouped) {
    const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
    result.set(tmdbId, {
      avgScore,
      raterCount: data.names.size,
      raterNames: Array.from(data.names),
    })
  }

  return result
}
