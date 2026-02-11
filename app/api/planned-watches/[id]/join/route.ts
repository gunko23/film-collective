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

    // Verify the planned watch exists
    const watchRows = await sql`
      SELECT id FROM planned_watches
      WHERE id = ${plannedWatchId} AND status IN ('planned', 'watching')
    `

    if (watchRows.length === 0) {
      return NextResponse.json(
        { error: "Planned watch not found" },
        { status: 404 },
      )
    }

    // If it's a collective watch, verify user is a member of at least one linked collective
    const linkedCollectives = await sql`
      SELECT pwc.collective_id FROM planned_watch_collectives pwc
      WHERE pwc.planned_watch_id = ${plannedWatchId}
    `

    if (linkedCollectives.length > 0) {
      const collectiveIdList = linkedCollectives.map((r: any) => r.collective_id)
      const membership = await sql`
        SELECT id FROM collective_memberships
        WHERE collective_id = ANY(${collectiveIdList}) AND user_id = ${user.id}::uuid
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
