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

// Returns all activity (ratings, comments, reactions) for a collective in the Activity shape
export async function getCollectiveActivityFeed(collectiveId: string, collectiveName: string, limit = 10, offset = 0) {
  try {
    const result = await sql`
      SELECT * FROM (
        -- Movie ratings
        SELECT
          'rating' as activity_type,
          umr.id as activity_id,
          umr.rated_at as created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          m.tmdb_id,
          m.title as media_title,
          m.poster_path,
          'movie' as media_type,
          umr.overall_score as score,
          NULL as content,
          NULL as reaction_type,
          ${collectiveId}::uuid as collective_id,
          ${collectiveName} as collective_name,
          umr.id as rating_id,
          NULL as target_user_name
        FROM user_movie_ratings umr
        JOIN users u ON umr.user_id = u.id
        JOIN movies m ON umr.movie_id = m.id
        JOIN collective_memberships cm ON umr.user_id = cm.user_id AND cm.collective_id = ${collectiveId}::uuid

        UNION ALL

        -- TV show ratings
        SELECT
          'rating' as activity_type,
          utsr.id as activity_id,
          utsr.rated_at as created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          ts.id as tmdb_id,
          ts.name as media_title,
          ts.poster_path,
          'tv' as media_type,
          utsr.overall_score as score,
          NULL as content,
          NULL as reaction_type,
          ${collectiveId}::uuid as collective_id,
          ${collectiveName} as collective_name,
          utsr.id as rating_id,
          NULL as target_user_name
        FROM user_tv_show_ratings utsr
        JOIN users u ON utsr.user_id = u.id
        JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        JOIN collective_memberships cm ON utsr.user_id = cm.user_id AND cm.collective_id = ${collectiveId}::uuid

        UNION ALL

        -- Comments on ratings
        SELECT
          'comment' as activity_type,
          fc.id as activity_id,
          fc.created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          COALESCE(m.tmdb_id, ts.id, 0)::int as tmdb_id,
          COALESCE(m.title, ts.name, 'Unknown') as media_title,
          COALESCE(m.poster_path, ts.poster_path) as poster_path,
          CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
          NULL as score,
          fc.content,
          NULL as reaction_type,
          fc.collective_id,
          ${collectiveName} as collective_name,
          fc.rating_id,
          COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
        FROM feed_comments fc
        JOIN users u ON fc.user_id = u.id
        LEFT JOIN user_movie_ratings umr ON fc.rating_id = umr.id
        LEFT JOIN movies m ON umr.movie_id = m.id
        LEFT JOIN user_tv_show_ratings utsr ON fc.rating_id = utsr.id
        LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
        WHERE fc.collective_id = ${collectiveId}::uuid

        UNION ALL

        -- Reactions on ratings
        SELECT
          'reaction' as activity_type,
          fr.id as activity_id,
          fr.created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          COALESCE(m.tmdb_id, ts.id, 0)::int as tmdb_id,
          COALESCE(m.title, ts.name, 'Unknown') as media_title,
          COALESCE(m.poster_path, ts.poster_path) as poster_path,
          CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
          NULL as score,
          NULL as content,
          fr.reaction_type,
          fr.collective_id,
          ${collectiveName} as collective_name,
          fr.rating_id,
          COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
        FROM feed_reactions fr
        JOIN users u ON fr.user_id = u.id
        LEFT JOIN user_movie_ratings umr ON fr.rating_id = umr.id
        LEFT JOIN movies m ON umr.movie_id = m.id
        LEFT JOIN user_tv_show_ratings utsr ON fr.rating_id = utsr.id
        LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
        WHERE fr.collective_id = ${collectiveId}::uuid

        UNION ALL

        -- Movie discussion comments
        SELECT
          'discussion' as activity_type,
          mc.id as activity_id,
          mc.created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          mc.tmdb_id,
          COALESCE(m.title, ts.name, 'Unknown') as media_title,
          COALESCE(m.poster_path, ts.poster_path) as poster_path,
          mc.media_type,
          NULL as score,
          mc.content,
          NULL as reaction_type,
          mc.collective_id,
          ${collectiveName} as collective_name,
          NULL as rating_id,
          NULL as target_user_name
        FROM movie_comments mc
        JOIN users u ON mc.user_id = u.id
        LEFT JOIN movies m ON mc.tmdb_id = m.tmdb_id AND mc.media_type = 'movie'
        LEFT JOIN tv_shows ts ON mc.tmdb_id = ts.id AND mc.media_type = 'tv'
        WHERE mc.collective_id = ${collectiveId}::uuid
      ) combined
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    return result
  } catch (error) {
    console.error("[v0] Error in getCollectiveActivityFeed:", error)
    throw error
  }
}

export async function getCollectiveActivityCount(collectiveId: string) {
  const result = await sql`
    SELECT (
      (SELECT COUNT(*)::int FROM user_movie_ratings umr
       WHERE umr.user_id IN (SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid))
      +
      (SELECT COUNT(*)::int FROM user_tv_show_ratings utr
       WHERE utr.user_id IN (SELECT user_id FROM collective_memberships WHERE collective_id = ${collectiveId}::uuid))
      +
      (SELECT COUNT(*)::int FROM feed_comments WHERE collective_id = ${collectiveId}::uuid)
      +
      (SELECT COUNT(*)::int FROM feed_reactions WHERE collective_id = ${collectiveId}::uuid)
      +
      (SELECT COUNT(*)::int FROM movie_comments WHERE collective_id = ${collectiveId}::uuid)
    ) as count
  `
  return result[0]?.count || 0
}
