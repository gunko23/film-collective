import { NextResponse } from "next/server"
import { getFilmSignature, getFilmSignatureByTmdbId } from "@/lib/taste/taste-service"

// GET /api/taste/film/:movieId - Get a film's Signature
// movieId can be either the internal UUID or TMDB ID (if numeric)
export async function GET(request: Request, { params }: { params: Promise<{ movieId: string }> }) {
  try {
    const { movieId } = await params

    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 })
    }

    // Check if movieId is numeric (TMDB ID) or UUID (internal ID)
    const isNumeric = /^\d+$/.test(movieId)

    let signature
    if (isNumeric) {
      signature = await getFilmSignatureByTmdbId(Number(movieId))
    } else {
      signature = await getFilmSignature(movieId)
    }

    if (!signature) {
      return NextResponse.json({
        movieId,
        ratingsCount: 0,
        avgRating: null,
        message: "No ratings found for this film",
      })
    }

    return NextResponse.json(signature)
  } catch (error) {
    console.error("Error fetching film signature:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch film signature" },
      { status: 500 },
    )
  }
}
