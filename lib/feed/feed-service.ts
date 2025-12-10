import { sql } from "@/lib/db"

export async function getCollectiveFeedWithInteractions(collectiveId: string, limit = 10, offset = 0) {
  try {
    const members = await sql`
      SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
    `

    if (members.length === 0) {
      return []
    }

    const result = await sql`
      (
        SELECT 
          umr.id as rating_id,
          umr.user_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
          u.avatar_url as user_avatar,
          umr.overall_score,
          umr.user_comment,
          umr.rated_at,
          m.tmdb_id::text as tmdb_id,
          m.title,
          m.poster_path,
          m.release_date,
          'movie' as media_type,
          NULL::int as episode_number,
          NULL::int as season_number,
          NULL as show_name,
          NULL::int as show_id,
          0 as comment_count
        FROM user_movie_ratings umr
        JOIN movies m ON umr.movie_id = m.id
        JOIN users u ON umr.user_id = u.id
        WHERE umr.user_id IN (
          SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
        )
      )
      UNION ALL
      (
        SELECT 
          utr.id as rating_id,
          utr.user_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
          u.avatar_url as user_avatar,
          utr.overall_score,
          NULL as user_comment,
          utr.rated_at,
          ts.id::text as tmdb_id,
          ts.name as title,
          ts.poster_path,
          ts.first_air_date as release_date,
          'tv' as media_type,
          NULL::int as episode_number,
          NULL::int as season_number,
          NULL as show_name,
          NULL::int as show_id,
          0 as comment_count
        FROM user_tv_show_ratings utr
        JOIN tv_shows ts ON utr.tv_show_id = ts.id
        JOIN users u ON utr.user_id = u.id
        WHERE utr.user_id IN (
          SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
        )
      )
      UNION ALL
      (
        SELECT 
          uer.id as rating_id,
          uer.user_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
          u.avatar_url as user_avatar,
          uer.overall_score,
          NULL as user_comment,
          uer.rated_at,
          te.id::text as tmdb_id,
          te.name as title,
          te.still_path as poster_path,
          te.air_date as release_date,
          'episode' as media_type,
          te.episode_number,
          te.season_number,
          ts.name as show_name,
          ts.id::int as show_id,
          0 as comment_count
        FROM user_episode_ratings uer
        JOIN tv_episodes te ON uer.episode_id = te.id
        JOIN tv_shows ts ON te.tv_show_id = ts.id
        JOIN users u ON uer.user_id = u.id
        WHERE uer.user_id IN (
          SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid
        )
      )
      ORDER BY rated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

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
      COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
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
    SELECT (
      (SELECT COUNT(*)::int FROM user_movie_ratings umr 
       WHERE umr.user_id IN (SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid))
      +
      (SELECT COUNT(*)::int FROM user_tv_show_ratings utr 
       WHERE utr.user_id IN (SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid))
      +
      (SELECT COUNT(*)::int FROM user_episode_ratings uer 
       WHERE uer.user_id IN (SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid))
    ) as count
  `
  return result[0]?.count || 0
}
