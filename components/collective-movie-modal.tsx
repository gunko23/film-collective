"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Star, Film, ExternalLink, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { InlineBreakdownFlow } from "@/components/inline-breakdown-flow"
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
  const [userRating, setUserRating] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [hasExistingRating, setHasExistingRating] = useState(false)
  const [showBreakdownFlow, setShowBreakdownFlow] = useState(false)
  const [existingBreakdown, setExistingBreakdown] = useState<
    | {
        emotional_impact?: number
        pacing?: number
        aesthetic?: number
        rewatchability?: number
        breakdown_tags?: string[]
      }
    | undefined
  >(undefined)
  const [ratingSaved, setRatingSaved] = useState(false)

  useEffect(() => {
    if (movie) {
      setRatings([])
      setUserRating(0)
      setHasExistingRating(false)
      setShowBreakdownFlow(false)
      setExistingBreakdown(undefined)
      setRatingSaved(false)
      setLoading(true)

      Promise.all([
        fetch(`/api/collectives/${collectiveId}/movie/${movie.tmdb_id}`).then((res) => res.json()),
        fetch(`/api/ratings?tmdbId=${movie.tmdb_id}`).then((res) => res.json()),
      ])
        .then(([collectiveData, userRatingData]) => {
          setRatings(collectiveData.ratings || [])
          if (userRatingData.userRating) {
            setUserRating(userRatingData.userRating.score)
            setHasExistingRating(true)
            setExistingBreakdown({
              emotional_impact: userRatingData.userRating.emotional_impact,
              pacing: userRatingData.userRating.pacing,
              aesthetic: userRatingData.userRating.aesthetic,
              rewatchability: userRatingData.userRating.rewatchability,
              breakdown_tags: userRatingData.userRating.breakdown_tags,
            })
          }
        })
        .catch((err) => {
          console.error("Error fetching movie data:", err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [movie, collectiveId])

  const handleSaveRating = async () => {
    if (!movie || userRating === 0) return

    setSaving(true)
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: Number.parseInt(movie.tmdb_id),
          score: userRating,
        }),
      })

      if (!response.ok) throw new Error("Failed to save rating")

      // Refresh the collective ratings list
      const collectiveData = await fetch(`/api/collectives/${collectiveId}/movie/${movie.tmdb_id}`).then((res) =>
        res.json(),
      )
      setRatings(collectiveData.ratings || [])
      setHasExistingRating(true)
      setRatingSaved(true)
      setShowBreakdownFlow(true)
    } catch (error) {
      console.error("Error saving rating:", error)
      alert("Failed to save rating. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleBreakdownComplete = async () => {
    setShowBreakdownFlow(false)
    // Refresh ratings to show updated breakdown
    if (movie) {
      const collectiveData = await fetch(`/api/collectives/${collectiveId}/movie/${movie.tmdb_id}`).then((res) =>
        res.json(),
      )
      setRatings(collectiveData.ratings || [])
    }
  }

  if (!movie) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Movie header */}
        <div className="flex gap-4 p-6 border-b border-border shrink-0">
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

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Your rating section */}
          <div className="p-6 border-b border-border bg-background/30">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {hasExistingRating ? "Your Rating" : "Rate This Movie"}
            </h3>

            {!showBreakdownFlow ? (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <StarRating rating={userRating} onRatingChange={setUserRating} size="lg" />
                  {userRating > 0 && <span className="text-lg font-bold text-accent">{userRating.toFixed(1)}</span>}
                </div>
                <Button onClick={handleSaveRating} disabled={userRating === 0 || saving} className="w-full" size="sm">
                  {saving ? "Saving..." : hasExistingRating ? "Update Rating" : "Save Rating"}
                </Button>

                {/* Show "Add Breakdown" button if rating exists but no breakdown flow active */}
                {hasExistingRating && !ratingSaved && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBreakdownFlow(true)}
                    className="w-full mt-2 bg-transparent"
                    size="sm"
                  >
                    {existingBreakdown?.emotional_impact ? "Edit Breakdown" : "Add Breakdown"}
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Show saved rating */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                    <span className="text-lg font-bold text-accent">{userRating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-green-500">Rating saved!</span>
                </div>
              </>
            )}

            <InlineBreakdownFlow
              isActive={showBreakdownFlow}
              mediaType="movie"
              tmdbId={Number.parseInt(movie.tmdb_id)}
              onComplete={handleBreakdownComplete}
              existingBreakdown={existingBreakdown}
            />
          </div>

          {/* Ratings list */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Member Ratings
            </h3>

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
                          <span className="text-xs font-bold text-accent">
                            {(rating.overall_score / 20).toFixed(1)}
                          </span>
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <Link href={`/movies/${movie.tmdb_id}`} onClick={onClose}>
            <Button variant="outline" className="w-full gap-2 bg-transparent">
              <ExternalLink className="h-4 w-4" />
              View Full Movie Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
