import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { updateParticipantWatchStatus } from "@/lib/planned-watches/planned-watch-service"

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
    const { watchStatus } = body

    const validStatuses = ["watching", "watched"]
    if (!watchStatus || !validStatuses.includes(watchStatus)) {
      return NextResponse.json(
        { error: `watchStatus must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      )
    }

    const result = await updateParticipantWatchStatus(id, user.id, watchStatus)

    if (!result.success) {
      return NextResponse.json(
        { error: "Planned watch not found or you are not a confirmed participant" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      movieId: result.movieId,
    })
  } catch (error) {
    console.error("Error updating participant watch status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update watch status" },
      { status: 500 },
    )
  }
}
