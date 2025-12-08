import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { createNotification, getRatingOwner, getRatingMediaInfo } from "@/lib/notifications/notification-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    // Only fetch comments for this specific collective
    const comments = await sql`
      SELECT 
        fc.id,
        fc.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        fc.content,
        fc.gif_url,
        fc.created_at
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
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const { content, gifUrl, mediaType } = await request.json()

    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Comment content or GIF is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, collective_id, user_id, content, gif_url, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}, ${collectiveId}, ${dbUser.id}, ${content?.trim() || ""}, ${gifUrl || null}, NOW(), NOW())
      RETURNING id, user_id, content, gif_url, created_at
    `

    const comment = {
      ...result[0],
      user_name: user.displayName || "Anonymous",
      user_avatar: user.profileImageUrl || null,
    }

    if (mediaType) {
      const ratingOwnerId = await getRatingOwner(ratingId, mediaType)
      const mediaInfo = await getRatingMediaInfo(ratingId, mediaType)

      if (ratingOwnerId && mediaInfo) {
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
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
