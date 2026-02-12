import { NextResponse } from "next/server"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { publishToChannel } from "@/lib/ably/server"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
import { sendPushNotificationToCollectiveMembers } from "@/lib/push/push-service"
import { notifyCollectiveMembers } from "@/lib/notifications/notification-service"
import {
  verifyCollectiveMembership,
  getDiscussionMessages,
  updateReadReceipt,
  createDiscussionMessage,
  getCollectiveName,
} from "@/lib/chat/chat-service"

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

    const isMember = await verifyCollectiveMembership(collectiveId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const messages = await getDiscussionMessages(collectiveId, {
      before: before || undefined,
      limit,
    })

    // Update read receipt
    if (messages.length > 0) {
      const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)
      const latestMessage = messages[0]
      await updateReadReceipt(collectiveId, dbUser.id, latestMessage.id)
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

    const isMember = await verifyCollectiveMembership(collectiveId, dbUser.id)
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const body = await request.json()
    const { content, gifUrl, replyToId } = body

    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Message content or GIF required" }, { status: 400 })
    }

    const { message, replyTo } = await createDiscussionMessage(collectiveId, dbUser.id, {
      content,
      gifUrl,
      replyToId,
    })

    const fullMessage = {
      ...message,
      user_name: user.displayName || dbUser.name || "Anonymous",
      user_avatar: user.profileImageUrl || dbUser.avatar_url,
      reactions: [],
      reply_to: replyTo,
    }

    await publishToChannel(getDiscussionChannelName(collectiveId), "new_message", fullMessage)

    const collectiveName = await getCollectiveName(collectiveId)
    const senderName = user.displayName || dbUser.name || "Someone"
    const messagePreview = gifUrl ? "sent a GIF" : content?.substring(0, 50) + (content?.length > 50 ? "..." : "")

    // Fire and forget - don't block the response
    sendPushNotificationToCollectiveMembers(collectiveId, dbUser.id, {
      title: `${collectiveName} Discussion`,
      body: `${senderName}: ${messagePreview}`,
      url: `/collectives/${collectiveId}?section=discussion`,
      tag: `discussion-${collectiveId}`,
    }).catch((err) => console.error("Push notification error:", err))

    // Create in-app notifications for collective members
    notifyCollectiveMembers(collectiveId, dbUser.id, {
      type: "discussion",
      content: gifUrl ? "sent a GIF" : content?.substring(0, 80),
    }).catch((err) => console.error("In-app notification error:", err))

    return NextResponse.json({ message: fullMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
