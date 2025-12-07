"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Star, Clock, Calendar, Globe, Play, X, DollarSign, Users, Film, Clapperboard } from "lucide-react"
import { useUser, useStackApp } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { SimpleStarRating } from "@/components/simple-star-rating"
import { getImageUrl } from "@/lib/tmdb/image"
import { Header } from "@/components/header"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text.substring(0, 100))
  }
  return res.json()
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount}`
}

export default function MovieDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const user = useUser()
  const app = useStackApp()
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)

  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(`/api/movies/tmdb/${id}`, fetcher)

  const { data: ratingData } = useSWR(user ? `/api/ratings?tmdbId=${id}` : null, fetcher)

  useEffect(() => {
    if (ratingData?.userRating) {
      setUserRating(ratingData.userRating.score || 0)
      setUserComment(ratingData.userRating.userComment || "")
    }
  }, [ratingData])

  const handleSaveRating = async () => {
    if (!user) {
      app.redirectToSignIn()
      return
    }
    if (userRating === 0) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: Number(id),
          score: userRating,
          comment: userComment,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      setSaveMessage("Saved")
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading film...</p>
          </div>
        </div>
      </div>
    )
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6">
          <p className="text-muted-foreground">Film not found</p>
          <Button asChild variant="outline" className="gap-2 bg-transparent">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to browse
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const posterUrl = getImageUrl(movie.posterPath, "w500")
  const backdropUrl = getImageUrl(movie.backdropPath, "original")
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  const genres = movie.genres || []

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <Header />

      {/* Fixed backdrop container */}
      <div className="absolute inset-x-0 top-16 h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
        {movie.clip ? (
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${movie.clip.key}?autoplay=1&mute=1&loop=1&playlist=${movie.clip.key}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] sm:w-[200%] sm:h-[200%] lg:w-[150%] lg:h-[150%] pointer-events-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : backdropUrl ? (
          <Image src={backdropUrl || "/placeholder.svg"} alt="" fill className="object-cover" priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      {showTrailer && movie.trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-5xl aspect-video">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setShowTrailer(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer.key}?autoplay=1`}
              className="w-full h-full rounded-lg"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Back button below header */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-12 lg:pt-20">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground mb-2 sm:mb-8"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 sm:pb-16">
          <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 lg:gap-12">
            {/* Poster */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <div className="relative aspect-[2/3] w-[160px] sm:w-[200px] lg:w-full overflow-hidden rounded-xl bg-card ring-1 ring-border/50 shadow-2xl">
                {posterUrl ? (
                  <Image
                    src={posterUrl || "/placeholder.svg"}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground/50">No poster</span>
                  </div>
                )}
              </div>
              {movie.trailer && (
                <Button
                  onClick={() => setShowTrailer(true)}
                  className="w-[160px] sm:w-[200px] lg:w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch Trailer
                </Button>
              )}
            </div>

            {/* Details */}
            <div className="space-y-5 sm:space-y-6 min-w-0">
              {/* Title & Tagline */}
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-foreground text-balance text-center lg:text-left">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-xs sm:text-sm italic text-muted-foreground text-center lg:text-left line-clamp-2">
                    "{movie.tagline}"
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs text-muted-foreground">
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {year}
                  </span>
                )}
                {movie.runtimeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    {movie.runtimeMinutes}m
                  </span>
                )}
                {movie.tmdbVoteAverage > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-accent text-accent" />
                    {movie.tmdbVoteAverage.toFixed(1)}
                  </span>
                )}
                {movie.originalLanguage && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    {movie.originalLanguage.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
                  {genres.map((genre: { id: number; name: string }) => (
                    <Badge
                      key={genre.id}
                      variant="secondary"
                      className="bg-card text-foreground font-medium ring-1 ring-border/50 text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Synopsis
                  </h2>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 text-center lg:text-left line-clamp-4 sm:line-clamp-none">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Crew */}
              {(movie.director || movie.writers?.length > 0 || movie.cinematographer || movie.composer) && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Crew
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    {movie.director && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Director</p>
                        <p className="font-medium text-foreground truncate">{movie.director.name}</p>
                      </div>
                    )}
                    {movie.writers?.length > 0 && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Writer</p>
                        <p className="font-medium text-foreground truncate">{movie.writers[0].name}</p>
                      </div>
                    )}
                    {movie.cinematographer && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Cinematography</p>
                        <p className="font-medium text-foreground truncate">{movie.cinematographer.name}</p>
                      </div>
                    )}
                    {movie.composer && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Music</p>
                        <p className="font-medium text-foreground truncate">{movie.composer.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cast */}
              {movie.cast?.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Cast
                  </h2>
                  <div className="relative -mx-4 sm:mx-0">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
                      {movie.cast
                        .slice(0, 10)
                        .map((actor: { id: number; name: string; character: string; profilePath: string | null }) => (
                          <div key={actor.id} className="flex-shrink-0 w-14 sm:w-20 text-center">
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2 rounded-full overflow-hidden bg-card ring-1 ring-border/50">
                              {actor.profilePath ? (
                                <Image
                                  src={getImageUrl(actor.profilePath, "w185") || ""}
                                  alt={actor.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">{actor.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{actor.character}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Details Stats */}
              {(movie.budget > 0 || movie.revenue > 0 || movie.status) && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    {movie.status && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                          <Film className="h-3 w-3" /> Status
                        </p>
                        <p className="font-medium text-foreground">{movie.status}</p>
                      </div>
                    )}
                    {movie.budget > 0 && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                          <DollarSign className="h-3 w-3" /> Budget
                        </p>
                        <p className="font-medium text-foreground">{formatCurrency(movie.budget)}</p>
                      </div>
                    )}
                    {movie.revenue > 0 && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                          <DollarSign className="h-3 w-3" /> Revenue
                        </p>
                        <p className="font-medium text-foreground">{formatCurrency(movie.revenue)}</p>
                      </div>
                    )}
                    {movie.productionCompanies?.length > 0 && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                          <Clapperboard className="h-3 w-3" /> Studio
                        </p>
                        <p className="font-medium text-foreground truncate">{movie.productionCompanies[0].name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rating Section */}
              <div className="space-y-3 sm:space-y-4 rounded-xl bg-card p-3 sm:p-6 ring-1 ring-border/50">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Your Rating
                  </h2>
                  {!user && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => app.redirectToSignIn()}
                      className="text-accent p-0 h-auto text-[10px] sm:text-xs"
                    >
                      Sign in to rate
                    </Button>
                  )}
                </div>

                <SimpleStarRating value={userRating} onChange={setUserRating} disabled={isSaving} />

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Your thoughts on this film..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="min-h-[60px] sm:min-h-[100px] resize-none bg-background border-border text-xs sm:text-sm"
                  />
                </div>

                {/* Save */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleSaveRating}
                    disabled={userRating === 0 || isSaving}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {!user ? "Sign in to Save" : isSaving ? "Saving..." : "Save Rating"}
                  </Button>
                  {saveMessage && (
                    <span
                      className={`text-xs text-center sm:text-left ${saveMessage === "Saved" ? "text-accent" : "text-destructive"}`}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
