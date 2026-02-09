import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
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

    // Verify membership
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId}::uuid AND user_id = ${dbUser.id}::uuid
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const body = await request.json()
    const { reactionType } = body

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type required" }, { status: 400 })
    }

    // Check if reaction exists
    const existing = await sql`
      SELECT id FROM general_discussion_reactions
      WHERE message_id = ${messageId}::uuid
        AND user_id = ${dbUser.id}::uuid
        AND reaction_type = ${reactionType}
    `

    let action: string

    if (existing.length > 0) {
      // Remove reaction
      await sql`
        DELETE FROM general_discussion_reactions
        WHERE id = ${existing[0].id}::uuid
      `
      action = "removed"
    } else {
      // Add reaction
      await sql`
        INSERT INTO general_discussion_reactions (message_id, user_id, reaction_type)
        VALUES (${messageId}::uuid, ${dbUser.id}::uuid, ${reactionType})
      `
      action = "added"
    }

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
