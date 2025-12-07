"use client"

import { useState } from "react"
import Link from "next/link"
import { CollectiveMoviesGrid } from "@/components/collective-movies-grid"
import { CollectiveActivityFeed } from "@/components/collective-activity-feed"
import { CollectiveMovieModal } from "@/components/collective-movie-modal"

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
  genres?: any
}

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
  collectiveId: string
  movieStats: MovieStat[]
  allRatings: Rating[]
}

export function CollectivePageClient({ collectiveId, movieStats, allRatings }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<MovieStat | null>(null)

  const handleMovieClick = (movie: MovieStat) => {
    setSelectedMovie(movie)
  }

  const handleMovieClickFromFeed = (tmdbId: string) => {
    const movie = movieStats.find((m) => m.tmdb_id === tmdbId)
    if (movie) {
      setSelectedMovie(movie)
    }
  }

  return (
    <>
      {/* Top Rated Movies */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Collective Top Movies</h2>
        <CollectiveMoviesGrid movies={movieStats} onMovieClick={handleMovieClick} />
      </div>

      {/* Collective Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Collective Feed</h2>
          <Link href={`/collectives/${collectiveId}/feed`} className="text-sm text-accent hover:underline">
            View All
          </Link>
        </div>
        <CollectiveActivityFeed ratings={allRatings.slice(0, 5)} onMovieClick={handleMovieClickFromFeed} />
      </div>

      {/* Movie Modal */}
      <CollectiveMovieModal movie={selectedMovie} collectiveId={collectiveId} onClose={() => setSelectedMovie(null)} />
    </>
  )
}
