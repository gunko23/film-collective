import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSafeUser } from "@/lib/auth/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch user's rating preferences
export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    // Return default if rate limited - don't block the flow
    if (isRateLimited || !user) {
      return NextResponse.json({ skipBreakdown: false })
    }

    const result = await sql`
      SELECT skip_breakdown FROM user_rating_preferences
      WHERE user_id = ${user.id}::uuid
    `

    return NextResponse.json({
      skipBreakdown: result.length > 0 ? result[0].skip_breakdown : false,
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

    await sql`
      INSERT INTO user_rating_preferences (user_id, skip_breakdown, updated_at)
      VALUES (${user.id}::uuid, ${skipBreakdown}, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET skip_breakdown = ${skipBreakdown}, updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update preferences" },
      { status: 500 },
    )
  }
}
