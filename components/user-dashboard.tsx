"use client"

import type React from "react"

import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Film,
  Tv,
  Users,
  Star,
  MessageCircle,
  Heart,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Sparkles,
  Calendar,
  Award,
  Flame,
  Target,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow, format } from "date-fns"
import { FavoriteMoviesPicker } from "@/components/favorite-movies-picker"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const REACTION_EMOJI_MAP: Record<string, string> = {
  fire: "🔥",
  heart: "❤️",
  laughing: "😂",
  crying: "😢",
  mindblown: "🤯",
  clap: "👏",
  thinking: "🤔",
  angry: "😡",
  love: "😍",
  thumbsup: "👍",
}

type Activity = {
  activity_type: "rating" | "comment" | "reaction"
  activity_id: string
  created_at: string
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  tmdb_id: number
  media_title: string
  poster_path: string | null
  media_type: "movie" | "tv"
  score: number | null
  content: string | null
  reaction_type: string | null
  collective_id: string
  collective_name: string
  rating_id: string
  target_user_name: string | null
}

type DashboardData = {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    memberSince: string
  } | null
  collectives: {
    id: string
    name: string
    description: string | null
    role: string
    member_count: number
  }[]
  stats: {
    movies_rated: number
    shows_rated: number
    collective_count: number
  }
  recentActivity: Activity[]
  insights: {
    avgRating: number
    topGenres: { genre: string; count: number }[]
    favoriteDecade: number | null
    highestRated: {
      tmdb_id: number
      title: string
      poster_path: string | null
      overall_score: number
    } | null
    ratingActivity: {
      this_month: number
      last_month: number
    }
  }
  favorites: {
    tmdb_id: number
    title: string
    poster_path: string | null
    position: number
  }[]
}

function ActivityItem({ activity }: { activity: Activity }) {
  const router = useRouter()

  const getActivityDescription = () => {
    switch (activity.activity_type) {
      case "rating":
        return (
          <span>
            rated <span className="font-medium text-foreground">{activity.media_title}</span>
            {activity.score && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {(activity.score / 20).toFixed(1)}
              </span>
            )}
          </span>
        )
      case "comment":
        return (
          <span>
            commented on{" "}
            {activity.target_user_name && (
              <span className="font-medium text-foreground">{activity.target_user_name}&apos;s</span>
            )}{" "}
            review of <span className="font-medium text-foreground">{activity.media_title}</span>
          </span>
        )
      case "reaction":
        return (
          <span>
            reacted {REACTION_EMOJI_MAP[activity.reaction_type || ""] || activity.reaction_type} to{" "}
            {activity.target_user_name && (
              <span className="font-medium text-foreground">{activity.target_user_name}&apos;s</span>
            )}{" "}
            review of <span className="font-medium text-foreground">{activity.media_title}</span>
          </span>
        )
      default:
        return null
    }
  }

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "rating":
        return <Star className="h-3.5 w-3.5 text-amber-500" />
      case "comment":
        return <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
      case "reaction":
        return <Heart className="h-3.5 w-3.5 text-pink-500" />
      default:
        return null
    }
  }

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/user/${activity.actor_id}`)
  }

  return (
    <Link
      href={`/collectives/${activity.collective_id}/movie/${activity.tmdb_id}/conversation`}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors"
    >
      <div onClick={handleUserClick} className="cursor-pointer">
        <Avatar className="h-9 w-9 ring-2 ring-zinc-800 hover:ring-emerald-500/50 transition-all">
          <AvatarImage src={activity.actor_avatar || undefined} />
          <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
            {activity.actor_name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <span
            onClick={handleUserClick}
            className="font-medium text-foreground hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {activity.actor_name}
          </span>
          {getActivityIcon()}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{getActivityDescription()}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">
            {activity.collective_name}
          </span>
          <span className="text-[10px] text-zinc-500">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {activity.poster_path && (
        <div className="relative h-14 w-10 rounded overflow-hidden flex-shrink-0 ring-1 ring-zinc-700/50">
          <Image
            src={`https://image.tmdb.org/t/p/w92${activity.poster_path}`}
            alt={activity.media_title}
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  )
}

