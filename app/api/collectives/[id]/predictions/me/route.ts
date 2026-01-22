import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    // Get current user's predictions for this collective
    const predictions = await sql`
      SELECT 
        on_nom.category,
        op.nomination_id,
        on_nom.work_title as film_title,
        on_nom.nominee as nominee_name
      FROM oscar_predictions op
      JOIN oscar_nominations on_nom ON op.nomination_id = on_nom.id
      WHERE op.user_id = ${user.id} AND op.collective_id = ${collectiveId}
    `

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
