import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import {
  getCollectiveAnalytics,
  getCollectiveGenreStats,
  getCollectiveDecadeStats,
  getMemberSimilarityData,
  getRatingDistribution,
  getControversialMovies,
  getUnanimousFavorites,
} from "@/lib/collectives/collective-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    const [
      analytics,
      genreStats,
      decadeStats,
      similarityData,
      ratingDistribution,
      controversialMovies,
      unanimousFavorites,
    ] = await Promise.all([
      getCollectiveAnalytics(id),
      getCollectiveGenreStats(id),
      getCollectiveDecadeStats(id),
      getMemberSimilarityData(id),
      getRatingDistribution(id),
      getControversialMovies(id),
      getUnanimousFavorites(id),
    ])

    return NextResponse.json({
      analytics,
      genreStats,
      decadeStats,
      similarityData,
      ratingDistribution,
      controversialMovies,
      unanimousFavorites,
    })
  } catch (error) {
    console.error("Error fetching collective analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
