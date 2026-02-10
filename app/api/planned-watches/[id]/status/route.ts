import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { updatePlannedWatchStatus } from "@/lib/planned-watches/planned-watch-service"

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
    const { status } = body

    const validStatuses = ["watching", "watched", "cancelled"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      )
    }

    const updated = await updatePlannedWatchStatus(id, status, user.id)

    if (!updated) {
      return NextResponse.json(
        { error: "Planned watch not found or you don't have access" },
        { status: 404 },
      )
    }

    return NextResponse.json({ plannedWatch: updated })
  } catch (error) {
    console.error("Error updating planned watch status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update status" },
      { status: 500 },
    )
  }
}
