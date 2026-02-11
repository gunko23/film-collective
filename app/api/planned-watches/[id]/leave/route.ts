import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"
import { leavePlannedWatch } from "@/lib/planned-watches/planned-watch-service"

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

    // Verify the planned watch exists and user is not the creator
    const watchRows = await sql`
      SELECT id, created_by FROM planned_watches
      WHERE id = ${plannedWatchId} AND status IN ('planned', 'watching')
    `

    if (watchRows.length === 0) {
      return NextResponse.json(
        { error: "Planned watch not found" },
        { status: 404 },
      )
    }

    if (watchRows[0].created_by === user.id) {
      return NextResponse.json(
        { error: "The creator cannot leave a planned watch" },
        { status: 400 },
      )
    }

    const success = await leavePlannedWatch(plannedWatchId, user.id)

    if (!success) {
      return NextResponse.json(
        { error: "You are not a participant of this planned watch" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving planned watch:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to leave planned watch" },
      { status: 500 },
    )
  }
}
