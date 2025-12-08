"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Film, Tv } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"

type MediaCardProps = {
  item: {
    id: number
    mediaType: "movie" | "tv"
    title: string
    posterPath: string | null
    voteAverage: number
    releaseDate?: string
  }
}

export function MediaCard({ item }: MediaCardProps) {
  const imageUrl = getImageUrl(item.posterPath, "w342")
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null
  const href = item.mediaType === "movie" ? `/movies/${item.id}` : `/tv/${item.id}`
  const Icon = item.mediaType === "movie" ? Film : Tv

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border/50 transition-all duration-300 hover:ring-accent/50 hover:shadow-lg hover:shadow-accent/10"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Rating badge */}
        {item.voteAverage > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-white">{(item.voteAverage / 2).toFixed(1)}</span>
          </div>
        )}

        {/* Media type badge */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
            item.mediaType === "tv" ? "bg-accent/90" : "bg-blue-500/90"
          }`}
        >
          <Icon className="h-3 w-3" />
          <span>{item.mediaType === "tv" ? "TV" : "Film"}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
          {item.title}
        </h3>
        {year && <p className="mt-1 text-xs text-muted-foreground">{year}</p>}
      </div>
    </Link>
  )
}
