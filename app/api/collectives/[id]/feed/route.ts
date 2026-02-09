import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import {
  getCollectiveActivityFeed,
  getCollectiveActivityCount,
  getCollectiveName,
} from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params

    const { user } = await getSafeUser()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = page * limit

    // Fetch collective name for the activity feed
    const collectiveName = await getCollectiveName(collectiveId)

    const [activities, totalCount] = await Promise.all([
      getCollectiveActivityFeed(collectiveId, collectiveName, limit, offset, user?.id),
      getCollectiveActivityCount(collectiveId),
    ])

    return NextResponse.json({
      activities,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error fetching feed:", errorMessage)
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}
