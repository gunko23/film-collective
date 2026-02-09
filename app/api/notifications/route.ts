import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { getUserNotifications } from "@/lib/notifications/notification-service"

export async function GET(request: Request) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unread") === "true"

    const { notifications, unreadCount, totalCount } = await getUserNotifications(dbUser.id, { limit, offset, unreadOnly })

    return NextResponse.json({
      notifications,
      unreadCount,
      total: totalCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
