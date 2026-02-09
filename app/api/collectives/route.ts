import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import { getUserCollectives, createCollective } from "@/lib/collectives/collective-service"

// GET /api/collectives - Get all collectives for the current user
export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const collectives = await getUserCollectives(user.id)
    return NextResponse.json(collectives)
  } catch (error) {
    console.error("Error fetching collectives:", error)
    return NextResponse.json({ error: "Failed to fetch collectives" }, { status: 500 })
  }
}

// POST /api/collectives - Create a new collective
export async function POST(request: NextRequest) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Collective name is required" }, { status: 400 })
    }

    const collective = await createCollective(name.trim(), description?.trim() || null, user.id)
    return NextResponse.json(collective)
  } catch (error) {
    console.error("Error creating collective:", error)
    return NextResponse.json({ error: "Failed to create collective" }, { status: 500 })
  }
}
