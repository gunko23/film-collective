import { useId } from "react"
import { cn } from "@/lib/utils"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

interface StarRatingDisplayProps {
  rating: number // 0-5 scale
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

const sizePx = { sm: 12, md: 16, lg: 20 } as const

export function StarRatingDisplay({ rating, size = "md", showValue = false, className }: StarRatingDisplayProps) {
  const safeRating = rating ?? 0
  const baseId = useId()

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingStar
          key={star}
          fill={getStarFill(star, safeRating)}
          size={sizePx[size]}
          filledColor="hsl(var(--accent))"
          emptyColor="hsl(var(--muted-foreground) / 0.3)"
          uid={`${baseId}-${star}`}
        />
      ))}
      {showValue && <span className="ml-1.5 text-sm font-medium text-foreground">{safeRating.toFixed(1)}</span>}
    </div>
  )
}
