import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"

type Props = {
  params: Promise<{ id: string; tmdbId: string; commentId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id: collectiveId, commentId } = await params

  try {
    const user = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.displayName || "User", user.primaryEmail || "")

    const body = await request.json()
    const { reactionType } = body

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type required" }, { status: 400 })
    }

    // Check if reaction already exists
    const existing = await sql`
      SELECT id FROM movie_comment_reactions
      WHERE comment_id = ${commentId}
        AND user_id = ${dbUser.id}
        AND reaction_type = ${reactionType}
    `

    if (existing.length > 0) {
      // Remove existing reaction
      await sql`
        DELETE FROM movie_comment_reactions
        WHERE id = ${existing[0].id}
      `
      return NextResponse.json({ removed: true })
    }

    // Add new reaction
    const result = await sql`
      INSERT INTO movie_comment_reactions (comment_id, collective_id, user_id, reaction_type)
      VALUES (${commentId}, ${collectiveId}, ${dbUser.id}, ${reactionType})
      RETURNING id, reaction_type, user_id
    `

    return NextResponse.json({
      ...result[0],
      user_name: dbUser.name,
    })
  } catch (error) {
    console.error("Error toggling movie comment reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
