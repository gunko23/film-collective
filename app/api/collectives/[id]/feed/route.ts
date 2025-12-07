import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import {
  getCollectiveFeedWithInteractions,
  getCollectiveFeedCount,
  getUserReactionsForRatings,
} from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log("[v0] Feed API route called")

  try {
    const { id: collectiveId } = await params
    console.log("[v0] Collective ID:", collectiveId)

    let user
    try {
      user = await stackServerApp.getUser()
      console.log("[v0] User loaded:", user?.id)
    } catch (authError) {
      console.error("[v0] Auth error:", authError)
      user = null
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = page * limit

    console.log("[v0] Fetching feed - page:", page, "limit:", limit, "offset:", offset)

    const [feed, totalCount] = await Promise.all([
      getCollectiveFeedWithInteractions(collectiveId, limit, offset),
      getCollectiveFeedCount(collectiveId),
    ])

    console.log("[v0] Feed results:", feed.length, "items, total count:", totalCount)

    // Get user's reactions for these ratings (only if user is authenticated)
    let userReactions: any[] = []
    if (user) {
      const ratingIds = feed.map((item: any) => item.rating_id)
      userReactions = ratingIds.length > 0 ? await getUserReactionsForRatings(user.id, ratingIds) : []
    }

    return NextResponse.json({
      feed,
      userReactions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("[v0] Error fetching feed:", errorMessage, errorStack)
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage, stack: errorStack },
      { status: 500 },
    )
  }
}
