"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { SimpleStarRating } from "@/components/simple-star-rating"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getImageUrl } from "@/lib/tmdb/image"
import { InlineBreakdownFlow } from "@/components/inline-breakdown-flow"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Play,
  X,
  Users,
  Tv,
  Film,
  Clapperboard,
  DollarSign,
  ChevronRight,
} from "lucide-react"

import { useSafeUser } from "@/hooks/use-safe-user"

interface MediaDetailsPageProps {
  mediaType: "movie" | "tv"
  media: {
    id: number
    title?: string
    name?: string
    original_name?: string
    tagline?: string
    overview?: string
    poster_path?: string
    backdrop_path?: string
    release_date?: string
    first_air_date?: string
    last_air_date?: string
    runtime?: number
    episode_run_time?: number[]
    vote_average?: number
    genres?: { id: number; name: string }[]
    status?: string
    budget?: number
    revenue?: number
    type?: string
    number_of_seasons?: number
    number_of_episodes?: number
    networks?: { id: number; name: string; logo_path?: string }[]
    production_companies?: { id: number; name: string }[]
    created_by?: { id: number; name: string }[]
    credits?: {
      cast?: { id: number; name: string; character: string; profile_path?: string }[]
      crew?: { id: number; name: string; job: string; profile_path?: string }[]
    }
    cast?: { id: number; name: string; character: string; profilePath?: string }[]
    director?: { name: string }
    writers?: { name: string }[]
    cinematographer?: { name: string }
    composer?: { name: string }
    clip?: { key: string }
    trailer?: { key: string }
  }
  communityStats?: {
    averageScore?: number
    ratingCount?: number
  }
}

interface ExistingBreakdown {
  dimensionScores?: Record<string, number>
  dimensionTags?: Record<string, string[]>
  // Legacy fields kept for backwards compatibility
  emotional_impact?: number
  pacing?: number
  aesthetic?: number
  rewatchability?: number
  breakdown_tags?: string[]
  breakdown_notes?: string
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

export function MediaDetailsPage({ mediaType, media, communityStats }: MediaDetailsPageProps) {
  const router = useRouter()
  const { user, isLoading: userLoading, isRateLimited } = useSafeUser()
  const [userRating, setUserRating] = useState<number>(0)
  const [userComment, setUserComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [isMuted, setIsMuted] = useState(true)
  const [showVideo, setShowVideo] = useState(true)
  const [showBreakdownFlow, setShowBreakdownFlow] = useState(false)
  const [skipBreakdown, setSkipBreakdown] = useState(false)
  const [existingBreakdown, setExistingBreakdown] = useState<ExistingBreakdown | undefined>(undefined)
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null)

  const isMovie = mediaType === "movie"
  const title = media.title || media.name || "Untitled"
  const posterUrl = getImageUrl(media.poster_path, "w500")
  const backdropUrl = getImageUrl(media.backdrop_path, "original")

  // Calculate display rating
  const displayRating = communityStats?.averageScore
    ? isMovie
      ? communityStats.averageScore
      : communityStats.averageScore / 20
    : media.vote_average
      ? media.vote_average / 2
      : null
  const ratingCount = communityStats?.ratingCount || 0
  const isDbRating = ratingCount > 0

  // Date/Year handling
  const releaseDate = isMovie ? media.release_date : media.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null
  const endYear = media.last_air_date ? new Date(media.last_air_date).getFullYear() : null
  const yearDisplay = isMovie
    ? year
    : year
      ? media.status === "Ended" && endYear && endYear !== year
        ? `${year}–${endYear}`
        : `${year}–`
      : null

  // Runtime
  const runtime = isMovie ? media.runtime : media.episode_run_time?.[0]

  // Cast - normalize between movie and TV show formats
  const cast = media.cast || media.credits?.cast || []

  // Crew
  const creators = media.created_by?.map((c) => c.name).join(", ")
  const director = media.director?.name
  const writers = media.writers?.map((w) => w.name) || []
  const cinematographer = media.cinematographer?.name
  const composer = media.composer?.name

  useEffect(() => {
    const fetchExistingRating = async () => {
      if (!user) return

      try {
        const endpoint = isMovie ? `/api/ratings?tmdbId=${media.id}` : `/api/tv-ratings?tvShowId=${media.id}`

        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          if (data.userRating) {
            setUserRating(data.userRating.score || 0)
            setUserComment(data.userRating.user_comment || data.userRating.userComment || "")
            setExistingRatingId(data.userRating.id || null)
            // Set existing breakdown if available
            const breakdown: ExistingBreakdown = {}

            // Check for new JSON format first
            if (data.userRating.dimensionScores && Object.keys(data.userRating.dimensionScores).length > 0) {
              breakdown.dimensionScores = data.userRating.dimensionScores
            }
            if (data.userRating.dimensionTags && Object.keys(data.userRating.dimensionTags).length > 0) {
              breakdown.dimensionTags = data.userRating.dimensionTags
            }

            // Fallback to legacy fields if no new format data
            if (!breakdown.dimensionScores) {
              if (data.userRating.emotional_impact) breakdown.emotional_impact = data.userRating.emotional_impact
              if (data.userRating.pacing) breakdown.pacing = data.userRating.pacing
              if (data.userRating.aesthetic) breakdown.aesthetic = data.userRating.aesthetic
              if (data.userRating.rewatchability) breakdown.rewatchability = data.userRating.rewatchability
            }
            if (!breakdown.dimensionTags && data.userRating.breakdown_tags) {
              breakdown.breakdown_tags = data.userRating.breakdown_tags
            }
            if (data.userRating.breakdown_notes) breakdown.breakdown_notes = data.userRating.breakdown_notes

            if (Object.keys(breakdown).length > 0) {
              setExistingBreakdown(breakdown)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching existing rating:", error)
      }
    }

    fetchExistingRating()
  }, [user, media.id, isMovie])

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return
      try {
        const res = await fetch("/api/ratings/preferences")
        if (res.ok) {
          const data = await res.json()
          setSkipBreakdown(data.skipBreakdown || false)
        }
      } catch (error) {
        console.error("Error fetching preferences:", error)
      }
    }
    fetchPreferences()
  }, [user])

