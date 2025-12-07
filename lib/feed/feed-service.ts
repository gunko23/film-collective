import { sql } from "@/lib/db"

export async function getCollectiveFeedWithInteractions(collectiveId: string, limit = 10, offset = 0) {
  console.log("[v0] getCollectiveFeedWithInteractions called with:", { collectiveId, limit, offset })

  try {
    const members = await sql`
      SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
    `
    console.log("[v0] Collective members found:", members.length)

    if (members.length === 0) {
      return []
    }

    const result = await sql`
      SELECT 
        umr.id as rating_id,
        umr.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        umr.overall_score,
        umr.user_comment,
        umr.rated_at,
        m.tmdb_id::text as tmdb_id,
        m.title,
        m.poster_path,
        m.release_date,
        0 as comment_count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      JOIN users u ON umr.user_id = u.id
      WHERE umr.user_id IN (
        SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
      )
      ORDER BY umr.rated_at DESC
      LIMIT 10
    `

    console.log("[v0] Feed results:", result.length)
    return result
  } catch (error) {
    console.error("[v0] Error in getCollectiveFeedWithInteractions:", error)
    throw error
  }
}

export async function getFeedItemComments(ratingId: string) {
  const result = await sql`
    SELECT 
      fc.id,
      fc.content,
      fc.created_at,
      fc.user_id,
      u.name as user_name,
      u.avatar_url as user_avatar
    FROM feed_comments fc
    JOIN users u ON fc.user_id = u.id
    WHERE fc.rating_id = ${ratingId}::uuid
    ORDER BY fc.created_at ASC
  `
  return result
}

export async function addComment(ratingId: string, userId: string, content: string) {
  const result = await sql`
    INSERT INTO feed_comments (rating_id, user_id, content)
    VALUES (${ratingId}::uuid, ${userId}::uuid, ${content})
    RETURNING id, content, created_at
  `
  return result[0]
}

export async function deleteComment(commentId: string, userId: string) {
  await sql`
    DELETE FROM feed_comments
    WHERE id = ${commentId}::uuid AND user_id = ${userId}::uuid
  `
}

export async function toggleReaction(ratingId: string, userId: string, reactionType: string) {
  const existing = await sql`
    SELECT id FROM feed_reactions
    WHERE rating_id = ${ratingId}::uuid 
    AND user_id = ${userId}::uuid 
    AND reaction_type = ${reactionType}
  `

  if (existing.length > 0) {
    await sql`
      DELETE FROM feed_reactions
      WHERE rating_id = ${ratingId}::uuid 
      AND user_id = ${userId}::uuid 
      AND reaction_type = ${reactionType}
    `
    return { added: false }
  } else {
    await sql`
      INSERT INTO feed_reactions (rating_id, user_id, reaction_type)
      VALUES (${ratingId}::uuid, ${userId}::uuid, ${reactionType})
    `
    return { added: true }
  }
}

export async function getUserReactionsForRatings(userId: string, ratingIds: string[]) {
  if (ratingIds.length === 0) return []

  const result = await sql`
    SELECT rating_id::text, reaction_type
    FROM feed_reactions
    WHERE user_id = ${userId}::uuid
    AND rating_id = ANY(${ratingIds}::uuid[])
  `
  return result
}

export async function getCollectiveFeedCount(collectiveId: string) {
  const result = await sql`
    SELECT COUNT(*)::int as count
    FROM user_movie_ratings umr
    WHERE umr.user_id IN (
      SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
    )
  `
  return result[0]?.count || 0
}
