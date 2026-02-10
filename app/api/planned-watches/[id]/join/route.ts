import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"
import { joinPlannedWatch } from "@/lib/planned-watches/planned-watch-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Auth temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      )
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: plannedWatchId } = await params

    // Get the planned watch to verify it exists and get its collectiveId
    const watchRows = await sql`
      SELECT id, collective_id FROM planned_watches
      WHERE id = ${plannedWatchId} AND status IN ('planned', 'watching')
    `

    if (watchRows.length === 0) {
      return NextResponse.json(
        { error: "Planned watch not found" },
        { status: 404 },
      )
    }

    const collectiveId = watchRows[0].collective_id

    // If it's a collective watch, verify user is a member
    if (collectiveId) {
      const membership = await sql`
        SELECT id FROM collective_memberships
        WHERE collective_id = ${collectiveId}::uuid AND user_id = ${user.id}::uuid
      `
      if (membership.length === 0) {
        return NextResponse.json(
          { error: "You are not a member of this collective" },
          { status: 403 },
        )
      }
    }

    await joinPlannedWatch(plannedWatchId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error joining planned watch:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join planned watch" },
      { status: 500 },
    )
  }
}
