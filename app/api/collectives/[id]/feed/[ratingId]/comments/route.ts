import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"
import { getSafeUser } from "@/lib/auth/auth-utils"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    // Fetch comments with their reactions
    const comments = await sql`
      SELECT 
        fc.id,
        fc.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        fc.content,
        fc.gif_url,
        fc.created_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', cr.id,
            'user_id', cr.user_id,
            'user_name', ru.name,
            'reaction_type', cr.reaction_type
          ))
          FROM comment_reactions cr
          JOIN users ru ON ru.id = cr.user_id
          WHERE cr.comment_id = fc.id),
          '[]'
        ) as reactions
      FROM feed_comments fc
      JOIN users u ON u.id = fc.user_id
      WHERE fc.rating_id = ${ratingId} AND fc.collective_id = ${collectiveId}
      ORDER BY fc.created_at ASC
    `

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ comments: [] })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params
    console.log("[v0] POST comments - collectiveId:", collectiveId, "ratingId:", ratingId)

    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      console.log("[v0] User rate limited")
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }

    if (!user) {
      console.log("[v0] User not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)
    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)
    console.log("[v0] DB user:", dbUser.id)

    // Verify user is a member of the collective
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `

    if (membership.length === 0) {
      console.log("[v0] User not a member of collective")
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const { content, gifUrl, mediaType } = await request.json()
    console.log("[v0] Comment data:", { content, gifUrl, mediaType })

    if ((!content || content.trim().length === 0) && !gifUrl) {
      console.log("[v0] Empty comment")
      return NextResponse.json({ error: "Comment content or GIF is required" }, { status: 400 })
    }

    // Insert comment
    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, collective_id, user_id, content, gif_url, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}, ${collectiveId}, ${dbUser.id}, ${content?.trim() || ""}, ${gifUrl || null}, NOW(), NOW())
      RETURNING id, user_id, content, gif_url, created_at
    `
    console.log("[v0] Comment inserted:", result[0])

    const comment = {
      ...result[0],
      user_name: user.displayName || "Anonymous",
      user_avatar: user.profileImageUrl || null,
      reactions: [],
    }

    // Add user to thread participants
    await sql`
      INSERT INTO thread_participants (rating_id, collective_id, user_id, joined_at, last_read_at)
      VALUES (${ratingId}, ${collectiveId}, ${dbUser.id}, NOW(), NOW())
      ON CONFLICT (rating_id, collective_id, user_id)
      DO UPDATE SET last_read_at = NOW()
    `

    // Clear typing indicator
    await sql`
      DELETE FROM typing_indicators
      WHERE rating_id = ${ratingId} AND collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `.catch(() => {}) // Ignore if table doesn't exist yet

    // Notify rating owner
    if (mediaType) {
      const ratingOwnerId = await getRatingOwner(ratingId, mediaType)
      const mediaInfo = await getRatingMediaInfo(ratingId, mediaType)

      if (ratingOwnerId && mediaInfo) {
        // Notify rating owner if not the commenter
        if (ratingOwnerId !== dbUser.id) {
          await createNotification({
            userId: ratingOwnerId,
            actorId: dbUser.id,
            type: "comment",
            ratingId,
            collectiveId,
            content: content?.trim().substring(0, 100) || (gifUrl ? "sent a GIF" : ""),
            mediaType,
            mediaTitle: mediaInfo.title,
            mediaPoster: mediaInfo.poster || undefined,
          })
        }

        // Notify other thread participants
        const otherParticipants = await sql`
          SELECT DISTINCT user_id FROM thread_participants
          WHERE rating_id = ${ratingId} 
            AND collective_id = ${collectiveId}
            AND user_id != ${dbUser.id}
            AND user_id != ${ratingOwnerId || "00000000-0000-0000-0000-000000000000"}
        `.catch(() => []) // Ignore if table doesn't exist yet

        for (const participant of otherParticipants) {
          await createNotification({
            userId: participant.user_id,
            actorId: dbUser.id,
            type: "thread_reply",
            ratingId,
            collectiveId,
            content: content?.trim().substring(0, 100) || (gifUrl ? "sent a GIF" : ""),
            mediaType,
            mediaTitle: mediaInfo.title,
            mediaPoster: mediaInfo.poster || undefined,
          })
        }
      }
    }

    console.log("[v0] Returning comment:", comment)
    return NextResponse.json({ comment })
  } catch (error) {
    console.error("[v0] Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
