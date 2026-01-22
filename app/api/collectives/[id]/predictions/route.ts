import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectiveId } = await params

    // Get all predictions for this collective with user info
    const predictions = await sql`
      SELECT 
        op.id,
        op.user_id,
        on_nom.category,
        op.nomination_id,
        op.created_at,
        op.updated_at,
        u.name as user_name,
        u.avatar_url as user_avatar,
        on_nom.work_title as film_title,
        on_nom.nominee as nominee_name,
        on_nom.tmdb_movie_id as tmdb_id
      FROM oscar_predictions op
      JOIN users u ON op.user_id = u.id
      JOIN oscar_nominations on_nom ON op.nomination_id = on_nom.id
      WHERE op.collective_id = ${collectiveId}
      ORDER BY on_nom.category, u.name
    `

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
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId } = await params
    const { category, nominationId } = await request.json()

    if (!category || !nominationId) {
      return NextResponse.json(
        { error: "Category and nominationId are required" },
        { status: 400 }
      )
    }

    // Check if user is a member of this collective
    const membership = await sql`
      SELECT 1 FROM collective_memberships 
      WHERE collective_id = ${collectiveId} AND user_id = ${user.id}
    `

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "You must be a member of this collective" },
        { status: 403 }
      )
    }

    // Get ceremony from the nomination
    const nomination = await sql`
      SELECT ceremony FROM oscar_nominations WHERE id = ${nominationId}
    `
    
    if (nomination.length === 0) {
      return NextResponse.json({ error: "Nomination not found" }, { status: 404 })
    }
    
    const ceremony = nomination[0].ceremony

    // Delete existing prediction for this user/collective/category first
    await sql`
      DELETE FROM oscar_predictions 
      WHERE user_id = ${user.id} 
        AND collective_id = ${collectiveId} 
        AND nomination_id IN (
          SELECT id FROM oscar_nominations WHERE category = ${category}
        )
    `

    // Insert new prediction
    const result = await sql`
      INSERT INTO oscar_predictions (user_id, collective_id, nomination_id, ceremony)
      VALUES (${user.id}, ${collectiveId}, ${nominationId}, ${ceremony})
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
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
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: collectiveId } = await params
    const { category } = await request.json()

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      )
    }

    // Delete prediction for this user/collective/category
    await sql`
      DELETE FROM oscar_predictions 
      WHERE user_id = ${user.id} 
        AND collective_id = ${collectiveId} 
        AND nomination_id IN (
          SELECT id FROM oscar_nominations WHERE category = ${category}
        )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing prediction:", error)
    return NextResponse.json(
      { error: "Failed to remove prediction" },
      { status: 500 }
    )
  }
}
