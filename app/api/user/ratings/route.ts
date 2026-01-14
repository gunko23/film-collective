import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all ratings with movie info
    const ratings = await sql`
      SELECT 
        r.id,
        r.overall_score,
        r.user_comment,
        r.rated_at,
        r.updated_at,
        m.tmdb_id,
        m.title,
        m.poster_path,
        m.release_date,
        m.genres
      FROM user_movie_ratings r
      INNER JOIN movies m ON r.movie_id = m.id
      WHERE r.user_id = ${user.id}
      ORDER BY r.rated_at DESC
    `

    const transformedRatings = ratings.map((row: any) => ({
      id: row.id,
      overallScore: Number(row.overall_score),
      userComment: row.user_comment,
      ratedAt: row.rated_at,
      updatedAt: row.updated_at,
      movie: {
        tmdbId: row.tmdb_id,
        title: row.title,
        posterPath: row.poster_path,
        releaseDate: row.release_date,
        genres: row.genres || [],
      },
    }))

    return NextResponse.json({ ratings: transformedRatings })
  } catch (error) {
    console.error("Failed to get user ratings:", error)
    return NextResponse.json({ error: "Failed to get ratings" }, { status: 500 })
  }
}
