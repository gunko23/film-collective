import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { setTypingUser, removeTypingUser } from "@/lib/redis/client"

const sql = neon(process.env.DATABASE_URL!)

// POST: Update typing indicator
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
    const userName = user.displayName || dbUser.name || "Someone"

    await setTypingUser(collectiveId, dbUser.id, userName)

    // Also update database for persistence (optional, can be removed)
    await sql`
      INSERT INTO general_discussion_typing (collective_id, user_id, user_name, updated_at)
      VALUES (${collectiveId}::uuid, ${dbUser.id}::uuid, ${userName}, NOW())
      ON CONFLICT (collective_id, user_id)
      DO UPDATE SET updated_at = NOW(), user_name = ${userName}
    `.catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing:", error)
    return NextResponse.json({ error: "Failed to update typing" }, { status: 500 })
  }
}

// DELETE: Clear typing indicator
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: collectiveId } = await params

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited || !user) {
      return NextResponse.json({ success: true })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    await removeTypingUser(collectiveId, dbUser.id)

    await sql`
      DELETE FROM general_discussion_typing
      WHERE collective_id = ${collectiveId}::uuid AND user_id = ${dbUser.id}::uuid
    `.catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
