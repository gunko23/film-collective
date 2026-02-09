import { NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getAllPredictions, savePrediction, deletePrediction } from "@/lib/predictions/prediction-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectiveId } = await params

    const predictions = await getAllPredictions(collectiveId)

    // Group predictions by category, then by user
    const grouped: Record<string, Record<string, {
      user_id: string
      user_name: string
      user_avatar: string | null
      prediction: {
        nomination_id: number
        film_title: string
        nominee_name: string | null
        tmdb_id: number | null
        is_winner: boolean
      }
    }>> = {}

    for (const pred of predictions) {
      const category = pred.category as string
      const userId = pred.user_id as string

      if (!grouped[category]) {
        grouped[category] = {}
      }

      grouped[category][userId] = {
        user_id: userId,
        user_name: pred.user_name as string,
        user_avatar: pred.user_avatar as string | null,
        prediction: {
          nomination_id: pred.nomination_id as string,
          film_title: pred.film_title as string,
          nominee_name: pred.nominee_name as string | null,
          tmdb_id: pred.tmdb_id as number | null
        }
      }
    }

    return NextResponse.json({ predictions: grouped })
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params
    const { category, nominationId } = await request.json()

    if (!category || !nominationId) {
      return NextResponse.json(
        { error: "Category and nominationId are required" },
        { status: 400 }
      )
    }

    const result = await savePrediction(user.id, collectiveId, category, nominationId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 })
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error("Error saving prediction:", error)
    return NextResponse.json(
      { error: "Failed to save prediction" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params
    const { category } = await request.json()

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      )
    }

    await deletePrediction(user.id, collectiveId, category)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing prediction:", error)
    return NextResponse.json(
      { error: "Failed to remove prediction" },
      { status: 500 }
    )
  }
}
