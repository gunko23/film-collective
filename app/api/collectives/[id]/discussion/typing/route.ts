import { NextResponse } from "next/server"
import { ensureUserExists } from "@/lib/db/user-service"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { setTypingUser, removeTypingUser } from "@/lib/redis/client"

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

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
