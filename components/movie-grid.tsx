"use client"

import { MovieCard } from "./movie-card"
import { Loader2, Film } from "lucide-react"

type Movie = {
  id?: number
  tmdbId?: number
  title: string
  originalTitle?: string
  overview?: string | null
  releaseDate?: string | null
  posterPath?: string | null
  backdropPath?: string | null
  voteAverage?: number | null
  voteCount?: number | null
  popularity?: number | null
  runtime?: number | null
  genres?: string[]
}

type MovieGridProps = {
  movies: Movie[]
  isLoading?: boolean
}

export function MovieGrid({ movies, isLoading }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading films...</p>
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <Film className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">No films found</p>
          <p className="text-sm text-muted-foreground">Try searching for a different title</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie, index) => (
        <MovieCard key={movie.tmdbId || movie.id || index} movie={movie} priority={index < 6} />
      ))}
    </div>
  )
}
