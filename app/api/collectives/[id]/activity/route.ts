import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    // Fetch recent comments with user info and rating info
    const comments = await sql`
      SELECT 
        fc.id,
        fc.content,
        fc.created_at,
        fc.rating_id,
        fc.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        'comment' as activity_type,
        NULL as reaction_type,
        -- Get the rating owner info
        COALESCE(
          (SELECT u2.name FROM users u2 
           JOIN user_movie_ratings umr ON umr.user_id = u2.id 
           WHERE umr.id = fc.rating_id),
          (SELECT u2.name FROM users u2 
           JOIN user_tv_show_ratings utsr ON utsr.user_id = u2.id 
           WHERE utsr.id = fc.rating_id),
          (SELECT u2.name FROM users u2 
           JOIN user_episode_ratings uer ON uer.user_id = u2.id 
           WHERE uer.id = fc.rating_id)
        ) as rating_owner_name,
        -- Get media title
        COALESCE(
          (SELECT m.title FROM movies m 
           JOIN user_movie_ratings umr ON umr.movie_id = m.id 
           WHERE umr.id = fc.rating_id),
          (SELECT ts.name FROM tv_shows ts 
           JOIN user_tv_show_ratings utsr ON utsr.tv_show_id = ts.id 
           WHERE utsr.id = fc.rating_id),
          (SELECT te.name FROM tv_episodes te 
           JOIN user_episode_ratings uer ON uer.episode_id = te.id 
           WHERE uer.id = fc.rating_id)
        ) as media_title,
        -- Get tmdb_id for linking to movie conversation
        COALESCE(
          (SELECT m.tmdb_id FROM movies m 
           JOIN user_movie_ratings umr ON umr.movie_id = m.id 
           WHERE umr.id = fc.rating_id),
          (SELECT ts.id FROM tv_shows ts 
           JOIN user_tv_show_ratings utsr ON utsr.tv_show_id = ts.id 
           WHERE utsr.id = fc.rating_id),
          (SELECT te.tv_show_id FROM tv_episodes te 
           JOIN user_episode_ratings uer ON uer.episode_id = te.id 
           WHERE uer.id = fc.rating_id)
        )::int as tmdb_id,
        -- Get media type
        CASE 
          WHEN EXISTS (SELECT 1 FROM user_movie_ratings WHERE id = fc.rating_id) THEN 'movie'
          WHEN EXISTS (SELECT 1 FROM user_tv_show_ratings WHERE id = fc.rating_id) THEN 'tv'
          WHEN EXISTS (SELECT 1 FROM user_episode_ratings WHERE id = fc.rating_id) THEN 'episode'
        END as media_type
      FROM feed_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.collective_id = ${collectiveId}::uuid
      ORDER BY fc.created_at DESC
      LIMIT ${limit}
    `

    // Fetch recent reactions with user info and rating info
    const reactions = await sql`
      SELECT 
        fr.id,
        NULL as content,
        fr.created_at,
        fr.rating_id,
        fr.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        'reaction' as activity_type,
        fr.reaction_type,
        -- Get the rating owner info
        COALESCE(
          (SELECT u2.name FROM users u2 
           JOIN user_movie_ratings umr ON umr.user_id = u2.id 
           WHERE umr.id = fr.rating_id),
          (SELECT u2.name FROM users u2 
           JOIN user_tv_show_ratings utsr ON utsr.user_id = u2.id 
           WHERE utsr.id = fr.rating_id),
          (SELECT u2.name FROM users u2 
           JOIN user_episode_ratings uer ON uer.user_id = u2.id 
           WHERE uer.id = fr.rating_id)
        ) as rating_owner_name,
        -- Get media title
        COALESCE(
          (SELECT m.title FROM movies m 
           JOIN user_movie_ratings umr ON umr.movie_id = m.id 
           WHERE umr.id = fr.rating_id),
          (SELECT ts.name FROM tv_shows ts 
           JOIN user_tv_show_ratings utsr ON utsr.tv_show_id = ts.id 
           WHERE utsr.id = fr.rating_id),
          (SELECT te.name FROM tv_episodes te 
           JOIN user_episode_ratings uer ON uer.episode_id = te.id 
           WHERE uer.id = fr.rating_id)
        ) as media_title,
        -- Get tmdb_id for linking to movie conversation
        COALESCE(
          (SELECT m.tmdb_id FROM movies m 
           JOIN user_movie_ratings umr ON umr.movie_id = m.id 
           WHERE umr.id = fr.rating_id),
          (SELECT ts.id FROM tv_shows ts 
           JOIN user_tv_show_ratings utsr ON utsr.tv_show_id = ts.id 
           WHERE utsr.id = fr.rating_id),
          (SELECT te.tv_show_id FROM tv_episodes te 
           JOIN user_episode_ratings uer ON uer.episode_id = te.id 
           WHERE uer.id = fr.rating_id)
        )::int as tmdb_id,
        -- Get media type
        CASE 
          WHEN EXISTS (SELECT 1 FROM user_movie_ratings WHERE id = fr.rating_id) THEN 'movie'
          WHEN EXISTS (SELECT 1 FROM user_tv_show_ratings WHERE id = fr.rating_id) THEN 'tv'
          WHEN EXISTS (SELECT 1 FROM user_episode_ratings WHERE id = fr.rating_id) THEN 'episode'
        END as media_type
      FROM feed_reactions fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.collective_id = ${collectiveId}::uuid
      ORDER BY fr.created_at DESC
      LIMIT ${limit}
    `

    // Combine and sort by created_at
    const allActivity = [...comments, ...reactions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

    return NextResponse.json({ activity: allActivity })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
