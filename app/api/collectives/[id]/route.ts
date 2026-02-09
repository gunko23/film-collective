import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getCollectiveForUser, deleteCollective } from "@/lib/collectives/collective-service"

// GET /api/collectives/[id] - Get a specific collective
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()
    const { id } = await params

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const collective = await getCollectiveForUser(id, user.id)

    if (!collective) {
      return NextResponse.json({ error: "Collective not found" }, { status: 404 })
    }

    return NextResponse.json(collective)
  } catch (error) {
    console.error("Error fetching collective:", error)
    return NextResponse.json({ error: "Failed to fetch collective" }, { status: 500 })
  }
}

// DELETE /api/collectives/[id] - Delete a collective
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()
    const { id } = await params

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await deleteCollective(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting collective:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete collective" },
      { status: 500 },
    )
  }
}
