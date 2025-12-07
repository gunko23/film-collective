"use client"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type RatingDimension = {
  id: string
  key: string
  label: string
  description: string | null
  weightDefault: number
  sortOrder: number
}

export type DimensionScores = {
  [key: string]: number
}

type DimensionRatingProps = {
  dimensions: RatingDimension[]
  scores: DimensionScores
  onChange: (scores: DimensionScores) => void
  readonly?: boolean
}

export function DimensionRating({ dimensions, scores, onChange, readonly = false }: DimensionRatingProps) {
  const handleScoreChange = (key: string, value: number) => {
    if (readonly) return
    onChange({ ...scores, [key]: value })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent"
    if (score >= 60) return "text-foreground"
    if (score >= 40) return "text-muted-foreground"
    return "text-muted-foreground/70"
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {dimensions.map((dimension) => {
          const score = scores[dimension.key] ?? 50
          return (
            <div key={dimension.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{dimension.label}</span>
                  {dimension.description && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] bg-popover border-border">
                        <p className="text-xs">{dimension.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", getScoreColor(score))}>{score}</span>
              </div>
              <Slider
                value={[score]}
                min={0}
                max={100}
                step={5}
                disabled={readonly}
                onValueChange={([value]) => handleScoreChange(dimension.key, value)}
                className={cn("cursor-pointer", readonly && "cursor-default opacity-70")}
              />
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export function OverallScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = () => {
    if (score >= 80) return "text-accent"
    if (score >= 60) return "text-foreground"
    return "text-muted-foreground"
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90">
        {/* Background circle */}
        <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
        {/* Progress circle */}
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", getScoreColor())}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-2xl font-bold tabular-nums", getScoreColor())}>{score}</span>
      </div>
    </div>
  )
}
