import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { ensureUserExists } from "@/lib/db/user-service"
import {
  getFeedTypingChannel,
  setTypingUserForChannel,
  removeTypingUserForChannel,
  getTypingUsersForChannel,
} from "@/lib/redis/client"

// Get current typing users
export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { ratingId } = await params
    const channel = getFeedTypingChannel(ratingId)
    const typingUsers = await getTypingUsersForChannel(channel)

    return NextResponse.json({ typingUsers })
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return NextResponse.json({ typingUsers: [] })
  }
}

// Set typing indicator
export async function POST(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { ratingId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { isTyping } = await request.json()
    const channel = getFeedTypingChannel(ratingId)

    if (isTyping) {
      await setTypingUserForChannel(channel, dbUser.id, user.displayName || "Someone")
    } else {
      await removeTypingUserForChannel(channel, dbUser.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing indicator:", error)
    return NextResponse.json({ error: "Failed to update typing indicator" }, { status: 500 })
  }
}
