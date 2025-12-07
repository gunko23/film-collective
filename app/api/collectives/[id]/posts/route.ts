import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
import { ensureUserExists } from "@/lib/db/user-service"

// GET all posts for a collective
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 10
    const offset = (page - 1) * limit

    // Get posts with user info and comment count
    const posts = await sql`
      SELECT 
        p.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM post_movie_list_items pml WHERE pml.post_id = p.id) as movie_count
      FROM collective_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.collective_id = ${collectiveId}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM collective_posts WHERE collective_id = ${collectiveId}
    `
    const total = Number.parseInt(countResult[0]?.total || "0")

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

// POST create a new post
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: collectiveId } = await params

    let user
    try {
      user = await stackServerApp.getUser()
    } catch (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed - please try again" }, { status: 401 })
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "Please sign in to create a post" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    if (!dbUser || !dbUser.id) {
      return NextResponse.json({ error: "Failed to verify user account" }, { status: 500 })
    }

    const body = await request.json()
    const { title, content, postType, movieListItems } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Verify user is a member of the collective
    const membership = await sql`
      SELECT id FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${dbUser.id}
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    // Create the post
    const newPost = await sql`
      INSERT INTO collective_posts (collective_id, user_id, title, content, post_type)
      VALUES (${collectiveId}, ${dbUser.id}, ${title}, ${content || null}, ${postType || "discussion"})
      RETURNING *
    `

    const postId = newPost[0].id

    // If it's a movie list, add the movies
    if (postType === "movie_list" && movieListItems && movieListItems.length > 0) {
      for (let i = 0; i < movieListItems.length; i++) {
        const item = movieListItems[i]
        await sql`
          INSERT INTO post_movie_list_items (post_id, tmdb_id, title, poster_path, release_date, position, note)
          VALUES (${postId}, ${item.tmdbId}, ${item.title}, ${item.posterPath || null}, ${item.releaseDate || null}, ${i}, ${item.note || null})
        `
      }
    }

    return NextResponse.json({ post: newPost[0] })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
