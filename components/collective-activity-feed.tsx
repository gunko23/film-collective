"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, Film, Tv, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/tmdb/image"

type Rating = {
  user_id: string
  user_name: string | null
  user_avatar: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
  tmdb_id: string
  title: string
  poster_path: string | null
  media_type?: string
  episode_name?: string
  episode_number?: number
  season_number?: number
  tv_show_name?: string
  tv_show_id?: number
}

type Props = {
  ratings: Rating[]
  onMovieClick?: (tmdbId: string) => void
}

const ITEMS_PER_PAGE = 10

export function CollectiveActivityFeed({ ratings, onMovieClick }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(ratings.length / ITEMS_PER_PAGE)
  const paginatedRatings = ratings.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

  if (ratings.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
        <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No recent activity yet</p>
      </div>
    )
  }

  const getMediaLink = (rating: Rating) => {
    if (rating.media_type === "episode" && rating.tv_show_id) {
      return `/tv/${rating.tv_show_id}/season/${rating.season_number}`
    }
    if (rating.media_type === "tv") {
      return `/tv/${rating.tmdb_id}`
    }
    return `/movies/${rating.tmdb_id}`
  }

  const getMediaTitle = (rating: Rating) => {
    if (rating.media_type === "episode") {
      return `${rating.tv_show_name} S${rating.season_number}E${rating.episode_number}: ${rating.episode_name || rating.title}`
    }
    return rating.title
  }

  const getMediaIcon = (rating: Rating) => {
    if (rating.media_type === "tv" || rating.media_type === "episode") {
      return <Tv className="h-3 w-3" />
    }
    return <Film className="h-3 w-3" />
  }

  return (
    <div>
      <div className="space-y-4">
        {paginatedRatings.map((rating, idx) => (
          <div
            key={`${rating.user_id}-${rating.tmdb_id}-${rating.media_type}-${idx}`}
            className="p-4 rounded-xl bg-card/50 border border-border/50"
          >
            {/* Top row: Poster and Rating */}
            <div className="flex gap-4">
              {/* Poster */}
              <Link href={getMediaLink(rating)} className="shrink-0 hover:opacity-80 transition-opacity">
                <div className="w-16 sm:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                  {rating.poster_path ? (
                    <img
                      src={getImageUrl(rating.poster_path, "w154") || "/placeholder.svg"}
                      alt={rating.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">{getMediaIcon(rating)}</div>
                  )}
                </div>
              </Link>

              {/* Rating and User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                    <span className="text-lg font-bold text-accent">
                      {(Number(rating.overall_score) / 20).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getMediaIcon(rating)}
                    <span className="capitalize">{rating.media_type || "movie"}</span>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2 mb-2">
                  {rating.user_avatar ? (
                    <img
                      src={rating.user_avatar || "/placeholder.svg"}
                      alt={rating.user_name || "User"}
                      className="h-6 w-6 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 shrink-0">
                      <span className="text-xs font-semibold text-accent">
                        {(rating.user_name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground truncate">{rating.user_name || "Someone"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(rating.rated_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <Link href={getMediaLink(rating)} className="block">
                  <p className="text-sm font-medium text-foreground hover:text-accent transition-colors line-clamp-2">
                    {getMediaTitle(rating)}
                  </p>
                </Link>
              </div>
            </div>

            {/* Comment if exists */}
            {rating.user_comment && (
              <p className="text-sm text-muted-foreground mt-3 pl-20 sm:pl-24 italic line-clamp-2">
                "{rating.user_comment}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