  const handleSaveRating = async () => {
    if (!user || userRating === 0 || isRateLimited) return

    setIsSaving(true)
    setSaveMessage(null)
    setShowBreakdownFlow(false)

    try {
      const bodyData: Record<string, unknown> = {
        mediaType: isMovie ? "movie" : "tv",
        tmdbId: media.id,
        score: userRating,
        comment: userComment || null,
      }

      if (existingBreakdown) {
        if (existingBreakdown.dimensionScores) {
          bodyData.dimensionScores = existingBreakdown.dimensionScores
        }
        if (existingBreakdown.dimensionTags) {
          bodyData.dimensionTags = existingBreakdown.dimensionTags
        }
        if (existingBreakdown.emotional_impact) {
          bodyData.emotional_impact = existingBreakdown.emotional_impact
        }
        if (existingBreakdown.pacing) {
          bodyData.pacing = existingBreakdown.pacing
        }
        if (existingBreakdown.aesthetic) {
          bodyData.aesthetic = existingBreakdown.aesthetic
        }
        if (existingBreakdown.rewatchability) {
          bodyData.rewatchability = existingBreakdown.rewatchability
        }
        if (existingBreakdown.breakdown_tags) {
          bodyData.breakdown_tags = existingBreakdown.breakdown_tags
        }
        if (existingBreakdown.breakdown_notes) {
          bodyData.breakdown_notes = existingBreakdown.breakdown_notes
        }
      }

      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error || "Failed to save")
      }

