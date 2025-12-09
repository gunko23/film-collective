import { NextResponse } from "next/server"
import { getTvShowSignature } from "@/lib/taste/taste-service"

// GET /api/taste/tv/:tvShowId - Get a TV show's Signature
export async function GET(request: Request, { params }: { params: Promise<{ tvShowId: string }> }) {
  try {
    const { tvShowId } = await params

    if (!tvShowId) {
      return NextResponse.json({ error: "tvShowId is required" }, { status: 400 })
    }

    const signature = await getTvShowSignature(Number(tvShowId))

    if (!signature) {
      return NextResponse.json({
        tvShowId,
        ratingsCount: 0,
        avgRating: null,
        message: "No ratings found for this TV show",
      })
    }

    return NextResponse.json(signature)
  } catch (error) {
    console.error("Error fetching TV show signature:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch TV show signature" },
      { status: 500 },
    )
  }
}
