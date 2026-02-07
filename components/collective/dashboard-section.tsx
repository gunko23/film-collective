"use client"

import type React from "react"
import Link from "next/link"
import { Film, Tv, Clapperboard, Star, Activity } from "lucide-react"
import { CollectiveMoviesGrid } from "@/components/collective-movies-grid"
import { getImageUrl } from "@/lib/tmdb/image"
import { DashboardActivityItem, type Activity as ActivityType } from "@/components/dashboard/dashboard-activity-item"

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
  genres?: any
}

type TVShowStat = {
  tv_show_id: number
  name: string | null
  poster_path: string | null
  first_air_date: string | null
  avg_score: number
  rating_count: number
}

type EpisodeStat = {
  episode_id: number
  episode_name: string
  episode_number: number
  season_number: number
  still_path: string | null
  tv_show_id: number
  tv_show_name: string
  tv_show_poster: string | null
  avg_score: number
  rating_count: number
}

type DashboardSectionProps = {
  movieStats: MovieStat[]
  tvShowStats: TVShowStat[]
  episodeStats: EpisodeStat[]
  collectiveId: string
  onMovieClick: (movie: MovieStat) => void
  onTVShowClick: (show: TVShowStat) => void
  recentActivity: ActivityType[]
  activityLoading: boolean
  onViewAllFeed: () => void
}

export function DashboardSection({
  movieStats,
  tvShowStats,
  episodeStats,
  collectiveId,
  onMovieClick,
  onTVShowClick,
  recentActivity,
  activityLoading,
  onViewAllFeed,
}: DashboardSectionProps) {
  return (
    <div className="space-y-8">
      {/* Top Rated Movies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Film className="h-5 w-5 text-accent" />
            Top Movies
          </h2>
          {movieStats.length > 10 && (
            <Link href={`/collectives/${collectiveId}/movies`} className="text-sm text-accent hover:underline">
              View All ({movieStats.length})
            </Link>
          )}
        </div>
        <CollectiveMoviesGrid movies={movieStats.slice(0, 10)} onMovieClick={onMovieClick} />
      </div>

      {/* Top Rated TV Shows */}
      {tvShowStats.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Tv className="h-5 w-5 text-accent" />
              Top TV Shows
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tvShowStats.slice(0, 10).map((show, idx) => (
              <button
                key={show.tv_show_id}
                onClick={() => onTVShowClick(show)}
                className="group relative rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300">
                  {show.poster_path ? (
                    <img
                      src={getImageUrl(show.poster_path, "w342") || "/placeholder.svg"}
                      alt={show.name || "TV Show"}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Tv className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Rating badge - top right like movies */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                    <span className="text-xs font-bold">{(Number(show.avg_score) / 20).toFixed(1)}</span>
                  </div>
                  {/* Rating count badge - bottom left like movies */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground">
                      {show.rating_count} {Number(show.rating_count) === 1 ? "rating" : "ratings"}
                    </span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-background/90 text-sm font-medium">
                      View Ratings
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {show.first_air_date ? new Date(show.first_air_date).getFullYear() : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Rated Episodes */}
      {episodeStats.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-accent" />
              Top Episodes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {episodeStats.slice(0, 10).map((episode, idx) => (
              <Link
                key={episode.episode_id}
                href={`/tv/${episode.tv_show_id}/season/${episode.season_number}`}
                className="block p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/50 transition-all"
              >
                {/* Top row: Rank + Image + Rating */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-accent-foreground">{idx + 1}</span>
                  </div>
                  {/* Still/Poster */}
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, "w185") || "/placeholder.svg"}
                        alt={episode.episode_name}
                        className="w-full h-full object-cover"
                      />
                    ) : episode.tv_show_poster ? (
                      <img
                        src={getImageUrl(episode.tv_show_poster, "w92") || "/placeholder.svg"}
                        alt={episode.tv_show_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  {/* Rating */}
                  <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
                    <Star className="h-4 w-4 text-accent fill-accent" />
                    <span className="text-sm font-bold text-accent">
                      {(Number(episode.avg_score) / 20).toFixed(1)}
                    </span>
                  </div>
                </div>
                {/* Bottom row: Title and details */}
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{episode.episode_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {episode.tv_show_name} &bull; S{episode.season_number}E{episode.episode_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {episode.rating_count} {Number(episode.rating_count) === 1 ? "rating" : "ratings"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {movieStats.length === 0 && tvShowStats.length === 0 && episodeStats.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
          <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No ratings yet. Start rating movies and TV shows!</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Recent Activity
          </h2>
          <button onClick={onViewAllFeed} className="text-sm text-accent hover:underline">
            View All
          </button>
        </div>

        {activityLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-card/30 border border-border/50">
            <Film className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div>
            {recentActivity.map((activity, i) => (
              <DashboardActivityItem
                key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                activity={activity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
