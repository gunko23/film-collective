import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { createInvite, getCollectiveForUser } from "@/lib/collectives/collective-service"

// POST /api/collectives/[id]/invites - Create a new invite
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()
    const { id } = await params

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify user is a member
    const collective = await getCollectiveForUser(id, user.id)

    if (!collective || !collective.user_role) {
      return NextResponse.json({ error: "You must be a member to create invites" }, { status: 403 })
    }

    const body = await request.json()
    const { expiresInDays, maxUses } = body

    const invite = await createInvite(id, user.id, expiresInDays, maxUses)
    return NextResponse.json(invite)
  } catch (error) {
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
  }
}
