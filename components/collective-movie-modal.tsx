"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Star, Film, ExternalLink, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/tmdb/image"

type MovieRating = {
  user_id: string
  user_name: string | null
  user_avatar: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
}

type MovieData = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
}

type Props = {
  movie: MovieData | null
  collectiveId: string
  onClose: () => void
}

export function CollectiveMovieModal({ movie, collectiveId, onClose }: Props) {
  const [ratings, setRatings] = useState<MovieRating[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (movie) {
      setLoading(true)
      fetch(`/api/collectives/${collectiveId}/movie/${movie.tmdb_id}`)
        .then((res) => res.json())
        .then((data) => {
          setRatings(data.ratings || [])
        })
        .catch((err) => {
          console.error("Error fetching movie ratings:", err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [movie, collectiveId])

  if (!movie) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Movie header */}
        <div className="flex gap-4 p-6 border-b border-border">
          {/* Poster */}
          <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-muted">
            {movie.poster_path ? (
              <img
                src={getImageUrl(movie.poster_path, "w185") || "/placeholder.svg"}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Film className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground line-clamp-2">{movie.title}</h2>
            {movie.release_date && (
              <p className="text-sm text-muted-foreground mt-1">{new Date(movie.release_date).getFullYear()}</p>
            )}

            {/* Collective average */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-bold text-accent">{(Number(movie.avg_score) / 20).toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Collective Avg ({movie.rating_count} {movie.rating_count === 1 ? "rating" : "ratings"})
              </span>
            </div>
          </div>
        </div>

        {/* Ratings list */}
        <div className="p-6 overflow-y-auto max-h-[45vh]">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Member Ratings</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ratings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ratings yet</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.user_id} className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
                  {/* User avatar */}
                  {rating.user_avatar ? (
                    <img
                      src={rating.user_avatar || "/placeholder.svg"}
                      alt={rating.user_name || "User"}
                      className="h-10 w-10 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 shrink-0">
                      <UserIcon className="h-5 w-5 text-accent" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{rating.user_name || "Anonymous"}</span>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 shrink-0">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-xs font-bold text-accent">{(rating.overall_score / 20).toFixed(1)}</span>
                      </div>
                    </div>
                    {rating.user_comment && (
                      <p className="text-sm text-muted-foreground mt-1">"{rating.user_comment}"</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(rating.rated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link href={`/movies/${movie.tmdb_id}`} onClick={onClose}>
            <Button className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              View Movie Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
