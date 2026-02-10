import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { updateParticipantRsvp } from "@/lib/planned-watches/planned-watch-service"

export async function PATCH(
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

    const { id } = await params
    const body = await request.json()
    const { rsvpStatus } = body

    const validStatuses = ["confirmed", "declined"]
    if (!rsvpStatus || !validStatuses.includes(rsvpStatus)) {
      return NextResponse.json(
        { error: `rsvpStatus must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      )
    }

    const updated = await updateParticipantRsvp(id, user.id, rsvpStatus)

    if (!updated) {
      return NextResponse.json(
        { error: "Planned watch not found or you are not a participant" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating RSVP status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update RSVP status" },
      { status: 500 },
    )
  }
}
