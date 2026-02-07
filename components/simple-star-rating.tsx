"use client"

import type React from "react"

import { useState, useRef, useCallback, useId } from "react"
import { cn } from "@/lib/utils"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

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
  const isTouchRef = useRef(false)
  const baseId = useId()
  const isInteractive = !disabled && !readonly

  const displayValue = hoverValue ?? value

  // Calculate star value (0.5–5) from X position across the star row
  const getStarValueFromX = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const raw = (x / rect.width) * 5
    const snapped = Math.round(raw * 2) / 2
    return Math.max(0.5, Math.min(5, snapped))
  }, [])

  // --- Mouse handlers (desktop only, guarded against touch) ---

  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive || isTouchRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverValue(isLeftHalf ? star - 0.5 : star)
  }

  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInteractive || isTouchRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onChange(isLeftHalf ? star - 0.5 : star)
  }

  const handleMouseLeave = () => {
    if (isTouchRef.current) return
    setHoverValue(null)
  }

  // --- Touch handlers (mobile: star row acts as a slider) ---

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive) return
    e.preventDefault() // Prevents synthetic click from firing after touch
    isTouchRef.current = true
    const val = getStarValueFromX(e.touches[0].clientX)
    if (val !== null) setHoverValue(val)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const val = getStarValueFromX(e.touches[0].clientX)
    if (val !== null) setHoverValue(val)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isInteractive) return
    // Read final position from changedTouches (not from state, which may be stale)
    const touch = e.changedTouches[0]
    const val = getStarValueFromX(touch.clientX)
    if (val !== null) onChange(val)
    setHoverValue(null)
    // Keep touch flag for 300ms to block the synthetic click
    setTimeout(() => { isTouchRef.current = false }, 300)
  }

  const renderStar = (star: number) => (
    <RatingStar
      fill={getStarFill(star, displayValue)}
      size={32}
      filledColor="hsl(var(--accent))"
      emptyColor="hsl(var(--muted-foreground) / 0.3)"
      uid={`${baseId}-${star}`}
      className="h-8 w-8 sm:h-9 sm:w-9"
    />
  )

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center gap-1 sm:gap-2",
          isInteractive && "touch-none select-none",
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
            onMouseLeave={handleMouseLeave}
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
