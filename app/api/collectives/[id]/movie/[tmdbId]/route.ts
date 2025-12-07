import { stackServerApp } from "@/stack"
import { type NextRequest, NextResponse } from "next/server"
import { getCollectiveMovieRatings } from "@/lib/collectives/collective-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; tmdbId: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId, tmdbId } = await params
    const ratings = await getCollectiveMovieRatings(collectiveId, tmdbId)

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error("Error fetching collective movie ratings:", error)
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
  }
}
