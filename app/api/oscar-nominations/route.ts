import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const nominations = await sql`
      SELECT 
        id,
        award_year,
        ceremony,
        category,
        work_title as film_title,
        nominee as nominee_name,
        tmdb_movie_id as tmdb_id,
        film_nomination
      FROM oscar_nominations
      WHERE award_year = 2026
      ORDER BY category, work_title
    `

    // Group by category
    const grouped = nominations.reduce((acc: Record<string, typeof nominations>, nom) => {
      const category = nom.category as string
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(nom)
      return acc
    }, {})

    return NextResponse.json({ nominations: grouped })
  } catch (error) {
    console.error("Error fetching Oscar nominations:", error)
    return NextResponse.json(
      { error: "Failed to fetch nominations" },
      { status: 500 }
    )
  }
}