export function UserDashboard() {
  const { data, isLoading } = useSWR<DashboardData>("/api/user/dashboard", fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="h-48 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-zinc-800/50 rounded-2xl animate-pulse" />
            <div className="h-96 bg-zinc-800/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const { user, collectives = [], stats, recentActivity = [], insights, favorites = [] } = data || {}

  // Calculate activity trend
  const activityTrend =
    insights?.ratingActivity?.last_month > 0
      ? Math.round(
          ((insights.ratingActivity.this_month - insights.ratingActivity.last_month) /
            insights.ratingActivity.last_month) *
            100,
        )
      : insights?.ratingActivity?.this_month > 0
        ? 100
        : 0

  const totalRatings = (stats?.movies_rated || 0) + (stats?.shows_rated || 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500" />
              <Avatar className="relative h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-zinc-900 shadow-2xl">
                <AvatarImage src={user?.avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-3xl sm:text-4xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full ring-4 ring-zinc-900" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{user?.name || "User"}</h1>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-xs"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                </Link>
              </div>

              {user?.memberSince && (
                <p className="text-sm text-zinc-400 mt-1.5">
                  Member since {format(new Date(user.memberSince), "MMMM yyyy")}
                </p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <Film className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stats?.movies_rated || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Movies</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <Tv className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stats?.shows_rated || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Shows</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/20">
                    <Users className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stats?.collective_count || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Collectives</p>
                  </div>
                </div>
                {insights?.avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                      <Star className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{(insights.avgRating / 20).toFixed(1)}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Rating</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights?.topGenres && insights.topGenres.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent border border-pink-500/20 p-5 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-pink-500/20">
                    <Target className="h-5 w-5 text-pink-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Top Genre</span>
                </div>
                <p className="text-3xl font-bold text-white">{insights.topGenres[0].genre}</p>
                <p className="text-sm text-zinc-400 mt-1">{insights.topGenres[0].count} films rated</p>
              </div>
            </div>
          )}

          {insights?.favoriteDecade && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 p-5 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20">
                    <Calendar className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">Favorite Era</span>
                </div>
                <p className="text-3xl font-bold text-white">{insights.favoriteDecade}s</p>
                <p className="text-sm text-zinc-400 mt-1">Most watched decade</p>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-5 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
                <span className="text-sm font-medium text-zinc-300">This Month</span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-white">{insights?.ratingActivity?.this_month || 0}</p>
                {activityTrend !== 0 && (
                  <span
                    className={`text-sm font-semibold mb-1 px-2 py-0.5 rounded-full ${activityTrend > 0 ? "text-emerald-400 bg-emerald-500/20" : "text-red-400 bg-red-500/20"}`}
                  >
                    {activityTrend > 0 ? "+" : ""}
                    {activityTrend}%
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1">ratings this month</p>
            </div>
          </div>
        </div>

        <FavoriteMoviesPicker />

        {insights?.highestRated && (
          <Link
            href={`/movies/${insights.highestRated.tmdb_id}`}
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 hover:border-amber-500/40 transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="relative flex items-center gap-5">
              <div className="relative h-24 w-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10">
                {insights.highestRated.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w154${insights.highestRated.poster_path}`}
                    alt={insights.highestRated.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-zinc-800">
                    <Film className="h-6 w-6 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <Award className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    Your Highest Rated
                  </span>
                </div>
                <p className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {insights.highestRated.title}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="text-lg text-amber-400 font-bold">
                    {(insights.highestRated.overall_score / 20).toFixed(1)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Collective Activity</h2>
                  <p className="text-xs text-zinc-500">Last 60 days</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm font-medium">No recent activity</p>
                  <p className="text-xs text-zinc-600 mt-1">Invite friends to see their activity here</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <ActivityItem key={`${activity.activity_type}-${activity.activity_id}`} activity={activity} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Users className="h-5 w-5 text-violet-500" />
                </div>
                <h2 className="font-semibold text-white">Your Collectives</h2>
              </div>
              <Link href="/collectives">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-white">
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-zinc-800/50">
              {collectives.length === 0 ? (
                <div className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm font-medium">No collectives yet</p>
                  <Link href="/collectives">
                    <Button size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Create or Join
                    </Button>
                  </Link>
                </div>
              ) : (
                collectives.slice(0, 5).map((collective) => (
                  <Link
                    key={collective.id}
                    href={`/collectives/${collective.id}`}
                    className="flex items-center gap-3 p-3 sm:p-4 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center ring-1 ring-emerald-500/20">
                      <Users className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                        {collective.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {collective.member_count} member{collective.member_count !== 1 ? "s" : ""}
                        {collective.role === "owner" && <span className="ml-1.5 text-amber-500">• Owner</span>}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </Link>
                ))
              )}
            </div>

            {collectives.length > 0 && (
              <div className="p-3 border-t border-zinc-800/50">
                <Link href="/collectives">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-zinc-700 hover:bg-zinc-800 bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create New Collective
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
