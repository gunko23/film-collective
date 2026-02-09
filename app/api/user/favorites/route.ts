import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"
export async function GET() {
  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const favorites = await sql`
      SELECT id, tmdb_id, title, poster_path, release_date, position
      FROM user_favorite_movies
      WHERE user_id = ${user.id}::uuid
      ORDER BY position ASC
    `

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tmdbId, title, posterPath, releaseDate, position } = await request.json()

    if (!tmdbId || !title || !position || position < 1 || position > 3) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Upsert the favorite movie at the given position
    const result = await sql`
      INSERT INTO user_favorite_movies (user_id, tmdb_id, title, poster_path, release_date, position)
      VALUES (${user.id}::uuid, ${tmdbId}, ${title}, ${posterPath || null}, ${releaseDate || null}, ${position})
      ON CONFLICT (user_id, position) 
      DO UPDATE SET 
        tmdb_id = ${tmdbId},
        title = ${title},
        poster_path = ${posterPath || null},
        release_date = ${releaseDate || null},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ favorite: result[0] })
  } catch (error: unknown) {
    // Handle unique constraint on tmdb_id
    if (error instanceof Error && error.message?.includes("user_favorite_movies_user_id_tmdb_id_key")) {
      return NextResponse.json({ error: "This movie is already in your favorites" }, { status: 400 })
    }
    console.error("Error saving favorite:", error)
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position")

    if (!position) {
      return NextResponse.json({ error: "Position required" }, { status: 400 })
    }

    await sql`
      DELETE FROM user_favorite_movies
      WHERE user_id = ${user.id}::uuid AND position = ${Number.parseInt(position)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting favorite:", error)
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 })
  }
}
