import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getFeedChannelName } from "@/lib/ably/channel-names"

const sql = neon(process.env.DATABASE_URL!)

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
      WHERE fc.rating_id = ${ratingId}::uuid AND fc.collective_id = ${collectiveId}::uuid
      ORDER BY fc.created_at ASC
    `

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ comments: [] })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  const { id: collectiveId, ratingId } = await params

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited, please try again" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in database
    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    // Verify user is a member of the collective
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId}::uuid AND user_id = ${dbUser.id}::uuid
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { content, gifUrl, mediaType } = body

    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Comment content or GIF is required" }, { status: 400 })
    }

    // Insert comment
    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, collective_id, user_id, content, gif_url, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}::uuid, ${collectiveId}::uuid, ${dbUser.id}::uuid, ${content?.trim() || ""}, ${gifUrl || null}, NOW(), NOW())
      RETURNING id, user_id, content, gif_url, created_at
    `

    const newComment = result[0]

    // Build comment response
    const comment = {
      id: newComment.id,
      user_id: newComment.user_id,
      user_name: user.displayName || dbUser.name || "Anonymous",
      user_avatar: user.profileImageUrl || dbUser.avatar_url || null,
      content: newComment.content,
      gif_url: newComment.gif_url,
      created_at: newComment.created_at,
      reactions: [],
    }

    // Add to thread participants (non-blocking)
    sql`
      INSERT INTO thread_participants (id, rating_id, collective_id, user_id, joined_at, last_read_at)
      VALUES (gen_random_uuid(), ${ratingId}::uuid, ${collectiveId}::uuid, ${dbUser.id}::uuid, NOW(), NOW())
      ON CONFLICT (rating_id, collective_id, user_id)
      DO UPDATE SET last_read_at = NOW()
    `.catch(() => {})

    // Publish new comment via Ably (non-blocking)
    publishToChannel(getFeedChannelName(collectiveId, ratingId), "new_comment", comment).catch(() => {})

    // Send notifications (non-blocking)
    if (mediaType) {
      Promise.resolve().then(async () => {
        try {
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
              WHERE rating_id = ${ratingId}::uuid 
                AND collective_id = ${collectiveId}::uuid
                AND user_id != ${dbUser.id}::uuid
                AND user_id != ${ratingOwnerId || "00000000-0000-0000-0000-000000000000"}::uuid
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
        } catch {
          // Ignore notification errors
        }
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
