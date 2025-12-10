import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"

// Get reactions for a comment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; ratingId: string; commentId: string }> },
) {
  try {
    const { id: collectiveId, commentId } = await params

    const reactions = await sql`
      SELECT cr.id, cr.user_id, cr.reaction_type, u.name as user_name
      FROM comment_reactions cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.comment_id = ${commentId} AND cr.collective_id = ${collectiveId}
    `

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error("Error fetching comment reactions:", error)
    return NextResponse.json({ reactions: [] })
  }
}

// Add or remove a reaction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; ratingId: string; commentId: string }> },
) {
  try {
    const { id: collectiveId, commentId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { reactionType } = await request.json()

    // Check if reaction exists
    const existing = await sql`
      SELECT id FROM comment_reactions
      WHERE comment_id = ${commentId} AND user_id = ${dbUser.id} AND reaction_type = ${reactionType}
    `

    if (existing.length > 0) {
      // Remove reaction
      await sql`
        DELETE FROM comment_reactions
        WHERE comment_id = ${commentId} AND user_id = ${dbUser.id} AND reaction_type = ${reactionType}
      `
      return NextResponse.json({ action: "removed" })
    } else {
      // Add reaction
      const result = await sql`
        INSERT INTO comment_reactions (comment_id, collective_id, user_id, reaction_type)
        VALUES (${commentId}, ${collectiveId}, ${dbUser.id}, ${reactionType})
        RETURNING id
      `
      return NextResponse.json({ action: "added", id: result[0].id })
    }
  } catch (error) {
    console.error("Error toggling comment reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
