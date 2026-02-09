import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"
export async function GET() {
  try {
    const { user } = await getSafeUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    const userProfile = await sql`
      SELECT id, name, email, avatar_url, created_at
      FROM users
      WHERE id = ${userId}::uuid
    `

    // Get user's collectives
    const collectives = await sql`
      SELECT 
        c.id,
        c.name,
        c.description,
        cm.role,
        (SELECT COUNT(*) FROM collective_memberships WHERE collective_id = c.id) as member_count
      FROM collectives c
      JOIN collective_memberships cm ON c.id = cm.collective_id
      WHERE cm.user_id = ${userId}::uuid
      ORDER BY c.created_at DESC
    `

    // Get user's stats
    const userStats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM user_movie_ratings WHERE user_id = ${userId}::uuid) as movies_rated,
        (SELECT COUNT(*) FROM user_tv_show_ratings WHERE user_id = ${userId}::uuid) as shows_rated,
        (SELECT COUNT(*) FROM collective_memberships WHERE user_id = ${userId}::uuid) as collective_count
    `

    const avgRating = await sql`
      SELECT COALESCE(AVG(overall_score), 0)::float as avg_score
      FROM user_movie_ratings
      WHERE user_id = ${userId}::uuid
    `

    const topGenres = await sql`
      SELECT 
        g.value->>'name' as genre,
        COUNT(*)::int as count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      CROSS JOIN LATERAL jsonb_array_elements(m.genres) as g(value)
      WHERE umr.user_id = ${userId}::uuid
      GROUP BY g.value->>'name'
      ORDER BY count DESC
      LIMIT 5
    `

    const favoriteDecade = await sql`
      SELECT 
        (EXTRACT(YEAR FROM m.release_date)::int / 10 * 10) as decade,
        COUNT(*)::int as count,
        AVG(umr.overall_score)::float as avg_score
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ${userId}::uuid
      AND m.release_date IS NOT NULL
      GROUP BY decade
      ORDER BY count DESC, avg_score DESC
      LIMIT 1
    `

    const highestRated = await sql`
      SELECT 
        m.tmdb_id,
        m.title,
        m.poster_path,
        umr.overall_score
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ${userId}::uuid
      ORDER BY umr.overall_score DESC
      LIMIT 1
    `

    const ratingActivity = await sql`
      SELECT 
        (SELECT COUNT(*) FROM user_movie_ratings WHERE user_id = ${userId}::uuid AND rated_at > NOW() - INTERVAL '30 days')::int as this_month,
        (SELECT COUNT(*) FROM user_movie_ratings WHERE user_id = ${userId}::uuid AND rated_at > NOW() - INTERVAL '60 days' AND rated_at <= NOW() - INTERVAL '30 days')::int as last_month
    `

    const favorites = await sql`
      SELECT tmdb_id, title, poster_path, position
      FROM user_favorite_movies
      WHERE user_id = ${userId}::uuid
      ORDER BY position ASC
    `.catch(() => [])

    // Get recent activity across all user's collectives (existing code)
    const recentActivity = await sql`
      WITH user_collectives AS (
        SELECT collective_id FROM collective_memberships WHERE user_id = ${userId}::uuid
      )
      SELECT * FROM (
        -- Movie ratings (use DISTINCT ON to avoid duplicates when rater is in multiple shared collectives)
        SELECT DISTINCT ON (umr.id)
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
          c.id as collective_id,
          c.name as collective_name,
          umr.id as rating_id,
          NULL as target_user_name
        FROM user_movie_ratings umr
        JOIN users u ON umr.user_id = u.id
        JOIN movies m ON umr.movie_id = m.id
        JOIN collective_memberships cm ON umr.user_id = cm.user_id
        JOIN collectives c ON cm.collective_id = c.id
        WHERE cm.collective_id IN (SELECT collective_id FROM user_collectives)
        AND umr.rated_at > NOW() - INTERVAL '60 days'
        AND umr.user_id != ${userId}::uuid
        
        UNION ALL
        
        -- TV show ratings (use DISTINCT ON to avoid duplicates when rater is in multiple shared collectives)
        SELECT DISTINCT ON (utsr.id)
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
          c.id as collective_id,
          c.name as collective_name,
          utsr.id as rating_id,
          NULL as target_user_name
        FROM user_tv_show_ratings utsr
        JOIN users u ON utsr.user_id = u.id
        JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        JOIN collective_memberships cm ON utsr.user_id = cm.user_id
        JOIN collectives c ON cm.collective_id = c.id
        WHERE cm.collective_id IN (SELECT collective_id FROM user_collectives)
        AND utsr.rated_at > NOW() - INTERVAL '60 days'
        AND utsr.user_id != ${userId}::uuid
        
        UNION ALL
        
        -- Comments on feed
        SELECT 
          'comment' as activity_type,
          fc.id as activity_id,
          fc.created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          COALESCE(m.tmdb_id, 0) as tmdb_id,
          COALESCE(m.title, ts.name, 'Unknown') as media_title,
          COALESCE(m.poster_path, ts.poster_path) as poster_path,
          CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
          NULL as score,
          fc.content,
          NULL as reaction_type,
          fc.collective_id,
          c.name as collective_name,
          fc.rating_id,
          COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
        FROM feed_comments fc
        JOIN users u ON fc.user_id = u.id
        JOIN collectives c ON fc.collective_id = c.id
        LEFT JOIN user_movie_ratings umr ON fc.rating_id = umr.id
        LEFT JOIN movies m ON umr.movie_id = m.id
        LEFT JOIN user_tv_show_ratings utsr ON fc.rating_id = utsr.id
        LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
        WHERE fc.collective_id IN (SELECT collective_id FROM user_collectives)
        AND fc.created_at > NOW() - INTERVAL '60 days'
        AND fc.user_id != ${userId}::uuid
        
        UNION ALL
        
        -- Reactions on feed
        SELECT 
          'reaction' as activity_type,
          fr.id as activity_id,
          fr.created_at,
          u.id as actor_id,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
          u.avatar_url as actor_avatar,
          COALESCE(m.tmdb_id, 0) as tmdb_id,
          COALESCE(m.title, ts.name, 'Unknown') as media_title,
          COALESCE(m.poster_path, ts.poster_path) as poster_path,
          CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
          NULL as score,
          NULL as content,
          fr.reaction_type,
          fr.collective_id,
          c.name as collective_name,
          fr.rating_id,
          COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
        FROM feed_reactions fr
        JOIN users u ON fr.user_id = u.id
        JOIN collectives c ON fr.collective_id = c.id
        LEFT JOIN user_movie_ratings umr ON fr.rating_id = umr.id
        LEFT JOIN movies m ON umr.movie_id = m.id
        LEFT JOIN user_tv_show_ratings utsr ON fr.rating_id = utsr.id
        LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
        LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
        WHERE fr.collective_id IN (SELECT collective_id FROM user_collectives)
        AND fr.created_at > NOW() - INTERVAL '60 days'
        AND fr.user_id != ${userId}::uuid
      ) combined
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      user: userProfile[0]
        ? {
            id: userProfile[0].id,
            name: userProfile[0].name || userProfile[0].email?.split("@")[0] || "User",
            email: userProfile[0].email,
            avatarUrl: userProfile[0].avatar_url,
            memberSince: userProfile[0].created_at,
          }
        : null,
      collectives,
      stats: userStats[0] || { movies_rated: 0, shows_rated: 0, collective_count: 0 },
      recentActivity,
      insights: {
        avgRating: avgRating[0]?.avg_score || 0,
        topGenres: topGenres.map((g) => ({ genre: g.genre, count: g.count })),
        favoriteDecade: favoriteDecade[0]?.decade || null,
        highestRated: highestRated[0] || null,
        ratingActivity: ratingActivity[0] || { this_month: 0, last_month: 0 },
      },
      favorites,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
