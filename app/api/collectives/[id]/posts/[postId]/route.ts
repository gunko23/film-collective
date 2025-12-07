import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
import { ensureUserExists } from "@/lib/db/user-service"

// GET single post with all details
export async function GET(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  try {
    const { postId } = await params

    // Get post with user info
    const posts = await sql`
      SELECT 
        p.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM collective_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ${postId}
    `

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = posts[0]

    // Get movie list items if it's a movie list
    let movieListItems: any[] = []
    if (post.post_type === "movie_list") {
      movieListItems = await sql`
        SELECT * FROM post_movie_list_items
        WHERE post_id = ${postId}
        ORDER BY position ASC
      `
    }

    // Get comments
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

    return NextResponse.json({
      post,
      movieListItems,
      comments,
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

// DELETE a post
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  try {
    const { postId } = await params
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    // Check if user owns the post
    const post = await sql`
      SELECT user_id FROM collective_posts WHERE id = ${postId}
    `

    if (post.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 })
    }

    await sql`DELETE FROM collective_posts WHERE id = ${postId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