      if (!skipBreakdown) {
        setShowBreakdownFlow(true)
      } else {
        setSaveMessage("Saved")
        setIsEditMode(false)
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Failed to save")
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewSeason = () => {
    if (selectedSeason) {
      router.push(`/tv/${media.id}/season/${selectedSeason}`)
    }
  }

  const handleBreakdownComplete = (savedBreakdown?: {
    dimensionScores?: Record<string, number>
    dimensionTags?: Record<string, string[]>
  }) => {
    setShowBreakdownFlow(false)
    setSaveMessage("Rating saved with breakdown!")
    setIsEditMode(false)

    // Update existingBreakdown state with newly saved data
    if (savedBreakdown) {
      setExistingBreakdown((prev) => ({
        ...prev,
        dimensionScores: {
          ...(prev?.dimensionScores || {}),
          ...(savedBreakdown.dimensionScores || {}),
        },
        dimensionTags: {
          ...(prev?.dimensionTags || {}),
          ...(savedBreakdown.dimensionTags || {}),
        },
      }))
    }

    setTimeout(() => setSaveMessage(null), 3000)
  }

  const hasExistingRating = existingRatingId !== null && userRating > 0

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Fixed backdrop container */}
      <div className="absolute inset-x-0 top-16 h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
        {media.clip ? (
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${media.clip.key}?autoplay=1&mute=${isMuted}&loop=1&playlist=${media.clip.key}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] sm:w-[200%] sm:h-[200%] lg:w-[150%] lg:h-[150%] pointer-events-none"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : backdropUrl ? (
          <Image src={backdropUrl || "/placeholder.svg"} alt="" fill className="object-cover" priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 pt-4 lg:pt-20 pb-8 sm:pb-12">
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
                  <Image src={posterUrl || "/placeholder.svg"} alt={title} fill className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground/50">No poster</span>
                  </div>
                )}
              </div>
              {media.trailer && (
                <Button
                  onClick={() => setShowVideo(!showVideo)}
                  className="w-[160px] sm:w-[200px] lg:w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {showVideo ? (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Watch Trailer
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 fill-current" />
                      Close Trailer
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Details */}
            <div className="space-y-5 sm:space-y-6 min-w-0">
              {/* Media Type Badge */}
              <div className="flex justify-center lg:justify-start">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                    isMovie
                      ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                      : "bg-accent/10 text-accent ring-accent/20"
                  }`}
                >
                  {isMovie ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                  {isMovie ? "Movie" : "TV Series"}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-foreground text-balance text-center lg:text-left">
                  {title}
                </h1>
                {!isMovie && media.original_name && media.original_name !== media.name && (
                  <p className="text-xs sm:text-sm italic text-muted-foreground text-center lg:text-left">
                    {media.original_name}
                  </p>
                )}
                {media.tagline && (
                  <p className="text-xs sm:text-sm italic text-muted-foreground text-center lg:text-left line-clamp-2">
                    "{media.tagline}"
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                {yearDisplay && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {yearDisplay}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    {isMovie ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : `${runtime} min/ep`}
                  </span>
                )}
                {!isMovie && media.number_of_seasons && (
                  <span className="flex items-center gap-1">
                    <Tv className="h-3 w-3 sm:h-4 sm:w-4" />
                    {media.number_of_seasons} {media.number_of_seasons === 1 ? "Season" : "Seasons"}
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
              {media.genres && media.genres.length > 0 && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
                  {media.genres.map((genre) => (
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
              {media.overview && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Synopsis
                  </h2>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/80 text-center lg:text-left line-clamp-4 sm:line-clamp-none">
                    {media.overview}
                  </p>
                </div>
              )}

              {/* Crew - Movies */}
              {isMovie && (director || writers.length > 0 || cinematographer || composer) && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Crew
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    {director && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Director</p>
                        <p className="font-medium text-foreground truncate">{director}</p>
                      </div>
                    )}
                    {writers.length > 0 && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Writer</p>
                        <p className="font-medium text-foreground truncate">{writers[0]}</p>
                      </div>
                    )}
                    {cinematographer && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Cinematography</p>
                        <p className="font-medium text-foreground truncate">{cinematographer}</p>
                      </div>
                    )}
                    {composer && (
                      <div className="text-center lg:text-left">
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Music</p>
                        <p className="font-medium text-foreground truncate">{composer}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Creators - TV Shows */}
              {!isMovie && creators && (
                <div className="space-y-1">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Created By
                  </h2>
                  <p className="text-sm text-foreground text-center lg:text-left">{creators}</p>
                </div>
              )}

              {/* Browse Seasons - TV Shows Only (below Created By) */}
              {!isMovie && media.number_of_seasons && media.number_of_seasons > 0 && (
                <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border/50">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Browse Seasons
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: media.number_of_seasons }, (_, i) => i + 1).map((num) => (
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

              {/* Cast */}
              {cast.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                    Cast
                  </h2>
                  <div className="relative -mx-4 sm:mx-0">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
                      {cast.slice(0, 10).map((actor: any) => (
                        <div key={actor.id} className="flex-shrink-0 w-14 sm:w-20 text-center">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2 rounded-full overflow-hidden bg-card ring-1 ring-border/50">
                            {actor.profilePath || actor.profile_path ? (
                              <Image
                                src={getImageUrl(actor.profilePath || actor.profile_path, "w185") || ""}
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
              <div className="space-y-2">
                <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
                  Details
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  {media.status && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <Film className="h-3 w-3" /> Status
                      </p>
                      <p className="font-medium text-foreground">{media.status}</p>
                    </div>
                  )}
                  {/* Movie-specific details */}
                  {isMovie && media.budget && media.budget > 0 && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <DollarSign className="h-3 w-3" /> Budget
                      </p>
                      <p className="font-medium text-foreground">{formatCurrency(media.budget)}</p>
                    </div>
                  )}
                  {isMovie && media.revenue && media.revenue > 0 && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <DollarSign className="h-3 w-3" /> Revenue
                      </p>
                      <p className="font-medium text-foreground">{formatCurrency(media.revenue)}</p>
                    </div>
                  )}
                  {isMovie && media.production_companies && media.production_companies.length > 0 && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <Clapperboard className="h-3 w-3" /> Studio
                      </p>
                      <p className="font-medium text-foreground truncate">{media.production_companies[0].name}</p>
                    </div>
                  )}
                  {/* TV-specific details */}
                  {!isMovie && media.type && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <Tv className="h-3 w-3" /> Type
                      </p>
                      <p className="font-medium text-foreground">{media.type}</p>
                    </div>
                  )}
                  {!isMovie && media.number_of_episodes && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <Clapperboard className="h-3 w-3" /> Episodes
                      </p>
                      <p className="font-medium text-foreground">{media.number_of_episodes}</p>
                    </div>
                  )}
                  {!isMovie && media.networks && media.networks.length > 0 && (
                    <div className="text-center lg:text-left">
                      <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
                        <Tv className="h-3 w-3" /> Network
                      </p>
                      <p className="font-medium text-foreground truncate">{media.networks[0].name}</p>
                    </div>
                  )}
                </div>
              </div>

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
                      onClick={() => (window.location.href = "/auth/signin")} // Redirect to sign in page
                      className="text-accent p-0 h-auto text-[10px] sm:text-xs"
                    >
                      Sign in to rate
                    </Button>
                  )}
                </div>

                {user && (
                  <>
                    {!showBreakdownFlow ? (
                      <>
                        {!hasExistingRating || isEditMode ? (
                          <SimpleStarRating
                            value={userRating}
                            onChange={setUserRating}
                            disabled={isSaving || isRateLimited}
                          />
                        ) : (
                          <SimpleStarRating value={userRating} onChange={() => {}} readonly={true} />
                        )}
                        <div className="space-y-2">
                          <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Notes
                          </label>
                          <Textarea
                            placeholder={`Your thoughts on this ${isMovie ? "film" : "show"}...`}
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            className="min-h-[60px] sm:min-h-[80px] resize-none bg-background text-xs sm:text-sm"
                            disabled={isSaving || isRateLimited || (hasExistingRating && !isEditMode)}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                          {hasExistingRating && !isEditMode ? (
                            <Button
                              onClick={() => setIsEditMode(true)}
                              disabled={isRateLimited}
                              className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm w-full sm:w-auto"
                            >
                              Update Rating
                            </Button>
                          ) : (
                            <Button
                              onClick={handleSaveRating}
                              disabled={isSaving || userRating === 0 || isRateLimited}
                              className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm w-full sm:w-auto"
                            >
                              {isSaving ? "Saving..." : "Save Rating"}
                            </Button>
                          )}
                          {isEditMode && (
                            <Button
                              onClick={() => setIsEditMode(false)}
                              variant="outline"
                              className="text-xs sm:text-sm w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                          )}
                          {saveMessage && (
                            <span
                              className={`text-xs sm:text-sm text-center sm:text-left ${saveMessage === "Saved" ? "text-green-500" : "text-red-500"}`}
                            >
                              {saveMessage}
                            </span>
                          )}
                        </div>
                        {existingBreakdown && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-2">Your breakdown:</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {existingBreakdown.dimensionScores &&
                                Object.entries(existingBreakdown.dimensionScores).map(([key, value]) => (
                                  <span key={key} className="px-2 py-1 bg-muted rounded capitalize">
                                    {key.replace(/_/g, " ")}: {value}/5
                                  </span>
                                ))}
                              {!existingBreakdown.dimensionScores && (
                                <>
                                  {existingBreakdown.emotional_impact && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Emotional: {existingBreakdown.emotional_impact}/5
                                    </span>
                                  )}
                                  {existingBreakdown.pacing && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Pacing: {existingBreakdown.pacing}/5
                                    </span>
                                  )}
                                  {existingBreakdown.aesthetic && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Aesthetic: {existingBreakdown.aesthetic}/5
                                    </span>
                                  )}
                                  {existingBreakdown.rewatchability && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Rewatchability: {existingBreakdown.rewatchability}/5
                                    </span>
                                  )}
                                </>
                              )}
                              {existingBreakdown.dimensionTags &&
                                Object.entries(existingBreakdown.dimensionTags).map(([dimKey, tags]) =>
                                  tags.map((tag) => (
                                    <span
                                      key={`${dimKey}-${tag}`}
                                      className="px-2 py-1 bg-accent/20 text-accent rounded capitalize"
                                    >
                                      {tag.replace(/_/g, " ")}
                                    </span>
                                  )),
                                )}
                              {!existingBreakdown.dimensionTags &&
                                existingBreakdown.breakdown_tags?.map((tag) => (
                                  <span key={tag} className="px-2 py-1 bg-accent/20 text-accent rounded capitalize">
                                    {tag.replace(/_/g, " ")}
                                  </span>
                                ))}
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setShowBreakdownFlow(true)}
                              className="mt-2 h-auto p-0 text-accent"
                            >
                              Edit breakdown
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <SimpleStarRating rating={userRating} readonly size="lg" />
                        <span className="text-sm text-muted-foreground">Rating saved!</span>
                        <InlineBreakdownFlow
                          isActive={showBreakdownFlow}
                          mediaType={isMovie ? "movie" : "tv"}
                          tmdbId={media.id}
                          onComplete={handleBreakdownComplete}
                          existingBreakdown={existingBreakdown}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
