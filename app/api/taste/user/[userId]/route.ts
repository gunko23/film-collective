import { NextResponse } from "next/server"
import { getUserTasteVector } from "@/lib/taste/taste-service"

// GET /api/taste/user/:userId - Get a user's Taste Vector
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const tasteVector = await getUserTasteVector(userId)

    if (!tasteVector) {
      return NextResponse.json({
        userId,
        ratingsCount: 0,
        avgRating: null,
        message: "No ratings found for this user",
      })
    }

    return NextResponse.json(tasteVector)
  } catch (error) {
    console.error("Error fetching user taste vector:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch taste vector" },
      { status: 500 },
    )
  }
}
