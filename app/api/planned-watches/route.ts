import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { createPlannedWatch } from "@/lib/planned-watches/planned-watch-service"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { movieId, movieTitle, movieYear, moviePoster, collectiveId, participantIds, scheduledFor, moodTags } = body

    if (!movieId || !movieTitle) {
      return NextResponse.json({ error: "movieId and movieTitle are required" }, { status: 400 })
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: "participantIds must be a non-empty array" }, { status: 400 })
    }

    const plannedWatch = await createPlannedWatch({
      movieId,
      movieTitle,
      movieYear: movieYear ?? null,
      moviePoster: moviePoster ?? null,
      createdBy: user.id,
      collectiveId: collectiveId ?? null,
      participantIds,
      scheduledFor: scheduledFor ?? null,
      moodTags: moodTags ?? null,
      source: "tonights_pick",
    })

    return NextResponse.json({ plannedWatch }, { status: 201 })
  } catch (error) {
    console.error("Error creating planned watch:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create planned watch" },
      { status: 500 },
    )
  }
}
