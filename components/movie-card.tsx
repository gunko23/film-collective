"use client"

import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { Star, Film, Play } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type MovieCardProps = {
  movie: {
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
  priority?: boolean
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const posterUrl = getImageUrl(movie.posterPath, "w500")
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  const movieId = movie.tmdbId || movie.id

  const { data: stats } = useSWR(movieId ? `/api/movies/${movieId}/stats` : null, fetcher)

  // Use DB rating if available, otherwise fall back to TMDB
  const displayRating = stats?.averageScore ?? (movie.voteAverage ? movie.voteAverage / 2 : null)
  const ratingCount = stats?.ratingCount || 0
  const isDbRating = stats?.ratingCount > 0

  return (
    <Link href={`/movies/${movieId}`} className="group relative block">
      {/* Card Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-card ring-1 ring-border/50 transition-all duration-500 group-hover:ring-accent/50 group-hover:shadow-2xl group-hover:shadow-accent/20 hover-lift">
        {/* Poster Image */}
        {posterUrl ? (
          <Image
            src={posterUrl || "/placeholder.svg"}
            alt={movie.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-card to-muted">
            <Film className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {displayRating !== null && displayRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-background/90 px-2.5 py-1.5 backdrop-blur-sm ring-1 ring-white/10 shadow-lg">
            <Star className={`h-4 w-4 ${isDbRating ? "fill-accent text-accent" : "fill-yellow-500 text-yellow-500"}`} />
            <span className="text-sm font-semibold text-foreground">{displayRating.toFixed(1)}</span>
          </div>
        )}

        {/* Hover Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 transition-all duration-500 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
          {/* Title on Hover */}
          <h3 className="mb-2 text-base font-bold leading-tight text-white line-clamp-2">{movie.title}</h3>

          {/* Year & Rating Row */}
          <div className="mb-3 flex items-center gap-3 text-xs text-white/70">
            {year && <span className="font-medium">{year}</span>}
            {displayRating && displayRating > 0 && (
              <span className="flex items-center gap-1">
                <Star
                  className={`h-3 w-3 ${isDbRating ? "fill-accent text-accent" : "fill-yellow-500 text-yellow-500"}`}
                />
                {displayRating.toFixed(1)}
                {isDbRating && <span className="text-white/50">({ratingCount})</span>}
              </span>
            )}
          </div>

          {/* Synopsis */}
          {movie.overview && (
            <p className="text-xs leading-relaxed text-white/60 line-clamp-3 mb-4">{movie.overview}</p>
          )}

          {/* View Button */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold transition-transform duration-300 group-hover:scale-105">
              <Play className="h-3 w-3 fill-current" />
              View Details
            </span>
          </div>
        </div>

        {/* Accent glow on hover */}
        <div className="absolute inset-0 rounded-xl ring-2 ring-accent/0 group-hover:ring-accent/30 transition-all duration-500 pointer-events-none" />
      </div>

      {/* Title Below Card - Visible when not hovering */}
      <div className="mt-3 space-y-1 transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-1">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </Link>
  )
}
