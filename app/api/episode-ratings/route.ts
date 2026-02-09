import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { getOrFetchEpisode } from "@/lib/tmdb/tv-service"
import { rebuildUserCrewAffinities } from "@/lib/recommendations/crew-affinity-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const episodeId = searchParams.get("episodeId")
  const tvShowId = searchParams.get("tvShowId")

  if (!episodeId) {
    return NextResponse.json({ error: "Episode ID required" }, { status: 400 })
  }

  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ userRating: null })
    }

    const result = await sql`
      SELECT overall_score as score, user_comment, rated_at
      FROM user_episode_ratings
      WHERE user_id = (SELECT id FROM users WHERE email = ${user.primaryEmail})
      AND episode_id = ${Number.parseInt(episodeId)}
    `

    if (result[0]) {
      result[0].score = result[0].score / 20
    }

    return NextResponse.json({
      userRating: result[0] || null,
    })
  } catch (error) {
    console.error("Episode rating fetch error:", error)
    return NextResponse.json({ userRating: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { episodeId, tvShowId, seasonNumber, score, comment } = body

    if (!episodeId || !tvShowId || score === undefined) {
      return NextResponse.json({ error: "Episode ID, TV show ID, and score required" }, { status: 400 })
    }

    // Ensure user exists in database
    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    if (!dbUser?.id) {
      return NextResponse.json({ error: "Failed to verify user account" }, { status: 500 })
    }

    const episodeData = await getOrFetchEpisode(tvShowId, seasonNumber || 1, episodeId)
    if (!episodeData) {
      return NextResponse.json({ error: "Failed to fetch episode data" }, { status: 500 })
    }

    const scoreFor100Scale = score * 20

    // Upsert rating
    await sql`
      INSERT INTO user_episode_ratings (user_id, episode_id, tv_show_id, overall_score, user_comment, rated_at, updated_at)
      VALUES (${dbUser.id}, ${episodeId}, ${tvShowId}, ${scoreFor100Scale}, ${comment || null}, NOW(), NOW())
      ON CONFLICT (user_id, episode_id) DO UPDATE SET
        overall_score = ${scoreFor100Scale},
        user_comment = ${comment || null},
        updated_at = NOW()
    `

    // Fire-and-forget: rebuild crew affinities for this user
    rebuildUserCrewAffinities(dbUser.id).catch(e =>
      console.error("[Episode Ratings] Error rebuilding crew affinities:", e)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Episode rating save error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save rating" },
      { status: 500 },
    )
  }
}
