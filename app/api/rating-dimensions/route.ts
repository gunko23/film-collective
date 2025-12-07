import { NextResponse } from "next/server"
import { getRatingDimensions } from "@/lib/ratings/rating-service"

export async function GET() {
  try {
    const dimensions = await getRatingDimensions()
    return NextResponse.json({ dimensions })
  } catch (error) {
    console.error("Error fetching rating dimensions:", error)
    return NextResponse.json({ error: "Failed to fetch rating dimensions" }, { status: 500 })
  }
}
