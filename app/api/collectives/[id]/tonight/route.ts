import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"
import { getTonightsPick, getCollectiveMembersForPick } from "@/lib/recommendations/recommendation-service"
import { getCollectiveForUser } from "@/lib/collectives/collective-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    // Verify user is a member of the collective
    const collective = await getCollectiveForUser(collectiveId, user.id)
    if (!collective || !collective.user_role) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    // Get members for the selection UI
    const members = await getCollectiveMembersForPick(collectiveId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching tonight's pick members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    // Verify user is a member of the collective
    const collective = await getCollectiveForUser(collectiveId, user.id)
    if (!collective || !collective.user_role) {
      return NextResponse.json({ error: "Not a member of this collective" }, { status: 403 })
    }

    const body = await request.json()
    const { memberIds, mood, maxRuntime, contentRating, parentalFilters, page, era, startYear } = body

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "At least one member must be selected" }, { status: 400 })
    }

    // Get recommendations
    const result = await getTonightsPick({
      collectiveId,
      memberIds,
      mood: mood || null,
      maxRuntime: maxRuntime || null,
      contentRating: contentRating || null,
      parentalFilters: parentalFilters || null,
      page: page || 1,
      era: era || null,
      startYear: startYear || null,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error getting tonight's pick:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recommendations" },
      { status: 500 }
    )
  }
}