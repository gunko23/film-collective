import { NextResponse } from "next/server"
import { getParentalGuide } from "@/lib/parental-guide/parental-guide-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tmdbId = Number(id)

  if (!tmdbId || isNaN(tmdbId)) {
    return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
  }

  const guide = await getParentalGuide(tmdbId)

  if (!guide) {
    return NextResponse.json(null)
  }

  return NextResponse.json(guide)
}
