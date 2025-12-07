"use client"

import { Film, Star, TrendingUp, Users, Calendar, BarChart3, Flame, Heart } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"

type GenreStat = {
  genre_name: string
  movie_count: number
  avg_score: number
}

type DecadeStat = {
  decade: number
  movie_count: number
  avg_score: number
}

type Analytics = {
  total_movies_rated: number
  total_ratings: number
  avg_collective_score: number
  active_raters: number
}

type RatingDistribution = {
  rating_bucket: number
  count: number
}

type MemberSimilarity = {
  user_id: string
  user_name: string
  tmdb_id: number
  overall_score: number
}

type MemberCompatibility = {
  userId: string
  name: string
  totalRatings: number
  compatibilities: { userId: string; name: string; similarity: number; sharedMovies: number }[]
  avgCompatibility: number
}

function processMemberCompatibilities(data: MemberSimilarity[]): MemberCompatibility[] {
  const userRatings = new Map<string, { name: string; ratings: Map<number, number> }>()

  data.forEach((row) => {
    if (!userRatings.has(row.user_id)) {
      userRatings.set(row.user_id, { name: row.user_name || "Unknown", ratings: new Map() })
    }
    userRatings.get(row.user_id)!.ratings.set(row.tmdb_id, row.overall_score)
  })

  const users = Array.from(userRatings.entries())
  const result: MemberCompatibility[] = []

  for (const [userId, userData] of users) {
    const compatibilities: MemberCompatibility["compatibilities"] = []

    for (const [otherUserId, otherUserData] of users) {
      if (userId === otherUserId) continue

      const sharedMovies: number[] = []
      userData.ratings.forEach((_, tmdbId) => {
        if (otherUserData.ratings.has(tmdbId)) {
          sharedMovies.push(tmdbId)
        }
      })

      if (sharedMovies.length === 0) {
        compatibilities.push({
          userId: otherUserId,
          name: otherUserData.name,
          similarity: -1,
          sharedMovies: 0,
        })
        continue
      }

      let sumDiff = 0
      sharedMovies.forEach((tmdbId) => {
        const diff = Math.abs(userData.ratings.get(tmdbId)! - otherUserData.ratings.get(tmdbId)!)
        sumDiff += diff
      })

      const avgDiff = sumDiff / sharedMovies.length
      const similarity = Math.max(0, 100 - avgDiff)

      compatibilities.push({
        userId: otherUserId,
        name: otherUserData.name,
        similarity,
        sharedMovies: sharedMovies.length,
      })
    }

    compatibilities.sort((a, b) => {
      if (a.similarity === -1 && b.similarity === -1) return b.sharedMovies - a.sharedMovies
      if (a.similarity === -1) return 1
      if (b.similarity === -1) return -1
      return b.similarity - a.similarity
    })

    const validCompatibilities = compatibilities.filter((c) => c.similarity >= 0)
    const avgCompatibility =
      validCompatibilities.length > 0
        ? validCompatibilities.reduce((sum, c) => sum + c.similarity, 0) / validCompatibilities.length
        : 0

    result.push({
      userId,
      name: userData.name,
      totalRatings: userData.ratings.size,
      compatibilities,
      avgCompatibility,
    })
  }

  result.sort((a, b) => b.avgCompatibility - a.avgCompatibility)

  return result
}

function getCompatibilityInfo(similarity: number): { color: string; bgColor: string; label: string } {
  if (similarity < 0) return { color: "text-muted-foreground", bgColor: "bg-muted/30", label: "No shared films" }
  if (similarity >= 85) return { color: "text-emerald-400", bgColor: "bg-emerald-500/20", label: "Film twins" }
  if (similarity >= 70) return { color: "text-emerald-400", bgColor: "bg-emerald-500/15", label: "Very similar" }
  if (similarity >= 55) return { color: "text-lime-400", bgColor: "bg-lime-500/15", label: "Good match" }
  if (similarity >= 40) return { color: "text-amber-400", bgColor: "bg-amber-500/15", label: "Some overlap" }
  if (similarity >= 25) return { color: "text-orange-400", bgColor: "bg-orange-500/15", label: "Different views" }
  return { color: "text-red-400", bgColor: "bg-red-500/15", label: "Opposite tastes" }
}

type Props = {
  analytics: Analytics
  genreStats: GenreStat[]
  decadeStats: DecadeStat[]
  ratingDistribution?: RatingDistribution[]
  memberSimilarity?: MemberSimilarity[]
  controversialMovies?: ControversialMovie[]
  unanimousFavorites?: ControversialMovie[]
}

type ControversialMovie = {
  tmdb_id: number
  title: string
  poster_path: string
  rating_count: number
  avg_score: number
  score_variance: number
  min_score: number
  max_score: number
}

