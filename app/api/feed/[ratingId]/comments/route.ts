import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { sql } from "@/lib/db"
import { ensureUserExists } from "@/lib/db/user-service"

export async function GET(request: Request, { params }: { params: Promise<{ ratingId: string }> }) {
  try {
    const { ratingId } = await params

    const comments = await sql`
      SELECT 
        fc.id,
        fc.user_id,
        u.name as user_name,
        fc.content,
        fc.created_at
      FROM feed_comments fc
      JOIN users u ON u.id = fc.user_id
      WHERE fc.rating_id = ${ratingId}
      ORDER BY fc.created_at ASC
    `

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ comments: [] })
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

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, user_id, content, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}, ${user.id}, ${content.trim()}, NOW(), NOW())
      RETURNING id, user_id, content, created_at
    `

    const comment = {
      ...result[0],
      user_name: user.displayName || "Anonymous",
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
