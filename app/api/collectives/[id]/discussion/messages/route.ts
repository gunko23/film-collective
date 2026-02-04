import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
import { sendPushNotificationToCollectiveMembers } from "@/lib/push/push-service"

const sql = neon(process.env.DATABASE_URL!)

// GET: Fetch messages with pagination
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: collectiveId } = await params
  const { searchParams } = new URL(request.url)
  const before = searchParams.get("before") // cursor for pagination
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify membership
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId}::uuid AND user_id = ${user.id}::uuid
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const messages = before
      ? await sql`
          SELECT 
            gdm.id,
            gdm.collective_id,
            gdm.user_id,
            gdm.content,
            gdm.gif_url,
            gdm.reply_to_id,
            gdm.is_edited,
            gdm.is_deleted,
            gdm.created_at,
            gdm.updated_at,
            COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
            u.avatar_url as user_avatar,
            COALESCE(
              (SELECT json_agg(json_build_object(
                'id', gdr.id,
                'user_id', gdr.user_id,
                'user_name', COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User'),
                'reaction_type', gdr.reaction_type
              ))
              FROM general_discussion_reactions gdr
              JOIN users ru ON ru.id = gdr.user_id
              WHERE gdr.message_id = gdm.id),
              '[]'
            ) as reactions,
            CASE WHEN gdm.reply_to_id IS NOT NULL THEN
              (SELECT json_build_object(
                'id', rm.id,
                'content', rm.content,
                'user_name', COALESCE(rmu.name, SPLIT_PART(rmu.email, '@', 1), 'User')
              )
              FROM general_discussion_messages rm
              JOIN users rmu ON rmu.id = rm.user_id
              WHERE rm.id = gdm.reply_to_id)
            ELSE NULL END as reply_to
          FROM general_discussion_messages gdm
          JOIN users u ON u.id = gdm.user_id
          WHERE gdm.collective_id = ${collectiveId}::uuid
            AND gdm.created_at < (
              SELECT created_at FROM general_discussion_messages WHERE id = ${before}::uuid
            )
          ORDER BY gdm.created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT 
            gdm.id,
            gdm.collective_id,
            gdm.user_id,
            gdm.content,
            gdm.gif_url,
            gdm.reply_to_id,
            gdm.is_edited,
            gdm.is_deleted,
            gdm.created_at,
            gdm.updated_at,
            COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
            u.avatar_url as user_avatar,
            COALESCE(
              (SELECT json_agg(json_build_object(
                'id', gdr.id,
                'user_id', gdr.user_id,
                'user_name', COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User'),
                'reaction_type', gdr.reaction_type
              ))
              FROM general_discussion_reactions gdr
              JOIN users ru ON ru.id = gdr.user_id
              WHERE gdr.message_id = gdm.id),
              '[]'
            ) as reactions,
            CASE WHEN gdm.reply_to_id IS NOT NULL THEN
              (SELECT json_build_object(
                'id', rm.id,
                'content', rm.content,
                'user_name', COALESCE(rmu.name, SPLIT_PART(rmu.email, '@', 1), 'User')
              )
              FROM general_discussion_messages rm
              JOIN users rmu ON rmu.id = rm.user_id
              WHERE rm.id = gdm.reply_to_id)
            ELSE NULL END as reply_to
          FROM general_discussion_messages gdm
          JOIN users u ON u.id = gdm.user_id
          WHERE gdm.collective_id = ${collectiveId}::uuid
          ORDER BY gdm.created_at DESC
          LIMIT ${limit}
        `

    // Update read receipt
    if (messages.length > 0) {
      const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)
      const latestMessage = messages[0]

      await sql`
        INSERT INTO general_discussion_read_receipts (collective_id, user_id, last_read_message_id, last_read_at)
        VALUES (${collectiveId}::uuid, ${dbUser.id}::uuid, ${latestMessage.id}::uuid, NOW())
        ON CONFLICT (collective_id, user_id)
        DO UPDATE SET last_read_message_id = ${latestMessage.id}::uuid, last_read_at = NOW()
      `.catch(() => {})
    }

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error("Error fetching discussion messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST: Send a new message
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: collectiveId } = await params

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
    const { content, gifUrl, replyToId } = body

    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Message content or GIF required" }, { status: 400 })
    }

    // Insert message
    const result = await sql`
      INSERT INTO general_discussion_messages (collective_id, user_id, content, gif_url, reply_to_id)
      VALUES (${collectiveId}::uuid, ${dbUser.id}::uuid, ${content?.trim() || ""}, ${gifUrl || null}, ${replyToId || null})
      RETURNING id, collective_id, user_id, content, gif_url, reply_to_id, is_edited, is_deleted, created_at, updated_at
    `

    const message = result[0]

    // Get reply info if exists
    let replyTo = null
    if (message.reply_to_id) {
      const replyResult = await sql`
        SELECT gdm.id, gdm.content, COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name
        FROM general_discussion_messages gdm
        JOIN users u ON u.id = gdm.user_id
        WHERE gdm.id = ${message.reply_to_id}::uuid
      `
      if (replyResult.length > 0) {
        replyTo = replyResult[0]
      }
    }

    const fullMessage = {
      ...message,
      user_name: user.displayName || dbUser.name || "Anonymous",
      user_avatar: user.profileImageUrl || dbUser.avatar_url,
      reactions: [],
      reply_to: replyTo,
    }

    await publishToChannel(getDiscussionChannelName(collectiveId), "new_message", fullMessage)

    const collectiveInfo = await sql`
      SELECT name FROM collectives WHERE id = ${collectiveId}::uuid
    `
    const collectiveName = collectiveInfo[0]?.name || "Collective"
    const senderName = user.displayName || dbUser.name || "Someone"
    const messagePreview = gifUrl ? "sent a GIF" : content?.substring(0, 50) + (content?.length > 50 ? "..." : "")

    // Fire and forget - don't block the response
    sendPushNotificationToCollectiveMembers(collectiveId, dbUser.id, {
      title: `${collectiveName} Discussion`,
      body: `${senderName}: ${messagePreview}`,
      url: `/collectives/${collectiveId}?section=discussion`,
      tag: `discussion-${collectiveId}`,
    }).catch((err) => console.error("Push notification error:", err))

    return NextResponse.json({ message: fullMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
