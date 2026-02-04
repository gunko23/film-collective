"use client"

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { MediaDetailsPage } from "@/components/media-details-page"
import { ArrowLeft } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

function TVShowContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: show, error: showError, isLoading: showLoading } = useSWR(`/api/tv/${id}`, fetcher)
  const { data: communityStats } = useSWR(`/api/tv/${id}/stats`, fetcher)

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-4 lg:pt-20 flex items-center justify-center min-h-[60vh]">
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
        <div className="pt-4 lg:pt-20 flex items-center justify-center min-h-[60vh]">
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

  // Transform TV show data to match MediaDetailsPage expected format
  const mediaData = {
    id: Number(id),
    name: show.name,
    original_name: show.original_name,
    tagline: show.tagline,
    overview: show.overview,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    first_air_date: show.first_air_date,
    last_air_date: show.last_air_date,
    episode_run_time: show.episode_run_time,
    vote_average: show.vote_average,
    genres: show.genres,
    status: show.status,
    type: show.type,
    number_of_seasons: show.number_of_seasons,
    number_of_episodes: show.number_of_episodes,
    networks: show.networks,
    created_by: show.created_by,
    credits: show.credits,
    clip: show.clip,
    trailer: show.trailer,
  }

  return <MediaDetailsPage mediaType="tv" media={mediaData} communityStats={communityStats} />
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Something went wrong. Please try again.</p>
          <Button onClick={resetErrorBoundary} variant="ghost" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TVShowDetailsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TVShowContent />
    </ErrorBoundary>
  )
}
