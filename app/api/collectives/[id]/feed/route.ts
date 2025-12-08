import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import {
  getCollectiveFeedWithInteractions,
  getCollectiveFeedCount,
  getUserReactionsForRatings,
} from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params

    let user
    try {
      user = await stackServerApp.getUser()
    } catch (authError) {
      console.error("[v0] Auth error:", authError)
      user = null
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = page * limit

    const [feed, totalCount] = await Promise.all([
      getCollectiveFeedWithInteractions(collectiveId, limit, offset),
      getCollectiveFeedCount(collectiveId),
    ])

    // Get user's reactions for these ratings (only if user is authenticated)
    let userReactions: any[] = []
    if (user) {
      const ratingIds = feed.map((item: any) => item.rating_id)
      userReactions = ratingIds.length > 0 ? await getUserReactionsForRatings(user.id, ratingIds) : []
    }

    return NextResponse.json({
      feedItems: feed,
      total: totalCount,
      userReactions,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error fetching feed:", errorMessage)
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}
