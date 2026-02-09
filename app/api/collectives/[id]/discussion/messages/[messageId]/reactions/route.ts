import { NextResponse } from "next/server"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
import { verifyCollectiveMembership, toggleMessageReaction } from "@/lib/chat/chat-service"

// POST: Toggle reaction on a message
export async function POST(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const { id: collectiveId, messageId } = await params

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const isMember = await verifyCollectiveMembership(collectiveId, dbUser.id)
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const body = await request.json()
    const { reactionType } = body

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type required" }, { status: 400 })
    }

    const { action } = await toggleMessageReaction(messageId, dbUser.id, reactionType)

    await publishToChannel(getDiscussionChannelName(collectiveId), "reaction", {
      messageId,
      userId: dbUser.id,
      userName: user.displayName || dbUser.name || "User",
      reactionType,
      action,
    })

    return NextResponse.json({ action })
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
