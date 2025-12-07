import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingDisplayProps {
  rating: number // 0-5 scale
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function StarRatingDisplay({ rating, size = "md", showValue = false, className }: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const starSize = sizeClasses[size]

  const renderStar = (star: number) => {
    const isFull = rating >= star
    const isHalf = !isFull && rating >= star - 0.5

    return (
      <div key={star} className={cn("relative", starSize)}>
        {/* Background star (empty) */}
        <Star className={cn("absolute", starSize, "fill-transparent text-muted-foreground/30")} />
        {/* Half star */}
        {isHalf && (
          <div className="absolute overflow-hidden" style={{ width: "50%" }}>
            <Star className={cn(starSize, "fill-accent text-accent")} />
          </div>
        )}
        {/* Full star */}
        {isFull && <Star className={cn("absolute", starSize, "fill-accent text-accent")} />}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map(renderStar)}
      {showValue && <span className="ml-1.5 text-sm font-medium text-foreground">{rating.toFixed(1)}</span>}
    </div>
  )
}
