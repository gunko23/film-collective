"use client"

import type React from "react"
import { useState, useRef, useCallback, useId } from "react"
import { cn } from "@/lib/utils"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

type StarRatingProps = {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}

export function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isTouchRef = useRef(false)
  const baseId = useId()
  const isInteractive = !readonly && !!onRatingChange

  const displayRating = hoverRating ?? rating

  const starPx = { sm: 20, md: 28, lg: 36 } as const

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  }

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

  const handleMouseMove = (starIndex: number, e: React.MouseEvent) => {
    if (!isInteractive || isTouchRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverRating(isLeftHalf ? starIndex + 0.5 : starIndex + 1)
  }

  const handleClick = (starIndex: number, e: React.MouseEvent) => {
    if (!isInteractive || isTouchRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    onRatingChange(isLeftHalf ? starIndex + 0.5 : starIndex + 1)
  }

  const handleMouseLeave = () => {
    if (isTouchRef.current) return
    setHoverRating(null)
  }

  // --- Touch handlers (mobile: star row acts as a slider) ---

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractive) return
    e.preventDefault()
    isTouchRef.current = true
    const val = getStarValueFromX(e.touches[0].clientX)
    if (val !== null) setHoverRating(val)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const val = getStarValueFromX(e.touches[0].clientX)
    if (val !== null) setHoverRating(val)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isInteractive) return
    const touch = e.changedTouches[0]
    const val = getStarValueFromX(touch.clientX)
    if (val !== null) onRatingChange(val)
    setHoverRating(null)
    setTimeout(() => { isTouchRef.current = false }, 300)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center",
        gapClasses[size],
        isInteractive && "touch-none select-none",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => (
        <div
          key={starIndex}
          className={cn("p-0.5", isInteractive && "cursor-pointer")}
          onClick={(e) => handleClick(starIndex, e)}
          onMouseMove={(e) => handleMouseMove(starIndex, e)}
          onMouseLeave={handleMouseLeave}
        >
          <RatingStar
            fill={getStarFill(starIndex + 1, displayRating)}
            size={starPx[size]}
            filledColor="hsl(var(--primary))"
            emptyColor="hsl(var(--muted-foreground) / 0.3)"
            uid={`${baseId}-${starIndex}`}
          />
        </div>
      ))}
    </div>
  )
}
