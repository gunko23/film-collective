import { NextResponse } from "next/server"
import { getUserProfile } from "@/lib/db/user-service"

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    const profile = await getUserProfile(userId)

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: profile.user.id,
        name: profile.user.name || profile.user.email?.split("@")[0] || "Film Enthusiast",
        avatarUrl: profile.user.avatar_url,
        memberSince: profile.user.created_at,
      },
      favorites: profile.favorites,
      stats: {
        moviesRated: profile.movieStats[0]?.count || 0,
        avgMovieScore: profile.movieStats[0]?.avg_score || 0,
        showsRated: profile.tvStats[0]?.count || 0,
        avgShowScore: profile.tvStats[0]?.avg_score || 0,
        collectiveCount: profile.collectiveCount[0]?.count || 0,
      },
      topGenres: profile.topGenres.map((g: Record<string, unknown>) => g.genre),
      recentRatings: profile.recentRatings,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
