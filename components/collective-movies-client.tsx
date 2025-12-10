"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Film, Star, Users } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { CollectiveMovieModal } from "@/components/collective-movie-modal"

type Movie = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
}

type Props = {
  collectiveId: string
  collectiveName: string
  movies: Movie[]
}

export function CollectiveMoviesClient({ collectiveId, collectiveName, movies }: Props) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/collectives/${collectiveId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {collectiveName}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Rated Movies</h1>
          <p className="text-muted-foreground mt-1">{movies.length} movies rated by the collective</p>
        </div>

        {/* Movies Grid */}
        {movies.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-card/30 border border-border/50">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No movies rated yet. Start rating to see collective stats!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie) => {
              const score = movie.avg_score / 20
              return (
                <button key={movie.tmdb_id} onClick={() => setSelectedMovie(movie)} className="group text-left">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300">
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path, "w342") || "/placeholder.svg"}
                        alt={movie.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Rating badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      <span className="text-xs font-bold">{score.toFixed(1)}</span>
                    </div>
                    {/* Rating count badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {movie.rating_count}
                      </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRatingDisplay rating={score} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <CollectiveMovieModal
          movie={{
            tmdb_id: selectedMovie.tmdb_id,
            title: selectedMovie.title,
            poster_path: selectedMovie.poster_path,
            release_date: selectedMovie.release_date || "",
            avg_score: selectedMovie.avg_score,
            rating_count: selectedMovie.rating_count,
          }}
          collectiveId={collectiveId}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}
