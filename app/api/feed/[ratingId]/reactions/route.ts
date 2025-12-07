import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"

export async function GET(request: Request, { params }: { params: Promise<{ ratingId: string }> }) {
  try {
    const { ratingId } = await params

    const reactions = await sql`
      SELECT id, user_id, reaction_type, created_at
      FROM feed_reactions
      WHERE rating_id = ${ratingId}
    `

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error("Error fetching reactions:", error)
    return NextResponse.json({ reactions: [] })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ ratingId: string }> }) {
  try {
    const { ratingId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { reactionType } = await request.json()

    if (!reactionType) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 })
    }

    // Check if reaction already exists
    const existing = await sql`
      SELECT id FROM feed_reactions
      WHERE rating_id = ${ratingId} AND user_id = ${user.id} AND reaction_type = ${reactionType}
    `

    if (existing.length > 0) {
      // Remove the reaction
      await sql`
        DELETE FROM feed_reactions
        WHERE rating_id = ${ratingId} AND user_id = ${user.id} AND reaction_type = ${reactionType}
      `
      return NextResponse.json({ action: "removed" })
    } else {
      // Add the reaction
      const result = await sql`
        INSERT INTO feed_reactions (id, rating_id, user_id, reaction_type, created_at)
        VALUES (gen_random_uuid(), ${ratingId}, ${user.id}, ${reactionType}, NOW())
        RETURNING id
      `
      return NextResponse.json({ action: "added", id: result[0]?.id })
    }
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
  }
}
