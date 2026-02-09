import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"

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

    // Get notifications
    const notifications = unreadOnly
      ? await sql`
          SELECT 
            n.*,
            u.name as actor_name,
            u.avatar_url as actor_avatar,
            c.name as collective_name
          FROM notifications n
          JOIN users u ON u.id = n.actor_id
          JOIN collectives c ON c.id = n.collective_id
          WHERE n.user_id = ${dbUser.id} AND n.is_read = FALSE
          ORDER BY n.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT 
            n.*,
            u.name as actor_name,
            u.avatar_url as actor_avatar,
            c.name as collective_name
          FROM notifications n
          JOIN users u ON u.id = n.actor_id
          JOIN collectives c ON c.id = n.collective_id
          WHERE n.user_id = ${dbUser.id}
          ORDER BY n.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `

    // Get unread count
    const unreadCountResult = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${dbUser.id} AND is_read = FALSE
    `

    // Get total count
    const totalCountResult = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${dbUser.id}
    `

    return NextResponse.json({
      notifications,
      unreadCount: Number.parseInt(unreadCountResult[0]?.count || "0"),
      total: Number.parseInt(totalCountResult[0]?.count || "0"),
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
