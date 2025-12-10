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
    const comments = await sql`
      SELECT 
        mc.id,
        mc.content,
        mc.gif_url,
        mc.created_at,
        mc.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', mcr.id,
            'reaction_type', mcr.reaction_type,
            'user_id', mcr.user_id,
            'user_name', ru.name
          ))
          FROM movie_comment_reactions mcr
          JOIN users ru ON ru.id = mcr.user_id
          WHERE mcr.comment_id = mc.id),
          '[]'
        ) as reactions
      FROM movie_comments mc
      JOIN users u ON u.id = mc.user_id
      WHERE mc.collective_id = ${collectiveId}
        AND mc.tmdb_id = ${Number.parseInt(tmdbId)}
        AND mc.media_type = ${mediaType}
      ORDER BY mc.created_at ASC
    `

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching movie comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id: collectiveId, tmdbId } = await params

  try {
    const user = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.displayName || "User", user.primaryEmail || "")

    const body = await request.json()
    const { content, gifUrl, mediaType = "movie" } = body

    if (!content?.trim() && !gifUrl) {
      return NextResponse.json({ error: "Content or GIF required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO movie_comments (collective_id, tmdb_id, media_type, user_id, content, gif_url)
      VALUES (${collectiveId}, ${Number.parseInt(tmdbId)}, ${mediaType}, ${dbUser.id}, ${content?.trim() || ""}, ${gifUrl || null})
      RETURNING id, content, gif_url, created_at, user_id
    `

    const newComment = {
      ...result[0],
      user_name: dbUser.name,
      user_avatar: dbUser.avatar_url,
      reactions: [],
    }

    return NextResponse.json(newComment)
  } catch (error) {
    console.error("Error creating movie comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
