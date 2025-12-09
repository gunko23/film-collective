"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { MediaDetailsPage } from "@/components/media-details-page"
import { ErrorBoundary } from "react-error-boundary"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text.substring(0, 100))
  }
  return res.json()
}

function MovieContent() {
  const params = useParams()
  const id = params.id as string

  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(`/api/movies/tmdb/${id}`, fetcher)
  const { data: communityStats } = useSWR(`/api/movies/${id}/stats`, fetcher)

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

  // Transform movie data to match MediaDetailsPage expected format
  const mediaData = {
    id: Number(id),
    title: movie.title,
    tagline: movie.tagline,
    overview: movie.overview,
    poster_path: movie.posterPath,
    backdrop_path: movie.backdropPath,
    release_date: movie.releaseDate || movie.release_date,
    runtime: movie.runtime,
    vote_average: movie.vote_average,
    genres: movie.genres,
    status: movie.status,
    budget: movie.budget,
    revenue: movie.revenue,
    production_companies: movie.productionCompanies,
    cast: movie.cast,
    director: movie.director,
    writers: movie.writers,
    cinematographer: movie.cinematographer,
    composer: movie.composer,
    clip: movie.clip,
    trailer: movie.trailer,
  }

  return <MediaDetailsPage mediaType="movie" media={mediaData} communityStats={communityStats} />
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground">Something went wrong. Please try again.</p>
        <Button onClick={resetErrorBoundary} variant="outline" className="gap-2 bg-transparent">
          Try Again
        </Button>
      </div>
    </div>
  )
}

export default function MovieDetailsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MovieContent />
    </ErrorBoundary>
  )
}
