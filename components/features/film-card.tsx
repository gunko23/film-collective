import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/tmdb/image"

type FilmCardSize = "sm" | "md"

type FilmCardProps = {
  title: string
  year?: string | number | null
  posterPath?: string | null
  matchPercentage?: number | null
  size?: FilmCardSize
  onClick?: () => void
  className?: string
}

const sizeConfig: Record<FilmCardSize, { poster: string; text: string; badge: string; imageWidth: number }> = {
  sm: {
    poster: "rounded-md",
    text: "text-xs",
    badge: "text-[10px] px-1.5 py-0.5",
    imageWidth: 185,
  },
  md: {
    poster: "rounded-lg",
    text: "text-sm",
    badge: "text-xs px-2 py-0.5",
    imageWidth: 342,
  },
}

export function FilmCard({
  title,
  year,
  posterPath,
  matchPercentage,
  size = "sm",
  onClick,
  className,
}: FilmCardProps) {
  const config = sizeConfig[size]
  const imageUrl = posterPath ? getImageUrl(posterPath, size === "sm" ? "w185" : "w342") : null

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group text-left transition-all",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        className,
      )}
    >
      {/* Poster */}
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden border border-foreground/10",
          config.poster,
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={config.imageWidth}
            height={Math.round(config.imageWidth * 1.5)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-accent/40 to-cool/20" />
        )}

        {/* Match percentage badge */}
        {matchPercentage != null && (
          <div
            className={cn(
              "absolute top-1.5 right-1.5 rounded-full bg-accent font-semibold text-background",
              config.badge,
            )}
          >
            {Math.round(matchPercentage)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 min-w-0">
        <p className={cn("font-medium text-foreground truncate group-hover:text-accent transition-colors", config.text)}>
          {title}
        </p>
        {year && (
          <p className={cn("text-muted-foreground mt-0.5", size === "sm" ? "text-[10px]" : "text-xs")}>
            {typeof year === "string" ? year.slice(0, 4) : year}
          </p>
        )}
      </div>
    </button>
  )
}
