"use client"

import { useState } from "react"
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
  sm: "text-lg p-0.5",
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

  const displayValue = hoverValue ?? value
  const isInteractive = !readonly && !!onChange

  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn("flex items-center", containerGap[size])}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayValue >= star
          const isHalf = !isFilled && displayValue >= star - 0.5

          return (
            <button
              key={star}
              type="button"
              disabled={!isInteractive}
              onClick={() => isInteractive && onChange(star)}
              onMouseEnter={() => isInteractive && setHoverValue(star)}
              onMouseLeave={() => isInteractive && setHoverValue(null)}
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
