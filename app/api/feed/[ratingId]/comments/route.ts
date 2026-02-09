import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
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
        u.avatar_url as user_avatar,
        fc.content,
        fc.gif_url,
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
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const { content, gifUrl } = await request.json()

    // Allow empty content if there's a GIF
    if ((!content || content.trim().length === 0) && !gifUrl) {
      return NextResponse.json({ error: "Comment content or GIF is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO feed_comments (id, rating_id, user_id, content, gif_url, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ratingId}, ${user.id}, ${content?.trim() || ""}, ${gifUrl || null}, NOW(), NOW())
      RETURNING id, user_id, content, gif_url, created_at
    `

    const comment = {
      ...result[0],
      user_name: user.displayName || "Anonymous",
      user_avatar: user.profileImageUrl || null,
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
