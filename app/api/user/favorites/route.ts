import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getUserFavorites, addUserFavorite, deleteUserFavorite } from "@/lib/db/user-service"

export async function GET() {
  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const favorites = await getUserFavorites(user.id)

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

    const favorite = await addUserFavorite(user.id, {
      tmdbId,
      title,
      posterPath: posterPath || null,
      releaseDate: releaseDate || null,
      position,
    })

    return NextResponse.json({ favorite })
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

    await deleteUserFavorite(user.id, Number.parseInt(position))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting favorite:", error)
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 })
  }
}
