import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { markNotificationsRead } from "@/lib/notifications/notification-service"

export async function POST(request: Request) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { notificationIds, markAll } = await request.json()

    await markNotificationsRead(dbUser.id, notificationIds, markAll)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
  }
}
