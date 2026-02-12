import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { updateParticipantWatchStatus } from "@/lib/planned-watches/planned-watch-service"
import { notifyCollectiveMembers } from "@/lib/notifications/notification-service"
import { sql } from "@/lib/db"

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

    // Notify collective members when someone starts watching
    if (watchStatus === "watching") {
      // Look up movie title and linked collectives for this planned watch
      const watchInfo = await sql`
        SELECT pw.movie_title, pw.movie_poster, pwc.collective_id
        FROM planned_watches pw
        JOIN planned_watch_collectives pwc ON pwc.planned_watch_id = pw.id
        WHERE pw.id = ${id}
      `
      for (const row of watchInfo) {
        notifyCollectiveMembers(row.collective_id, user.id, {
          type: "started_watching",
          mediaTitle: row.movie_title,
          mediaPoster: row.movie_poster,
          mediaType: "movie",
        }).catch((err) => console.error("Started watching notification error:", err))
      }
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
