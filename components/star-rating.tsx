"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const isTouchRef = useRef(false)
  const isInteractive = !readonly && !!onRatingChange

  const displayRating = hoverRating ?? rating

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  }

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
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fillPercentage = Math.min(Math.max((displayRating - starIndex) * 100, 0), 100)

        return (
          <div
            key={starIndex}
            className={cn("relative p-0.5", isInteractive && "cursor-pointer")}
            onClick={(e) => handleClick(starIndex, e)}
            onMouseMove={(e) => handleMouseMove(starIndex, e)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background star (empty) */}
            <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />

            {/* Filled star overlay */}
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ width: `${fillPercentage}%` }}>
              <Star className={cn(sizeClasses[size], "fill-primary text-primary")} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
