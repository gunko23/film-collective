import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tvShowId = Number.parseInt(id)

  if (isNaN(tvShowId)) {
    return NextResponse.json({ error: "Invalid TV show ID" }, { status: 400 })
  }

  try {
    const result = await sql`
      SELECT 
        COUNT(*) as rating_count,
        AVG(overall_score) as average_score
      FROM user_tv_show_ratings
      WHERE tv_show_id = ${tvShowId}
    `

    const stats = result[0]

    return NextResponse.json({
      ratingCount: Number.parseInt(stats.rating_count) || 0,
      averageScore: stats.average_score ? Number.parseFloat(stats.average_score) : null,
    })
  } catch (error) {
    console.error("TV show stats error:", error)
    return NextResponse.json({
      ratingCount: 0,
      averageScore: null,
    })
  }
}
