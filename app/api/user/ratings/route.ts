import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getUserRatingsWithMedia } from "@/lib/ratings/rating-service"

export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ratings = await getUserRatingsWithMedia(user.id)

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
