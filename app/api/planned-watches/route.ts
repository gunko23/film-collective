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
    const { movieId, movieTitle, movieYear, moviePoster, collectiveId, collectiveIds, participantIds, scheduledFor, moodTags, source } = body

    if (!movieId || !movieTitle) {
      return NextResponse.json({ error: "movieId and movieTitle are required" }, { status: 400 })
    }

    const validSources = ["tonights_pick", "manual", "recommendation"] as const
    const safeSource = validSources.includes(source) ? source : "tonights_pick"

    // For manual adds, participantIds can be empty — default to current user
    const resolvedParticipantIds =
      Array.isArray(participantIds) && participantIds.length > 0
        ? participantIds
        : [user.id]

    // Support both collectiveIds (array) and legacy collectiveId (single)
    const resolvedCollectiveIds: string[] = Array.isArray(collectiveIds)
      ? collectiveIds
      : collectiveId
        ? [collectiveId]
        : []

    const plannedWatch = await createPlannedWatch({
      movieId,
      movieTitle,
      movieYear: movieYear ?? null,
      moviePoster: moviePoster ?? null,
      createdBy: user.id,
      collectiveIds: resolvedCollectiveIds,
      participantIds: resolvedParticipantIds,
      scheduledFor: scheduledFor ?? null,
      moodTags: moodTags ?? null,
      source: safeSource,
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
