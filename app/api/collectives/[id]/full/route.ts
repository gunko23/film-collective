import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import {
  getCollectiveById,
  getCollectiveMembers,
  getCollectiveRatings,
  getCollectiveMovieStats,
} from "@/lib/collectives/collective-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    // Fetch all data in parallel from the database (no external API calls)
    const [collective, members, movieStats, recentRatings] = await Promise.all([
      getCollectiveById(id, user.id),
      getCollectiveMembers(id),
      getCollectiveMovieStats(id),
      getCollectiveRatings(id),
    ])

    if (!collective) {
      return NextResponse.json({ error: "Collective not found" }, { status: 404 })
    }

    return NextResponse.json({
      collective,
      members,
      movieStats,
      recentRatings: recentRatings.slice(0, 10),
    })
  } catch (error) {
    console.error("Error fetching collective data:", error)
    return NextResponse.json({ error: "Failed to fetch collective data" }, { status: 500 })
  }
}
