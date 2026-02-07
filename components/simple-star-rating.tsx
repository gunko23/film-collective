"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleStarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  readonly?: boolean
  hideValue?: boolean
}

export function SimpleStarRating({
  value,
  onChange,
  disabled = false,
  readonly = false,
  hideValue = false,
}: SimpleStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInteractive = !disabled && !readonly

  const displayValue = hoverValue ?? value

  // Calculate star value (0.5–5) from touch X position across the star row
  const getStarValueFromX = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const raw = (x / rect.width) * 5
    const snapped = Math.round(raw * 2) / 2
    return Math.max(0.5, Math.min(5, snapped))
  }, [])

  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverValue(isLeftHalf ? star - 0.5 : star)
  }

  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onChange(isLeftHalf ? star - 0.5 : star)
  }

  // Touch handlers for mobile: treat the star row as a slider
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const touch = e.touches[0]
    const val = getStarValueFromX(touch.clientX)
    if (val !== null) setHoverValue(val)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const touch = e.touches[0]
    const val = getStarValueFromX(touch.clientX)
    if (val !== null) setHoverValue(val)
  }

  const handleTouchEnd = () => {
    if (!isInteractive) return
    if (hoverValue !== null) {
      onChange(hoverValue)
    }
    setHoverValue(null)
  }

  const renderStar = (star: number) => {
    const isFull = displayValue >= star
    const isHalf = !isFull && displayValue >= star - 0.5

    return (
      <div className="relative h-8 w-8 sm:h-9 sm:w-9">
        <Star className="absolute h-8 w-8 sm:h-9 sm:w-9 fill-transparent text-muted-foreground/30" />
        {isHalf && (
          <div className="absolute overflow-hidden" style={{ width: "50%" }}>
            <Star className="h-8 w-8 sm:h-9 sm:w-9 fill-accent text-accent" />
          </div>
        )}
        {isFull && <Star className="absolute h-8 w-8 sm:h-9 sm:w-9 fill-accent text-accent" />}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center gap-1 sm:gap-2",
          isInteractive && "touch-none",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={(e) => handleClick(star, e)}
            onMouseMove={(e) => handleMouseMove(star, e)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "p-1 transition-all duration-150",
              !isInteractive ? "cursor-default" : "cursor-pointer hover:scale-110",
              disabled && "opacity-50",
            )}
          >
            {renderStar(star)}
          </button>
        ))}
      </div>
      {!hideValue && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-foreground">
            {displayValue > 0 ? displayValue : "—"}
            <span className="text-sm sm:text-base font-normal text-muted-foreground">/5</span>
          </span>
          {displayValue > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              {displayValue <= 1
                ? "Poor"
                : displayValue <= 2
                  ? "Below Average"
                  : displayValue <= 3
                    ? "Average"
                    : displayValue <= 4
                      ? "Great"
                      : "Masterpiece"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
