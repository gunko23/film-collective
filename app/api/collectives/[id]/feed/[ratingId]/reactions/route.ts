import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    // Only fetch reactions for this specific collective
    const reactions = await sql`
      SELECT id, user_id, reaction_type, created_at
      FROM feed_reactions
      WHERE rating_id = ${ratingId} AND collective_id = ${collectiveId}
    `

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
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const { reactionType, mediaType } = await request.json()

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 })
    }

    // Check if reaction already exists for this user in this collective
    const existing = await sql`
      SELECT id FROM feed_reactions
      WHERE rating_id = ${ratingId} 
        AND collective_id = ${collectiveId}
        AND user_id = ${dbUser.id} 
        AND reaction_type = ${reactionType}
    `

    if (existing.length > 0) {
      // Remove the reaction (no notification needed for removal)
      await sql`
        DELETE FROM feed_reactions
        WHERE rating_id = ${ratingId} 
          AND collective_id = ${collectiveId}
          AND user_id = ${dbUser.id} 
          AND reaction_type = ${reactionType}
      `
      return NextResponse.json({ action: "removed" })
    } else {
      // Add the reaction
      const result = await sql`
        INSERT INTO feed_reactions (id, rating_id, collective_id, user_id, reaction_type, created_at)
        VALUES (gen_random_uuid(), ${ratingId}, ${collectiveId}, ${dbUser.id}, ${reactionType}, NOW())
        RETURNING id
      `

      if (mediaType) {
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

      return NextResponse.json({ action: "added", id: result[0]?.id })
    }
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
