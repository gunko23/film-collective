import { NextResponse } from "next/server"
import { syncGenres, syncPopularMovies, syncMovieWithCredits, getSyncHistory } from "@/lib/tmdb/sync"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, movieId, pages = 1 } = body

    let result

    switch (action) {
      case "genres":
        result = await syncGenres()
        break
      case "popular":
        result = await syncPopularMovies(pages)
        break
      case "movie":
        if (!movieId) {
          return NextResponse.json({ success: false, message: "movieId is required" }, { status: 400 })
        }
        result = await syncMovieWithCredits(movieId)
        break
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
        itemsProcessed: 0,
      },
      { status: 200 },
    ) // Return 200 so client can parse JSON
  }
}

export async function GET() {
  try {
    const history = await getSyncHistory()
    return NextResponse.json({ history })
  } catch (error) {
    console.error("Failed to get sync history:", error)
    return NextResponse.json({ history: [] }, { status: 200 })
  }
}
