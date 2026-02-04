import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.TENOR_API_KEY
  if (!apiKey) {
    console.error("TENOR_API_KEY not configured")
    return NextResponse.json({ error: "GIF search not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&client_key=film_collective&limit=12`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch GIFs from Tenor")
    }

    const data = await response.json()

    const results =
      data.results?.map((gif: { media_formats: { gif: { url: string }; tinygif: { url: string } } }) => ({
        url: gif.media_formats.gif?.url || gif.media_formats.tinygif?.url,
        preview: gif.media_formats.tinygif?.url || gif.media_formats.gif?.url,
      })) || []

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching GIFs:", error)
    return NextResponse.json({ error: "Failed to search GIFs" }, { status: 500 })
  }
}
