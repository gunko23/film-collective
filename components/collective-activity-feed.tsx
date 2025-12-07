"use client"

import { useState } from "react"
import { Star, Film, ChevronLeft, ChevronRight } from "lucide-react"
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
}

type Props = {
  ratings: Rating[]
  onMovieClick: (tmdbId: string) => void
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

  return (
    <div>
      <div className="space-y-3">
        {paginatedRatings.map((rating, idx) => (
          <div
            key={`${rating.user_id}-${rating.tmdb_id}-${idx}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50"
          >
            {/* User avatar */}
            {rating.user_avatar ? (
              <img
                src={rating.user_avatar || "/placeholder.svg"}
                alt={rating.user_name || "User"}
                className="h-10 w-10 rounded-full shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 shrink-0">
                <span className="text-sm font-semibold text-accent">
                  {(rating.user_name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Movie poster - clickable */}
            <button
              onClick={() => onMovieClick(rating.tmdb_id)}
              className="shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-18 rounded-lg overflow-hidden bg-muted">
                {rating.poster_path ? (
                  <img
                    src={getImageUrl(rating.poster_path, "w92") || "/placeholder.svg"}
                    alt={rating.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Film className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </button>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{rating.user_name || "Someone"}</span>
                {" rated "}
                <button
                  onClick={() => onMovieClick(rating.tmdb_id)}
                  className="font-medium hover:text-accent transition-colors"
                >
                  {rating.title}
                </button>
              </p>
              {rating.user_comment && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">"{rating.user_comment}"</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{new Date(rating.rated_at).toLocaleDateString()}</p>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 shrink-0">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-sm font-bold text-accent">{(Number(rating.overall_score) / 20).toFixed(1)}</span>
            </div>
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
