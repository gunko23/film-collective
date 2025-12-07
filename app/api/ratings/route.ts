import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { upsertRating, getUserRatingByTmdbId } from "@/lib/ratings/rating-service"
import { ensureUserExists } from "@/lib/db/user-service"

// GET - Fetch user's rating for a movie
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tmdbId = searchParams.get("tmdbId")

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 })
    }

    const userRating = await getUserRatingByTmdbId(user.id, Number.parseInt(tmdbId))

    return NextResponse.json({
      userRating: userRating
        ? {
            ...userRating,
            score: userRating.overallScore / 20,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching rating:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch rating" },
      { status: 500 },
    )
  }
}

// POST - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await ensureUserExists({
      id: user.id,
      email: user.primaryEmail,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
    })

    const body = await request.json()
    const { tmdbId, score, comment } = body

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 })
    }

    if (score === undefined || score < 0 || score > 5) {
      return NextResponse.json({ error: "score must be between 0 and 5" }, { status: 400 })
    }

    const overallScore = Math.round(score * 20)

    const rating = await upsertRating({
      userId: user.id,
      tmdbMovieId: tmdbId,
      overallScore,
      userComment: comment,
    })

    return NextResponse.json({
      success: true,
      rating: {
        ...rating,
        score: rating.overallScore / 20,
      },
    })
  } catch (error) {
    console.error("Error saving rating:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save rating" },
      { status: 500 },
    )
  }
}
