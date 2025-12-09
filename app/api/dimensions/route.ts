import { NextResponse } from "next/server"
import { getActiveRatingDimensions } from "@/lib/ratings/dimensions-service"

// GET - Fetch all active rating dimensions with their options
export async function GET() {
  try {
    const dimensions = await getActiveRatingDimensions()
    return NextResponse.json({ dimensions })
  } catch (error) {
    console.error("Error fetching dimensions:", error)
    return NextResponse.json({ error: "Failed to fetch rating dimensions" }, { status: 500 })
  }
}
