import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getDashboardData } from "@/lib/user/dashboard-service"

export async function GET() {
  try {
    const { user } = await getSafeUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await getDashboardData(user.id)

    return NextResponse.json({
      user: data.userProfile[0]
        ? {
            id: data.userProfile[0].id,
            name: data.userProfile[0].name || data.userProfile[0].email?.split("@")[0] || "User",
            email: data.userProfile[0].email,
            avatarUrl: data.userProfile[0].avatar_url,
            memberSince: data.userProfile[0].created_at,
          }
        : null,
      collectives: data.collectives,
      stats: data.userStats[0] || { movies_rated: 0, shows_rated: 0, collective_count: 0 },
      recentActivity: data.recentActivity,
      insights: {
        avgRating: data.avgRating[0]?.avg_score || 0,
        topGenres: data.topGenres.map((g: Record<string, unknown>) => ({ genre: g.genre, count: g.count })),
        favoriteDecade: data.favoriteDecade[0]?.decade || null,
        highestRated: data.highestRated[0] || null,
        ratingActivity: data.ratingActivity[0] || { this_month: 0, last_month: 0 },
      },
      favorites: data.favorites,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
