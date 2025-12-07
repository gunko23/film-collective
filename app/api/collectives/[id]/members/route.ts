import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getCollectiveMembers, leaveCollective, updateMemberRole } from "@/lib/collectives/collective-service"

// GET /api/collectives/[id]/members - Get all members
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const members = await getCollectiveMembers(id)
    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

// DELETE /api/collectives/[id]/members - Leave collective
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await leaveCollective(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving collective:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to leave collective" },
      { status: 500 },
    )
  }
}

// PATCH /api/collectives/[id]/members - Update member role
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId: targetUserId, role } = body

    if (!targetUserId || !role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    await updateMemberRole(id, targetUserId, role, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update member role" },
      { status: 500 },
    )
  }
}
