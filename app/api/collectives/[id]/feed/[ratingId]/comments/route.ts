import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"
import { getSafeUser } from "@/lib/auth/auth-utils"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    const comments = await sql`
      SELECT 
        fc.id,
        fc.user_id,
        COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
        u.avatar_url as user_avatar,
        fc.content,
        fc.gif_url,
        fc.created_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', cr.id,
            'user_id', cr.user_id,
            'user_name', COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User'),
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
    console.log("[v0] User:", user?.id, "isRateLimited:", isRateLimited)

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Calling ensureUserExists")
    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)
    console.log("[v0] dbUser:", dbUser?.id)

    // Verify user is a member of the collective
    console.log("[v0] Checking membership")
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `
    console.log("[v0] Membership count:", membership.length)

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const body = await request.json()
    const { content, gifUrl, mediaType } = body
    console.log("[v0] Request body - content:", content?.substring(0, 20), "gifUrl:", !!gifUrl, "mediaType:", mediaType)

    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Comment content or GIF is required" }, { status: 400 })
    }

    // Insert comment
    console.log("[v0] Inserting comment")
    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, collective_id, user_id, content, gif_url, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}, ${collectiveId}, ${dbUser.id}, ${content?.trim() || ""}, ${gifUrl || null}, NOW(), NOW())
      RETURNING id, user_id, content, gif_url, created_at
    `
    console.log("[v0] Comment inserted:", result[0]?.id)

    const comment = {
      ...result[0],
      user_name: user.displayName || dbUser.name || "Anonymous",
      user_avatar: user.profileImageUrl || null,
      reactions: [],
    }

    try {
      await sql`
        INSERT INTO thread_participants (rating_id, collective_id, user_id, joined_at, last_read_at)
        VALUES (${ratingId}, ${collectiveId}, ${dbUser.id}, NOW(), NOW())
        ON CONFLICT (rating_id, collective_id, user_id)
        DO UPDATE SET last_read_at = NOW()
      `
    } catch (e) {
      console.error("Error adding thread participant:", e)
    }

    try {
      await sql`
        DELETE FROM typing_indicators
        WHERE rating_id = ${ratingId} AND collective_id = ${collectiveId} AND user_id = ${dbUser.id}
      `
    } catch (e) {
      // Ignore
    }

    try {
      if (mediaType) {
        const ratingOwnerId = await getRatingOwner(ratingId, mediaType)
        const mediaInfo = await getRatingMediaInfo(ratingId, mediaType)

        if (ratingOwnerId && mediaInfo) {
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

          const otherParticipants = await sql`
            SELECT DISTINCT user_id FROM thread_participants
            WHERE rating_id = ${ratingId} 
              AND collective_id = ${collectiveId}
              AND user_id != ${dbUser.id}
              AND user_id != ${ratingOwnerId || "00000000-0000-0000-0000-000000000000"}
          `.catch(() => [])

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
    } catch (e) {
      console.error("Error sending notifications:", e)
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
