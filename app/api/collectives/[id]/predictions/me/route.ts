import { NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getUserPredictions } from "@/lib/predictions/prediction-service"

export async function GET(
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

    const predictions = await getUserPredictions(user.id, collectiveId)

    // Convert to a map of category -> prediction
    const predictionsMap: Record<string, {
      nomination_id: string
      film_title: string
      nominee_name: string | null
    }> = {}

    for (const pred of predictions) {
      predictionsMap[pred.category as string] = {
        nomination_id: pred.nomination_id as string,
        film_title: pred.film_title as string,
        nominee_name: pred.nominee_name as string | null
      }
    }

    return NextResponse.json({ predictions: predictionsMap })
  } catch (error) {
    console.error("Error fetching user predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    )
  }
}
