import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"

// Get current typing users
export async function GET(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params

    // Clean up old typing indicators and get current ones
    await sql`DELETE FROM typing_indicators WHERE updated_at < NOW() - INTERVAL '5 seconds'`

    const typingUsers = await sql`
      SELECT user_id, user_name, updated_at
      FROM typing_indicators
      WHERE rating_id = ${ratingId} AND collective_id = ${collectiveId}
      ORDER BY updated_at DESC
    `

    return NextResponse.json({ typingUsers })
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return NextResponse.json({ typingUsers: [] })
  }
}

// Set typing indicator
export async function POST(request: Request, { params }: { params: Promise<{ id: string; ratingId: string }> }) {
  try {
    const { id: collectiveId, ratingId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { isTyping } = await request.json()

    if (isTyping) {
      await sql`
        INSERT INTO typing_indicators (rating_id, collective_id, user_id, user_name, updated_at)
        VALUES (${ratingId}, ${collectiveId}, ${dbUser.id}, ${user.displayName || "Someone"}, NOW())
        ON CONFLICT (rating_id, collective_id, user_id)
        DO UPDATE SET updated_at = NOW(), user_name = ${user.displayName || "Someone"}
      `
    } else {
      await sql`
        DELETE FROM typing_indicators
        WHERE rating_id = ${ratingId} AND collective_id = ${collectiveId} AND user_id = ${dbUser.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing indicator:", error)
    return NextResponse.json({ error: "Failed to update typing indicator" }, { status: 500 })
  }
}
