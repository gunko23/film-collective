"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Tv } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"

type TVShowCardProps = {
  show: {
    id: number
    name: string
    posterPath: string | null
    voteAverage: number
    firstAirDate?: string
  }
}

export function TVShowCard({ show }: TVShowCardProps) {
  const imageUrl = getImageUrl(show.posterPath, "w342")
  const year = show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : null

  return (
    <Link
      href={`/tv/${show.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border/50 transition-all duration-300 hover:ring-accent/50 hover:shadow-lg hover:shadow-accent/10"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={show.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tv className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Rating badge */}
        {show.voteAverage > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-white">{(show.voteAverage / 2).toFixed(1)}</span>
          </div>
        )}

        {/* TV badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-accent/90 px-1.5 py-0.5 text-xs font-medium">
          <Tv className="h-3 w-3" />
          <span>TV</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
          {show.name}
        </h3>
        {year && <p className="mt-1 text-xs text-muted-foreground">{year}</p>}
      </div>
    </Link>
  )
}
