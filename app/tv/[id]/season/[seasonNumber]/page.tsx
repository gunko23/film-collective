"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import useSWR from "swr"
import { useUser, useStackApp } from "@stackframe/stack"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { SimpleStarRating } from "@/components/simple-star-rating"
import { getImageUrl } from "@/lib/tmdb/image"
import { ArrowLeft, Calendar, Clock, Star, ChevronDown, ChevronUp, Tv } from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

type Episode = {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  air_date: string
  runtime: number
  vote_average: number
  vote_count: number
}

function EpisodeCard({
  episode,
  tvShowId,
  seasonNumber,
  user,
  app,
}: {
  episode: Episode
  tvShowId: string
  seasonNumber: string
  user: ReturnType<typeof useUser>
  app: ReturnType<typeof useStackApp>
}) {
  const [expanded, setExpanded] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const { data: ratingData, mutate } = useSWR(
    user ? `/api/episode-ratings?episodeId=${episode.id}&tvShowId=${tvShowId}` : null,
    fetcher,
  )

  const stillUrl = getImageUrl(episode.still_path, "w500")
  const airDate = episode.air_date ? new Date(episode.air_date).toLocaleDateString() : null

  useEffect(() => {
    if (ratingData?.userRating) {
      setUserRating(ratingData.userRating.score || 0)
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
      const res = await fetch("/api/episode-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: episode.id,
          tvShowId: Number(tvShowId),
          seasonNumber: Number(seasonNumber),
          score: userRating,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      setSaveMessage("Saved")
      mutate()
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Error")
    } finally {
      setIsSaving(false)
    }
  }

  const hasUserRating = ratingData?.userRating?.score > 0

  return (
    <div className="rounded-xl bg-card ring-1 ring-border/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        {/* Episode Thumbnail */}
        <div className="relative w-24 sm:w-32 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {stillUrl ? (
            <Image src={stillUrl || "/placeholder.svg"} alt={episode.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Tv className="h-6 w-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Episode Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Episode {episode.episode_number}</p>
              <h3 className="font-semibold text-foreground line-clamp-1">{episode.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {hasUserRating ? (
                <span className="flex items-center gap-1 text-xs text-accent font-medium">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {ratingData.userRating.score.toFixed(1)}
                </span>
              ) : episode.vote_average > 0 ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {(episode.vote_average / 2).toFixed(1)}
                </span>
              ) : null}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {airDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {airDate}
              </span>
            )}
            {episode.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {episode.runtime} min
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4">
          {episode.overview && <p className="text-sm text-foreground/80 leading-relaxed">{episode.overview}</p>}

          {/* Rating Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Your Rating:</span>
              <SimpleStarRating value={userRating} onChange={setUserRating} disabled={isSaving} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveRating}
                disabled={userRating === 0 || isSaving}
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              >
                {!user ? "Sign in" : isSaving ? "Saving..." : "Save"}
              </Button>
              {saveMessage && (
                <span className={`text-xs ${saveMessage === "Saved" ? "text-accent" : "text-destructive"}`}>
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SeasonDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tvId = params.id as string
  const seasonNumber = params.seasonNumber as string
  const user = useUser()
  const app = useStackApp()

  const { data: show } = useSWR(`/api/tv/${tvId}`, fetcher)
  const {
    data: season,
    error: seasonError,
    isLoading: seasonLoading,
  } = useSWR(`/api/tv/${tvId}/season/${seasonNumber}`, fetcher)

  if (seasonLoading) {
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

  if (seasonError || !season) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Season not found</h1>
            <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const posterUrl = getImageUrl(season.poster_path, "w342")
  const backdropUrl = show?.backdrop_path ? getImageUrl(show.backdrop_path, "original") : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Background */}
      <div className="fixed inset-0 z-0">
        {backdropUrl && (
          <Image src={backdropUrl || "/placeholder.svg"} alt={season.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/tv/${tvId}`)}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {show?.name || "Show"}
          </Button>
        </div>

        {/* Season Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Season Poster */}
          {posterUrl && (
            <div className="mx-auto sm:mx-0 w-32 sm:w-40 flex-shrink-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-xl ring-1 ring-border/50">
                <Image src={posterUrl || "/placeholder.svg"} alt={season.name} fill className="object-cover" />
              </div>
            </div>
          )}

          {/* Season Info */}
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground mb-1">{show?.name}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{season.name}</h1>
            {season.air_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Aired: {new Date(season.air_date).toLocaleDateString()}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {season.episodes?.length || 0} Episodes
              {season.vote_average > 0 && (
                <span className="ml-3 inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {(season.vote_average / 2).toFixed(1)}
                </span>
              )}
            </p>
            {season.overview && (
              <p className="text-sm text-foreground/80 mt-4 max-w-2xl leading-relaxed">{season.overview}</p>
            )}
          </div>
        </div>

        {/* Episodes List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">Episodes</h2>
          {season.episodes && season.episodes.length > 0 ? (
            <div className="space-y-3">
              {season.episodes.map((episode: Episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  tvShowId={tvId}
                  seasonNumber={seasonNumber}
                  user={user}
                  app={app}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No episodes available</p>
          )}
        </div>
      </div>
    </div>
  )
}
