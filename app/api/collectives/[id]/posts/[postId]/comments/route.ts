import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
import { ensureUserExists } from "@/lib/db/user-service"

// GET comments for a post
export async function GET(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  try {
    const { postId } = await params

    const comments = await sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST add a comment
export async function POST(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  try {
    const { id: collectiveId, postId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    // Verify user is a member of the collective
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const newComment = await sql`
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES (${postId}, ${dbUser.id}, ${content})
      RETURNING *
    `

    // Get the comment with user info
    const commentWithUser = await sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${newComment[0].id}
    `

    return NextResponse.json({ comment: commentWithUser[0] })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
