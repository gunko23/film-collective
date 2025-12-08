import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; tvShowId: string }> }) {
  try {
    const { id: collectiveId, tvShowId } = await params

    // Get all ratings for this TV show from collective members
    const ratings = await sql`
      SELECT 
        r.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        r.overall_score,
        r.user_comment,
        r.rated_at
      FROM user_tv_show_ratings r
      JOIN users u ON r.user_id = u.id
      JOIN collective_memberships cm ON r.user_id = cm.user_id
      WHERE cm.collective_id = ${collectiveId}::uuid
        AND r.tv_show_id = ${Number.parseInt(tvShowId)}
      ORDER BY r.rated_at DESC
    `

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error("Error fetching TV show ratings:", error)
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
  }
}
