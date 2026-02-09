import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    // Fetch collective name
    const nameResult = await sql`
      SELECT name FROM collectives WHERE id = ${collectiveId}::uuid
    `
    const collectiveName = nameResult[0]?.name || "Collective"

    const activity = await sql`
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
    `

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
