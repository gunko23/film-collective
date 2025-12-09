import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"
import { getOrFetchTVShow } from "@/lib/tmdb/tv-service"
import { getSafeUser } from "@/lib/auth/auth-utils"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tvShowId = searchParams.get("tvShowId")

  if (!tvShowId) {
    return NextResponse.json({ error: "TV show ID required" }, { status: 400 })
  }

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ userRating: null })
    }

    if (!user) {
      return NextResponse.json({ userRating: null })
    }

    const result = await sql`
      SELECT 
        r.id,
        r.overall_score as score, 
        r.user_comment, 
        r.rated_at,
        r.emotional_impact,
        r.pacing,
        r.aesthetic,
        r.rewatchability,
        r.breakdown_tags,
        r.breakdown_notes
      FROM user_tv_show_ratings r
      JOIN users u ON r.user_id = u.id
      WHERE u.email = ${user.primaryEmail}
      AND r.tv_show_id = ${Number.parseInt(tvShowId)}
    `

    if (result[0]) {
      result[0].score = result[0].score / 20
    }

    return NextResponse.json({
      userRating: result[0] || null,
    })
  } catch (error) {
    console.error("TV rating fetch error:", error)
    return NextResponse.json({ userRating: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable. Please try again." }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tvShowId, score, comment } = body

    if (!tvShowId || score === undefined) {
      return NextResponse.json({ error: "TV show ID and score required" }, { status: 400 })
    }

    // Ensure user exists in database
    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    if (!dbUser?.id) {
      return NextResponse.json({ error: "Failed to verify user account" }, { status: 500 })
    }

    const tvShow = await getOrFetchTVShow(tvShowId)
    if (!tvShow) {
      return NextResponse.json({ error: "TV show not found" }, { status: 404 })
    }

    const scoreFor100Scale = score * 20

    // Upsert rating - use the local DB id, not TMDB id
    await sql`
      INSERT INTO user_tv_show_ratings (user_id, tv_show_id, overall_score, user_comment, rated_at, updated_at)
      VALUES (${dbUser.id}, ${tvShow.id}, ${scoreFor100Scale}, ${comment || null}, NOW(), NOW())
      ON CONFLICT (user_id, tv_show_id) DO UPDATE SET
        overall_score = ${scoreFor100Scale},
        user_comment = ${comment || null},
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("TV rating save error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save rating" },
      { status: 500 },
    )
  }
}
