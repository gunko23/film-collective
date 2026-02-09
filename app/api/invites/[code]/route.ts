import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { getInviteByCode, joinCollectiveViaInvite } from "@/lib/collectives/collective-service"

// GET /api/invites/[code] - Get invite details
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const invite = await getInviteByCode(code)

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 410 })
    }

    // Check if max uses reached
    if (invite.max_uses && invite.use_count >= invite.max_uses) {
      return NextResponse.json({ error: "This invite has reached its maximum uses" }, { status: 410 })
    }

    return NextResponse.json({
      collectiveId: invite.collective_id,
      collectiveName: invite.collective_name,
      collectiveDescription: invite.collective_description,
    })
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 })
  }
}

// POST /api/invites/[code] - Join collective via invite
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()
    const { code } = await params

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const invite = await joinCollectiveViaInvite(code, user.id)
    return NextResponse.json({
      success: true,
      collectiveId: invite.collective_id,
    })
  } catch (error) {
    console.error("Error joining collective:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join collective" },
      { status: 500 },
    )
  }
}
