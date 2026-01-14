"use client"

import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Film, Tv, Star, Users, Calendar, Heart, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type ProfileData = {
  user: {
    id: string
    name: string
    avatarUrl: string | null
    memberSince: string
  }
  favorites: {
    tmdb_id: number
    title: string
    poster_path: string | null
    position: number
  }[]
  stats: {
    moviesRated: number
    avgMovieScore: number
    showsRated: number
    avgShowScore: number
    collectiveCount: number
  }
  topGenres: string[]
  recentRatings: {
    overall_score: number
    rated_at: string
    tmdb_id: number
    title: string
    poster_path: string | null
    media_type: string
  }[]
}

export function PublicUserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useSWR<ProfileData>(`/api/user/${userId}/profile`, fetcher)

  if (isLoading) {
    return (
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-2xl bg-zinc-800" />
              <div className="space-y-3">
                <div className="h-8 w-48 bg-zinc-800 rounded" />
                <div className="h-4 w-32 bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </main>
    )
  }

  const { user, favorites, stats, topGenres, recentRatings } = data

  return (
    <main className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-emerald-500/20">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-3xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Member since{" "}
                {new Date(user.memberSince).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Favorite movies */}
        {favorites.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-foreground">Favorite Films</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((position) => {
                const fav = favorites.find((f) => f.position === position)
                return (
                  <div key={position} className="relative">
                    {fav ? (
                      <Link href={`/movies/${fav.tmdb_id}`} className="group">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-zinc-700/50 group-hover:ring-emerald-500/50 transition-all">
                          {fav.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w342${fav.poster_path}`}
                              alt={fav.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Film className="h-8 w-8 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground truncate group-hover:text-emerald-400 transition-colors">
                          {fav.title}
                        </p>
                      </Link>
                    ) : (
                      <div className="aspect-[2/3] rounded-xl bg-zinc-800/50 border border-dashed border-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-600 text-sm">#{position}</span>
                      </div>
                    )}
                    <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                      {position}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Film className="h-4 w-4 text-amber-500" />
              <span className="text-xs">Movies</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.moviesRated}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Tv className="h-4 w-4 text-emerald-500" />
              <span className="text-xs">TV Shows</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.showsRated}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-xs">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.moviesRated > 0 ? (stats.avgMovieScore / 20).toFixed(1) : "-"}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="text-xs">Collectives</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.collectiveCount}</p>
          </div>
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h3 className="font-medium text-foreground">Top Genres</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent ratings */}
        {recentRatings.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">Recent Ratings</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {recentRatings.map((rating) => (
                <Link
                  key={`${rating.media_type}-${rating.tmdb_id}`}
                  href={`/movies/${rating.tmdb_id}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 ring-1 ring-zinc-700/50 group-hover:ring-emerald-500/50 transition-all">
                    {rating.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${rating.poster_path}`}
                        alt={rating.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Film className="h-6 w-6 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-xs">
                      <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                      <span className="text-white">{(rating.overall_score / 20).toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
