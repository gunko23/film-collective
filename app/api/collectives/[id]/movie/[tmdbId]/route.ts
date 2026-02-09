import { getSafeUser } from "@/lib/auth/auth-utils"
import { type NextRequest, NextResponse } from "next/server"
import { getCollectiveMovieRatings } from "@/lib/collectives/collective-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; tmdbId: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId, tmdbId } = await params
    const rawRatings = await getCollectiveMovieRatings(collectiveId, tmdbId)

    // Map database fields to expected format and convert score from 0-100 to 0-5 scale
    const ratings = rawRatings.map((r: any) => ({
      user_id: r.user_id,
      user_name: r.user_name,
      user_avatar: r.user_avatar,
      score: r.overall_score ? Math.round(r.overall_score / 20) : null,
      user_comment: r.user_comment,
      rated_at: r.rated_at,
    }))

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error("Error fetching collective movie ratings:", error)
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
  }
}
