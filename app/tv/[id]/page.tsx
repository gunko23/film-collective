"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import useSWR from "swr"
import { useUser, useStackApp } from "@stackframe/stack"
import { Header } from "@/components/header"
import { SimpleStarRating } from "@/components/simple-star-rating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getImageUrl } from "@/lib/tmdb/image"
import { ArrowLeft, Calendar, Clock, Star, Play, X, Users, Tv, ChevronRight } from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export default function TVShowDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const user = useUser()
  const app = useStackApp()
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>("")

  const { data: show, error: showError, isLoading: showLoading } = useSWR(`/api/tv/${id}`, fetcher)
  const { data: ratingData } = useSWR(user ? `/api/tv-ratings?tvShowId=${id}` : null, fetcher)
  const { data: communityStats } = useSWR(`/api/tv/${id}/stats`, fetcher)

  const displayRating = communityStats?.averageScore
    ? communityStats.averageScore / 20
    : show?.vote_average
      ? show.vote_average / 2
      : null
  const ratingCount = communityStats?.ratingCount || 0
  const isDbRating = communityStats?.ratingCount > 0

  useEffect(() => {
    if (ratingData?.userRating) {
      setUserRating(ratingData.userRating.score || 0)
      setUserComment(ratingData.userRating.user_comment || "")
    }
  }, [ratingData])

  useEffect(() => {
    if (show?.number_of_seasons && !selectedSeason) {
      setSelectedSeason("1")
    }
  }, [show, selectedSeason])

  const handleSaveRating = async () => {
    if (!user) {
      app.redirectToSignIn()
      return
    }
    if (userRating === 0) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch("/api/tv-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvShowId: Number(id),
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
      setSaveMessage(error instanceof Error ? error.message : "Error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewSeason = () => {
    if (selectedSeason) {
      router.push(`/tv/${id}/season/${selectedSeason}`)
    }
  }

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showError || !show) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">TV Show not found</h1>
            <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const backdropUrl = getImageUrl(show.backdrop_path, "original")
  const posterUrl = getImageUrl(show.poster_path, "w500")
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null
  const endYear = show.last_air_date ? new Date(show.last_air_date).getFullYear() : null
  const yearRange = year
    ? show.status === "Ended" && endYear && endYear !== year
      ? `${year}–${endYear}`
      : `${year}–`
    : null
  const runtime = show.episode_run_time?.[0]
  const genres = show.genres?.map((g: { name: string }) => g.name).join(", ")
  const creators = show.created_by?.map((c: { name: string }) => c.name).join(", ")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Video Banner Background */}
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
          <Image src={backdropUrl || "/placeholder.svg"} alt={show.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      {/* Trailer Modal */}
      {showTrailer && show.trailer && (
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
              src={`https://www.youtube.com/embed/${show.trailer.key}?autoplay=1`}
              className="w-full h-full rounded-lg"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[300px_1fr]">
          {/* Poster */}
          <div className="mx-auto w-full max-w-[200px] sm:max-w-[250px] lg:max-w-none lg:mx-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-2xl ring-1 ring-border/50">
              {posterUrl ? (
                <Image src={posterUrl || "/placeholder.svg"} alt={show.name} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <Tv className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Trailer Button */}
            {show.trailer && (
              <Button
                onClick={() => setShowTrailer(true)}
                className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Trailer
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            {/* TV Badge */}
            <div className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/20">
                <Tv className="h-3 w-3" />
                TV Series
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">{show.name}</h1>
              {show.original_name && show.original_name !== show.name && (
                <p className="mt-1 text-sm sm:text-base text-muted-foreground italic">{show.original_name}</p>
              )}
              {show.tagline && <p className="mt-2 text-sm sm:text-lg text-muted-foreground italic">"{show.tagline}"</p>}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {yearRange && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {yearRange}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {runtime} min/ep
                </span>
              )}
              {show.number_of_seasons && (
                <span className="flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {show.number_of_seasons} {show.number_of_seasons === 1 ? "Season" : "Seasons"}
                </span>
              )}
            </div>

            {/* Rating */}
            {displayRating && displayRating > 0 && (
              <div className="flex justify-center lg:justify-start w-full">
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-2">
                    <Star
                      className={`h-6 w-6 sm:h-7 sm:w-7 ${isDbRating ? "fill-accent text-accent" : "fill-yellow-500 text-yellow-500"}`}
                    />
                    <span className="text-xl sm:text-2xl font-bold">{displayRating.toFixed(1)}</span>
                  </span>
                  {isDbRating ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3" />
                      {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground mt-1">(TMDB)</span>
                  )}
                </div>
              </div>
            )}

            {/* Genres */}
            {genres && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {show.genres?.map((genre: { id: number; name: string }) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[10px] sm:text-xs font-medium text-secondary-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {show.overview && (
              <div className="space-y-2">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Overview
                </h2>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{show.overview}</p>
              </div>
            )}

            {/* Creators */}
            {creators && (
              <div className="space-y-1">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Created By
                </h2>
                <p className="text-sm text-foreground">{creators}</p>
              </div>
            )}

            {/* Season Selector */}
            {show.number_of_seasons > 0 && (
              <div className="space-y-3 rounded-xl bg-card p-4 sm:p-6 ring-1 ring-border/50">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Browse Seasons
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select a season" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: show.number_of_seasons }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Season {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleViewSeason}
                    disabled={!selectedSeason}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    View Episodes
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
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

              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  placeholder="Your thoughts on this show..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="min-h-[60px] sm:min-h-[100px] resize-none bg-background border-border text-xs sm:text-sm"
                />
              </div>

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

            {/* Cast */}
            {show.credits?.cast && show.credits.cast.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Cast
                </h2>
                <div className="flex flex-wrap gap-2">
                  {show.credits.cast.slice(0, 10).map((person: { id: number; name: string; character: string }) => (
                    <div key={person.id} className="rounded-lg bg-secondary px-3 py-2">
                      <p className="text-xs sm:text-sm font-medium text-foreground">{person.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
