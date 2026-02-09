import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"
import {
  getFeedReactions,
  toggleFeedReaction,
  verifyMembership,
} from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    const reactions = await getFeedReactions(ratingId, collectiveId)

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error("Error fetching reactions:", error)
    return NextResponse.json({ reactions: [] })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    // Verify user is a member of the collective
    const isMember = await verifyMembership(collectiveId, dbUser.id)

    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const { reactionType, mediaType } = await request.json()

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 })
    }

    const result = await toggleFeedReaction({
      ratingId,
      collectiveId,
      userId: dbUser.id,
      reactionType,
    })

    if (result.action === "added" && mediaType) {
      const ratingOwnerId = await getRatingOwner(ratingId, mediaType)
      const mediaInfo = await getRatingMediaInfo(ratingId, mediaType)

      if (ratingOwnerId && mediaInfo) {
        await createNotification({
          userId: ratingOwnerId,
          actorId: dbUser.id,
          type: "reaction",
          ratingId,
          collectiveId,
          content: reactionType,
          mediaType,
          mediaTitle: mediaInfo.title,
          mediaPoster: mediaInfo.poster || undefined,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
