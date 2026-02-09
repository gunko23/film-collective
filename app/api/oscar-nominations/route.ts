import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
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
        tmdb_movie_id,
        tmdb_person_id,
        poster_path,
        profile_path,
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
