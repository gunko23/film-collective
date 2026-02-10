import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getCollectivePlannedWatches } from "@/lib/planned-watches/planned-watch-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Auth temporarily unavailable. Please try again in a moment." },
        { status: 503 },
      )
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params
    const watches = await getCollectivePlannedWatches(collectiveId, user.id)

    return NextResponse.json({ watches })
  } catch (error) {
    console.error("Error fetching collective planned watches:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch planned watches" },
      { status: 500 },
    )
  }
}
