"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { LayoutDashboard, MessageSquare } from "lucide-react"
import { CollectiveMoviesGrid } from "@/components/collective-movies-grid"
import { CollectiveActivityFeed } from "@/components/collective-activity-feed"
import { CollectiveMovieModal } from "@/components/collective-movie-modal"
import { MessageBoard } from "@/components/message-board"

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
  children?: React.ReactNode
}

export function CollectivePageClient({ collectiveId, movieStats, allRatings, children }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<MovieStat | null>(null)
  const [activeTab, setActiveTab] = useState<"dashboard" | "messageboard">("dashboard")

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
      <div className="flex gap-2 mb-6 border-b border-border/50">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === "dashboard"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("messageboard")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === "messageboard"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Message Board
        </button>
      </div>

      {activeTab === "dashboard" && (
        <>
          {/* Top Rated Movies */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Collective Top Movies</h2>
              {movieStats.length > 10 && (
                <Link href={`/collectives/${collectiveId}/movies`} className="text-sm text-accent hover:underline">
                  View All ({movieStats.length})
                </Link>
              )}
            </div>
            <CollectiveMoviesGrid movies={movieStats} onMovieClick={handleMovieClick} />
          </div>

          {children}

          {/* Collective Feed */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Collective Feed</h2>
              <Link href={`/collectives/${collectiveId}/feed`} className="text-sm text-accent hover:underline">
                View All
              </Link>
            </div>
            <CollectiveActivityFeed ratings={allRatings.slice(0, 5)} onMovieClick={handleMovieClickFromFeed} />
          </div>
        </>
      )}

      {activeTab === "messageboard" && (
        <div className="mb-8">
          <MessageBoard collectiveId={collectiveId} />
        </div>
      )}

      {/* Movie Modal */}
      <CollectiveMovieModal movie={selectedMovie} collectiveId={collectiveId} onClose={() => setSelectedMovie(null)} />
    </>
  )
}
