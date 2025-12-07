"use client"

import { Film, Star, TrendingUp, Users, Calendar } from "lucide-react"

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

type Props = {
  analytics: Analytics
  genreStats: GenreStat[]
  decadeStats: DecadeStat[]
}

export function CollectiveAnalytics({ analytics, genreStats, decadeStats }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Film className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Movies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.total_movies_rated}</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Star className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Ratings</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.total_ratings}</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-accent">
            {analytics.avg_collective_score ? (Number(analytics.avg_collective_score) / 20).toFixed(1) : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.active_raters}</p>
        </div>
      </div>

      {/* Genre & Decade stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Favorite Genres */}
        {genreStats.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" />
              Favorite Genres
            </h3>
            <div className="space-y-2">
              {genreStats.slice(0, 5).map((genre, idx) => (
                <div key={genre.genre_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                    <span className="text-sm text-foreground">{genre.genre_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{genre.movie_count} films</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      <span className="text-xs font-medium text-accent">
                        {(Number(genre.avg_score) / 20).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Decades */}
        {decadeStats.length > 0 && (
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Favorite Eras
            </h3>
            <div className="space-y-2">
              {decadeStats.map((decade, idx) => (
                <div key={decade.decade} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                    <span className="text-sm text-foreground">{decade.decade}s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{decade.movie_count} films</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      <span className="text-xs font-medium text-accent">
                        {(Number(decade.avg_score) / 20).toFixed(1)}
                      </span>
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
