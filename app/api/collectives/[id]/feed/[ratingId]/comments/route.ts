import { NextResponse } from "next/server"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getFeedChannelName } from "@/lib/ably/channel-names"
import {
  getFeedCommentsWithReactions,
  createFeedComment,
  addThreadParticipant,
  getThreadParticipants,
  verifyMembership,
} from "@/lib/feed/feed-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    const comments = await getFeedCommentsWithReactions(ratingId, collectiveId)

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
    const isMember = await verifyMembership(collectiveId, dbUser.id)

    if (!isMember) {
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
    const newComment = await createFeedComment({
      ratingId,
      collectiveId,
      userId: dbUser.id,
      content,
      gifUrl,
    })

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
    addThreadParticipant(ratingId, collectiveId, dbUser.id)

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

            const excludeIds = [dbUser.id]
            if (ratingOwnerId) excludeIds.push(ratingOwnerId)
            const otherParticipants = await getThreadParticipants(ratingId, collectiveId, excludeIds)

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
