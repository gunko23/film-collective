import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { sql } from "@/lib/db"

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
    const { movieId, source } = body

    if (!movieId || typeof movieId !== "number") {
      return NextResponse.json({ error: "movieId (number) is required" }, { status: 400 })
    }

    const validSources = ["recommendation", "detail_page", "feed"]
    const safeSource = validSources.includes(source) ? source : "recommendation"

    const result = await sql`
      INSERT INTO user_dismissed_movies (user_id, movie_id, source)
      VALUES (${user.id}, ${movieId}, ${safeSource})
      ON CONFLICT (user_id, movie_id) DO NOTHING
      RETURNING id, movie_id, created_at
    `

    if (result.length === 0) {
      // Already dismissed — return success silently
      return NextResponse.json({ movieId, alreadyDismissed: true }, { status: 200 })
    }

    return NextResponse.json(
      { id: result[0].id, movieId: result[0].movie_id, createdAt: result[0].created_at },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error dismissing movie:", error)
    return NextResponse.json(
      { error: "Failed to dismiss movie" },
      { status: 500 },
    )
  }
}

export async function GET() {
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

    const result = await sql`
      SELECT movie_id FROM user_dismissed_movies
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    const movieIds = result.map((r: any) => r.movie_id)

    return NextResponse.json({ movieIds, count: movieIds.length })
  } catch (error) {
    console.error("Error fetching dismissed movies:", error)
    return NextResponse.json(
      { error: "Failed to fetch dismissed movies" },
      { status: 500 },
    )
  }
}
