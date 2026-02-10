import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
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

    const { movieId } = await params
    const movieIdNum = parseInt(movieId, 10)

    if (isNaN(movieIdNum)) {
      return NextResponse.json({ error: "Invalid movieId" }, { status: 400 })
    }

    await sql`
      DELETE FROM user_dismissed_movies
      WHERE user_id = ${user.id} AND movie_id = ${movieIdNum}
    `

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error undoing movie dismissal:", error)
    return NextResponse.json(
      { error: "Failed to undo dismissal" },
      { status: 500 },
    )
  }
}
