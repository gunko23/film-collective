import { NextResponse } from "next/server"
import { getCollective } from "@/lib/collectives/collective-service"
import { getCollectiveActivityFeed, getCollectiveActivityCount } from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = page * limit

    const collective = await getCollective(collectiveId)
    const collectiveName = collective?.name || "Collective"

    const [activities, totalCount] = await Promise.all([
      getCollectiveActivityFeed(collectiveId, collectiveName, limit, offset),
      getCollectiveActivityCount(collectiveId),
    ])

    return NextResponse.json({
      activities,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
