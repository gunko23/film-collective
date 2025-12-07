"use client"

import type React from "react"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleStarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SimpleStarRating({ value, onChange, disabled = false }: SimpleStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value

  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverValue(isLeftHalf ? star - 0.5 : star)
  }

  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onChange(isLeftHalf ? star - 0.5 : star)
  }

  const renderStar = (star: number) => {
    const isFull = displayValue >= star
    const isHalf = !isFull && displayValue >= star - 0.5

    return (
      <div className="relative h-7 w-7 sm:h-9 sm:w-9">
        <Star className="absolute h-7 w-7 sm:h-9 sm:w-9 fill-transparent text-muted-foreground/30" />
        {isHalf && (
          <div className="absolute overflow-hidden" style={{ width: "50%" }}>
            <Star className="h-7 w-7 sm:h-9 sm:w-9 fill-accent text-accent" />
          </div>
        )}
        {isFull && <Star className="absolute h-7 w-7 sm:h-9 sm:w-9 fill-accent text-accent" />}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={(e) => handleClick(star, e)}
            onMouseMove={(e) => handleMouseMove(star, e)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "p-0.5 sm:p-1 transition-all duration-150",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110",
            )}
          >
            {renderStar(star)}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold text-foreground">
          {value > 0 ? value : "—"}
          <span className="text-sm sm:text-base font-normal text-muted-foreground">/5</span>
        </span>
        {value > 0 && (
          <span className="text-xs sm:text-sm text-muted-foreground">
            {value <= 1
              ? "Poor"
              : value <= 2
                ? "Below Average"
                : value <= 3
                  ? "Average"
                  : value <= 4
                    ? "Great"
                    : "Masterpiece"}
          </span>
        )}
      </div>
    </div>
  )
}
