import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"

type Props = {
  params: Promise<{ id: string; tmdbId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id: collectiveId, tmdbId } = await params
  const { searchParams } = new URL(request.url)
  const mediaType = searchParams.get("mediaType") || "movie"

  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json([])
    }

    // Get typing indicators from last 5 seconds, excluding current user
    const typingUsers = await sql`
      SELECT user_id, user_name, updated_at
      FROM movie_typing_indicators
      WHERE collective_id = ${collectiveId}
        AND tmdb_id = ${Number.parseInt(tmdbId)}
        AND media_type = ${mediaType}
        AND user_id != ${user.id}
        AND updated_at > NOW() - INTERVAL '5 seconds'
    `

    return NextResponse.json(typingUsers)
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id: collectiveId, tmdbId } = await params

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const body = await request.json()
    const { mediaType = "movie" } = body

    await sql`
      INSERT INTO movie_typing_indicators (collective_id, tmdb_id, media_type, user_id, user_name, updated_at)
      VALUES (${collectiveId}, ${Number.parseInt(tmdbId)}, ${mediaType}, ${dbUser.id}, ${dbUser.name}, NOW())
      ON CONFLICT (collective_id, tmdb_id, media_type, user_id)
      DO UPDATE SET updated_at = NOW(), user_name = ${dbUser.name}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing indicator:", error)
    return NextResponse.json({ error: "Failed to update typing" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id: collectiveId, tmdbId } = await params

  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get("mediaType") || "movie"

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    await sql`
      DELETE FROM movie_typing_indicators
      WHERE collective_id = ${collectiveId}
        AND tmdb_id = ${Number.parseInt(tmdbId)}
        AND media_type = ${mediaType}
        AND user_id = ${dbUser.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing typing indicator:", error)
    return NextResponse.json({ error: "Failed to remove typing" }, { status: 500 })
  }
}
