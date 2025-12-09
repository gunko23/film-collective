import { NextResponse } from "next/server"
import { getCollectiveTasteMap } from "@/lib/taste/taste-service"

// GET /api/taste/collective/:collectiveId - Get a collective's Taste Map
export async function GET(request: Request, { params }: { params: Promise<{ collectiveId: string }> }) {
  try {
    const { collectiveId } = await params

    if (!collectiveId) {
      return NextResponse.json({ error: "collectiveId is required" }, { status: 400 })
    }

    const tasteMap = await getCollectiveTasteMap(collectiveId)

    if (!tasteMap) {
      return NextResponse.json({
        collectiveId,
        membersCount: 0,
        totalRatingsCount: 0,
        avgRating: null,
        message: "No taste data found for this collective",
      })
    }

    return NextResponse.json(tasteMap)
  } catch (error) {
    console.error("Error fetching collective taste map:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch taste map" },
      { status: 500 },
    )
  }
}
