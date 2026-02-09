import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getCollective, getCollectiveRatedMovies } from "@/lib/collectives/collective-service"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: collectiveId } = await params

    const collective = await getCollective(collectiveId)

    if (!collective) {
      return NextResponse.json({ error: "Collective not found" }, { status: 404 })
    }

    const movies = await getCollectiveRatedMovies(collectiveId)

    return NextResponse.json({
      collectiveId,
      collectiveName: collective.name,
      movies: movies.map((m: any) => ({
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path,
        release_date: m.release_date,
        avg_score: Number(m.avg_score),
        rating_count: Number(m.rating_count),
      })),
    })
  } catch (error) {
    console.error("Error fetching collective movies:", error)
    return NextResponse.json({ error: "Failed to fetch collective movies" }, { status: 500 })
  }
}
