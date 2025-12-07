import { NextResponse } from "next/server"
import { createTMDBClient } from "@/lib/tmdb/client"

export async function GET() {
  try {
    const client = createTMDBClient()
    if (!client) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 })
    }

    const genres = await client.getGenres()

    return NextResponse.json({ genres })
  } catch (error) {
    console.error("Failed to fetch genres:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch genres" },
      { status: 500 },
    )
  }
}
