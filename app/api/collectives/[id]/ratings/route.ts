import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getCollectiveRatings, getCollectiveMovieStats } from "@/lib/collectives/collective-service"

// GET /api/collectives/[id]/ratings - Get all ratings from collective members
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()
    const { id } = await params

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const aggregated = searchParams.get("aggregated") === "true"

    if (aggregated) {
      const stats = await getCollectiveMovieStats(id)
      return NextResponse.json(stats)
    }

    const ratings = await getCollectiveRatings(id)
    return NextResponse.json(ratings)
  } catch (error) {
    console.error("Error fetching collective ratings:", error)
    return NextResponse.json({ error: "Failed to fetch collective ratings" }, { status: 500 })
  }
}
