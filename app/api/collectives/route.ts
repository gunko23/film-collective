import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { ensureUserExists } from "@/lib/db/user-service"
import { getUserCollectives, createCollective } from "@/lib/collectives/collective-service"

// GET /api/collectives - Get all collectives for the current user
export async function GET() {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in our database
    await ensureUserExists({
      id: user.id,
      email: user.primaryEmail,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
    })

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
