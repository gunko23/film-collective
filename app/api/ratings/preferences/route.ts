import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getRatingPreferences, setRatingPreferences } from "@/lib/ratings/rating-service"

// GET - Fetch user's rating preferences
export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    // Return default if rate limited - don't block the flow
    if (isRateLimited || !user) {
      return NextResponse.json({ skipBreakdown: false })
    }

    const prefs = await getRatingPreferences(user.id)

    return NextResponse.json({
      skipBreakdown: prefs.skipBreakdown,
    })
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json({ skipBreakdown: false })
  }
}

// POST - Update user's rating preferences
export async function POST(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { skipBreakdown } = body

    await setRatingPreferences(user.id, skipBreakdown)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preferences" },
      { status: 500 },
    )
  }
}