export function CollectiveAnalytics({
  analytics,
  genreStats,
  decadeStats,
  ratingDistribution = [],
  memberSimilarity = [],
  controversialMovies = [],
  unanimousFavorites = [],
}: Props) {
  const memberCompatibilities = memberSimilarity.length > 0 ? processMemberCompatibilities(memberSimilarity) : []

  const maxDistCount = Math.max(...ratingDistribution.map((d) => Number(d.count)), 1)

  const fullDistribution = [0, 1, 2, 3, 4, 5].map((bucket) => {
    const found = ratingDistribution.find((d) => Number(d.rating_bucket) === bucket)
    return { bucket, count: found ? Number(found.count) : 0 }
  })

  const ratingLabels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5"]

  const maxGenreCount = Math.max(...genreStats.map((g) => Number(g.movie_count)), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Film className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Movies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.total_movies_rated}</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Star className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Ratings</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.total_ratings}</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-accent">
            {analytics.avg_collective_score ? (Number(analytics.avg_collective_score) / 20).toFixed(1) : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.active_raters}</p>
        </div>
      </div>

      {ratingDistribution.length > 0 && (
        <div className="p-5 rounded-xl bg-card/50 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Rating Distribution
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {fullDistribution.map((item, idx) => (
              <div key={item.bucket} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">{item.count}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-accent/80 to-accent transition-all duration-500"
                    style={{
                      height: `${Math.max((item.count / maxDistCount) * 100, 4)}px`,
                      minHeight: "4px",
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{ratingLabels[idx]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">Star Rating</p>
        </div>
      )}

      {memberCompatibilities.length > 1 && (
        <div className="p-5 rounded-xl bg-card/50 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            Taste Compatibility
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            See how your film tastes align with other collective members based on shared ratings
          </p>

          <div className="space-y-4">
            {memberCompatibilities.map((member) => (
              <div key={member.userId} className="p-4 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-accent">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.totalRatings} films rated</p>
                    </div>
                  </div>
                  {member.avgCompatibility > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Avg compatibility</p>
                      <p className={`text-lg font-bold ${getCompatibilityInfo(member.avgCompatibility).color}`}>
                        {member.avgCompatibility.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {member.compatibilities.map((compat) => {
                    const { color, bgColor, label } = getCompatibilityInfo(compat.similarity)
                    return (
                      <div
                        key={compat.userId}
                        className={`px-3 py-2 rounded-lg ${bgColor} border border-border/20 transition-all hover:scale-105`}
                        title={`${compat.sharedMovies} shared films`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{compat.name.split(" ")[0]}</span>
                          {compat.similarity >= 0 ? (
                            <span className={`text-sm font-bold ${color}`}>{compat.similarity.toFixed(0)}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                        <p className={`text-[10px] ${color} mt-0.5`}>{label}</p>
                        {compat.sharedMovies > 0 && (
                          <p className="text-[10px] text-muted-foreground">{compat.sharedMovies} shared</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Compatibility:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">85%+ Film twins</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-lime-500" />
              <span className="text-xs text-muted-foreground">55%+ Good match</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">40%+ Some overlap</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">&lt;25% Opposite</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {genreStats.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" />
              Favorite Genres
            </h3>
            <div className="space-y-3">
              {genreStats.slice(0, 5).map((genre, idx) => (
                <div key={genre.genre_name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{genre.genre_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{genre.movie_count} films</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-xs font-medium text-accent">
                          {(Number(genre.avg_score) / 20).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-700"
                      style={{ width: `${(Number(genre.movie_count) / maxGenreCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {decadeStats.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Favorite Eras
            </h3>
            <div className="space-y-3">
              {decadeStats.map((decade) => {
                const maxDecadeCount = Math.max(...decadeStats.map((d) => Number(d.movie_count)), 1)
                return (
                  <div key={decade.decade}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{decade.decade}s</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{decade.movie_count} films</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-xs font-medium text-accent">
                            {(Number(decade.avg_score) / 20).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-700"
                        style={{ width: `${(Number(decade.movie_count) / maxDecadeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {controversialMovies.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Most Divisive
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Movies with the biggest rating spread</p>
            <div className="space-y-3">
              {controversialMovies.map((movie) => (
                <div key={movie.tmdb_id} className="flex items-center gap-3">
                  <img
                    src={getImageUrl(movie.poster_path, "w92") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{movie.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{movie.rating_count} ratings</span>
                      <span>•</span>
                      <span className="text-red-400">{(Number(movie.min_score) / 20).toFixed(1)}</span>
                      <span>→</span>
                      <span className="text-emerald-400">{(Number(movie.max_score) / 20).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unanimousFavorites.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Collective Favorites
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Movies everyone agrees on</p>
            <div className="space-y-3">
              {unanimousFavorites.map((movie) => (
                <div key={movie.tmdb_id} className="flex items-center gap-3">
                  <img
                    src={getImageUrl(movie.poster_path, "w92") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{movie.title}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-accent font-medium">{(Number(movie.avg_score) / 20).toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{movie.rating_count} ratings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
