"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}

export function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const displayRating = hoverRating ?? rating

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  }

  // 10 half-stars for 0.5 - 5.0 rating
  const handleClick = (index: number) => {
    if (readonly || !onRatingChange) return
    const newRating = (index + 1) * 0.5
    onRatingChange(newRating)
  }

  const handleMouseEnter = (index: number) => {
    if (readonly) return
    setHoverRating((index + 1) * 0.5)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(null)
  }

  return (
    <div className={cn("flex items-center", gapClasses[size])}>
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const starValue = starIndex + 1
        const fillPercentage = Math.min(Math.max((displayRating - starIndex) * 100, 0), 100)

        return (
          <div
            key={starIndex}
            className={cn("relative", !readonly && "cursor-pointer")}
            onClick={() => handleClick(starIndex * 2 + 1)}
            onMouseEnter={() => handleMouseEnter(starIndex * 2 + 1)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background star (empty) */}
            <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />

            {/* Filled star overlay */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
              <Star className={cn(sizeClasses[size], "fill-primary text-primary")} />
            </div>

            {/* Click areas for half stars */}
            {!readonly && (
              <>
                <div
                  className="absolute inset-y-0 left-0 w-1/2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick(starIndex * 2)
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation()
                    handleMouseEnter(starIndex * 2)
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick(starIndex * 2 + 1)
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation()
                    handleMouseEnter(starIndex * 2 + 1)
                  }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
