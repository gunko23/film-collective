import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    // Get user info
    const users = await sql`
      SELECT id, name, email, avatar_url, created_at
      FROM users
      WHERE id = ${userId}::uuid
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Get favorite movies
    const favorites = await sql`
      SELECT tmdb_id, title, poster_path, release_date, position
      FROM user_favorite_movies
      WHERE user_id = ${userId}::uuid
      ORDER BY position ASC
    `

    // Get rating stats
    const movieStats = await sql`
      SELECT 
        COUNT(*)::int as count,
        COALESCE(AVG(overall_score), 0)::float as avg_score
      FROM user_movie_ratings
      WHERE user_id = ${userId}::uuid
    `

    const tvStats = await sql`
      SELECT 
        COUNT(*)::int as count,
        COALESCE(AVG(overall_score), 0)::float as avg_score
      FROM user_tv_show_ratings
      WHERE user_id = ${userId}::uuid
    `

    // Get top genres from rated movies
    const topGenres = await sql`
      SELECT 
        g.value->>'name' as genre,
        COUNT(*) as count
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      CROSS JOIN LATERAL jsonb_array_elements(m.genres) as g(value)
      WHERE umr.user_id = ${userId}::uuid
      GROUP BY g.value->>'name'
      ORDER BY count DESC
      LIMIT 3
    `

    // Get recent ratings
    const recentRatings = await sql`
      SELECT 
        umr.overall_score,
        umr.rated_at,
        m.tmdb_id,
        m.title,
        m.poster_path,
        'movie' as media_type
      FROM user_movie_ratings umr
      JOIN movies m ON umr.movie_id = m.id
      WHERE umr.user_id = ${userId}::uuid
      ORDER BY umr.rated_at DESC
      LIMIT 6
    `

    // Get shared collectives (if viewing another user)
    const collectiveCount = await sql`
      SELECT COUNT(DISTINCT collective_id)::int as count
      FROM collective_memberships
      WHERE user_id = ${userId}::uuid
    `

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || user.email?.split("@")[0] || "Film Enthusiast",
        avatarUrl: user.avatar_url,
        memberSince: user.created_at,
      },
      favorites,
      stats: {
        moviesRated: movieStats[0]?.count || 0,
        avgMovieScore: movieStats[0]?.avg_score || 0,
        showsRated: tvStats[0]?.count || 0,
        avgShowScore: tvStats[0]?.avg_score || 0,
        collectiveCount: collectiveCount[0]?.count || 0,
      },
      topGenres: topGenres.map((g) => g.genre),
      recentRatings,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
