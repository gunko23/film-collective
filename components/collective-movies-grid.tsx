"use client"

import { Star, Film } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
}

type Props = {
  movies: MovieStat[]
  onMovieClick: (movie: MovieStat) => void
}

export function CollectiveMoviesGrid({ movies, onMovieClick }: Props) {
  if (movies.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
        <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No movies rated yet. Start rating to see collective stats!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.slice(0, 10).map((movie) => (
        <button key={movie.tmdb_id} onClick={() => onMovieClick(movie)} className="group text-left">
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
              <span className="text-xs font-bold">{(Number(movie.avg_score) / 20).toFixed(1)}</span>
            </div>
            {/* Rating count badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
              <span className="text-xs text-muted-foreground">
                {movie.rating_count} {movie.rating_count === 1 ? "rating" : "ratings"}
              </span>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-full bg-background/90 text-sm font-medium">View Ratings</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
              {movie.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
