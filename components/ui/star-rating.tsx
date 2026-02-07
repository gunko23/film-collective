"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

type StarRatingSize = "sm" | "md" | "lg"

type StarRatingProps = {
  value: number // 0–5 scale, supports half-step display (e.g. 3.5)
  onChange?: (value: number) => void
  readonly?: boolean
  size?: StarRatingSize
  showValue?: boolean
  className?: string
}

const containerGap: Record<StarRatingSize, string> = {
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-3",
}

const starSize: Record<StarRatingSize, string> = {
  sm: "text-xl p-0.5",
  md: "text-2xl p-1",
  lg: "text-[32px] p-2",
}

const valueSize: Record<StarRatingSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isTouchRef = useRef(false)
  const isInteractive = !readonly && !!onChange

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
    e.preventDefault()
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
    const touch = e.changedTouches[0]
    const val = getStarValueFromX(touch.clientX)
    if (val !== null) onChange(val)
    setHoverValue(null)
    setTimeout(() => { isTouchRef.current = false }, 300)
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div
        ref={containerRef}
        className={cn(
          "flex items-center",
          containerGap[size],
          isInteractive && "touch-none select-none",
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayValue >= star
          const isHalf = !isFilled && displayValue >= star - 0.5

          return (
            <button
              key={star}
              type="button"
              disabled={!isInteractive}
              onClick={(e) => handleClick(star, e)}
              onMouseMove={(e) => handleMouseMove(star, e)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "relative select-none leading-none transition-all duration-150",
                starSize[size],
                isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default",
                isFilled && "scale-105",
              )}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <span className={cn(isFilled ? "text-accent" : "text-foreground/20")}>
                ★
              </span>
              {isHalf && (
                <span
                  className="absolute inset-0 flex items-center justify-center overflow-hidden text-accent"
                  style={{ width: "50%" }}
                >
                  ★
                </span>
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className={cn("ml-2 font-medium text-foreground", valueSize[size])}>
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </div>
  )
}
