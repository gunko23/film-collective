"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Check, RotateCcw, ChevronRight, X, Minus, Plus } from "lucide-react"

interface DimensionOption {
  id: string
  key: string
  label: string
  description: string | null
}

interface RatingDimension {
  id: string
  key: string
  label: string
  description: string | null
  uiType: "slider" | "tags"
  minValue: number | null
  maxValue: number | null
  step: number | null
  options?: DimensionOption[]
}

interface InlineBreakdownFlowProps {
  isActive: boolean
  mediaType: "movie" | "tv"
  tmdbId: number
  onComplete: (savedBreakdown?: {
    dimensionScores?: Record<string, number>
    dimensionTags?: Record<string, string[]>
  }) => void
  onSkipPreferenceChange?: (skip: boolean) => void
  existingBreakdown?: {
    dimensionScores?: Record<string, number>
    dimensionTags?: Record<string, string[]>
    // Legacy fields for backwards compatibility
    emotional_impact?: number
    pacing?: number
    aesthetic?: number
    rewatchability?: number
    breakdown_tags?: string[]
  }
}

const IDLE_TIMEOUT = 10000 // 10 seconds

export function InlineBreakdownFlow({
  isActive,
  mediaType,
  tmdbId,
  onComplete,
  existingBreakdown,
}: InlineBreakdownFlowProps) {
  const [dimensions, setDimensions] = useState<RatingDimension[]>([])
  const [sliderDimensions, setSliderDimensions] = useState<RatingDimension[]>([])
  const [tagDimension, setTagDimension] = useState<RatingDimension | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [visitedDimensions, setVisitedDimensions] = useState<Set<string>>(new Set())
  const [touchedDimensions, setTouchedDimensions] = useState<Set<string>>(new Set())
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  const [selectedTags, setSelectedTags] = useState<string[]>(existingBreakdown?.breakdown_tags || [])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  async function safeJsonParse(response: Response) {
    const text = await response.text()
    if (!text || text.trim() === "") {
      return null
    }
    try {
      return JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse JSON:", text.substring(0, 100))
      return null
    }
  }

  useEffect(() => {
    async function fetchDimensions() {
      try {
        const res = await fetch("/api/dimensions")
        const data = await safeJsonParse(res)
        if (data) {
          setDimensions(data.dimensions || [])

          const sliders = (data.dimensions || []).filter((d: RatingDimension) => d.uiType === "slider")
          const tags = (data.dimensions || []).find((d: RatingDimension) => d.uiType === "tags")

          setSliderDimensions(sliders)
          setTagDimension(tags || null)

          const initialValues: Record<string, number> = {}
          for (const dim of sliders) {
            const defaultVal = Math.round(((dim.minValue ?? 1) + (dim.maxValue ?? 5)) / 2)
            // Check new format first, then legacy
            if (existingBreakdown?.dimensionScores?.[dim.key] !== undefined) {
              initialValues[dim.key] = existingBreakdown.dimensionScores[dim.key]
            } else {
              const legacyKey = dim.key as keyof typeof existingBreakdown
              const legacyVal = existingBreakdown?.[legacyKey]
              initialValues[dim.key] = typeof legacyVal === "number" ? legacyVal : defaultVal
            }
          }
          setSliderValues(initialValues)

          if (tags && existingBreakdown?.dimensionTags?.[tags.key]) {
            setSelectedTags(existingBreakdown.dimensionTags[tags.key])
          } else if (existingBreakdown?.breakdown_tags) {
            setSelectedTags(existingBreakdown.breakdown_tags)
          }
        }
      } catch (error) {
        console.error("Error fetching dimensions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isActive) {
      fetchDimensions()
    }
  }, [isActive, existingBreakdown])

  // Reset state when flow becomes active
  useEffect(() => {
    if (isActive) {
      setCurrentStep(0)
      setVisitedDimensions(new Set())
      setTouchedDimensions(new Set())
      setIsCollapsed(false)
      setIsComplete(false)
      const existingTags =
        tagDimension && existingBreakdown?.dimensionTags?.[tagDimension.key]
          ? existingBreakdown.dimensionTags[tagDimension.key]
          : existingBreakdown?.breakdown_tags || []
      setSelectedTags(existingTags)
      resetIdleTimer()
    }
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [isActive, existingBreakdown, tagDimension])

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      handleCollapse()
    }, IDLE_TIMEOUT)
  }, [])

  const handleCollapse = () => {
    setIsCollapsed(true)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  const saveAllDimensions = async () => {
    const hasSliderData = visitedDimensions.size > 0
    const hasTagData = selectedTags.length > 0

    if (!hasSliderData && !hasTagData) {
      onComplete()
      return
    }

    setIsSaving(true)
    try {
      const dimensionScores: Record<string, number> = {}
      for (const key of visitedDimensions) {
        dimensionScores[key] = sliderValues[key]
      }

      // Build dimension tags
      const dimensionTags: Record<string, string[]> = {}
      if (tagDimension && selectedTags.length > 0) {
        dimensionTags[tagDimension.key] = selectedTags
      }

      console.log("[v0] Saving breakdown - dimensionScores:", dimensionScores)
      console.log("[v0] Saving breakdown - dimensionTags:", dimensionTags)
      console.log("[v0] Saving breakdown - selectedTags:", selectedTags)

      const response = await fetch("/api/ratings/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          tmdbId,
          // Legacy fields for backwards compatibility
          emotionalImpact: visitedDimensions.has("emotional_impact") ? sliderValues.emotional_impact : undefined,
          pacing: visitedDimensions.has("pacing") ? sliderValues.pacing : undefined,
          aesthetic: visitedDimensions.has("aesthetic") ? sliderValues.aesthetic : undefined,
          rewatchability: visitedDimensions.has("rewatchability") ? sliderValues.rewatchability : undefined,
          breakdownTags: selectedTags.length > 0 ? selectedTags : undefined,
          // New dynamic fields
          dimensionScores: Object.keys(dimensionScores).length > 0 ? dimensionScores : undefined,
          dimensionTags: Object.keys(dimensionTags).length > 0 ? dimensionTags : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await safeJsonParse(response)
        console.error("[v0] Breakdown save error:", errorData)
        throw new Error(errorData?.error || "Failed to save breakdown")
      }

      const result = await safeJsonParse(response)
      console.log("[v0] Breakdown save result:", result)

      setIsComplete(true)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }

      const savedBreakdown = {
        dimensionScores: Object.keys(dimensionScores).length > 0 ? dimensionScores : undefined,
        dimensionTags: Object.keys(dimensionTags).length > 0 ? dimensionTags : undefined,
      }

      setTimeout(() => {
        onComplete(savedBreakdown)
      }, 2000)
    } catch (error) {
      console.error("Error saving breakdown:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleValueChange = (dimensionKey: string, newValue: number) => {
    setSliderValues((prev) => ({ ...prev, [dimensionKey]: newValue }))
    setTouchedDimensions((prev) => new Set(prev).add(dimensionKey))
    resetIdleTimer()
  }

  const handleTagToggle = (tagKey: string) => {
    setSelectedTags((prev) => (prev.includes(tagKey) ? prev.filter((t) => t !== tagKey) : [...prev, tagKey]))
    resetIdleTimer()
  }

  const handleIncrement = (dimensionKey: string, max: number) => {
    const currentVal = sliderValues[dimensionKey] || 3
    if (currentVal < max) {
      handleValueChange(dimensionKey, currentVal + 1)
    }
  }

  const handleDecrement = (dimensionKey: string, min: number) => {
    const currentVal = sliderValues[dimensionKey] || 3
    if (currentVal > min) {
      handleValueChange(dimensionKey, currentVal - 1)
    }
  }

  const totalSteps = sliderDimensions.length + (tagDimension ? 1 : 0)
  const isTagStep = currentStep >= sliderDimensions.length && tagDimension
  const isLastStep = currentStep === totalSteps - 1

  const handleNext = () => {
    resetIdleTimer()
    if (!isTagStep && sliderDimensions[currentStep]) {
      setVisitedDimensions((prev) => new Set(prev).add(sliderDimensions[currentStep].key))
    }
    if (!isLastStep) {
      setCurrentStep(currentStep + 1)
    } else {
      saveAllDimensions()
    }
  }

  const handleSkipDimension = () => {
    resetIdleTimer()
    if (!isLastStep) {
      setCurrentStep(currentStep + 1)
    } else {
      saveAllDimensions()
    }
  }

  const handleRefineBreakdown = () => {
    setCurrentStep(0)
    setIsCollapsed(false)
    setIsComplete(false)
    resetIdleTimer()
  }

  if (!isActive) return null

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-card border border-border shadow-sm animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
      </div>
    )
  }

  // No dimensions configured
  if (dimensions.length === 0) {
    return null
  }

  // Collapsed state
  if (isCollapsed && !isComplete) {
    return (
      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Thanks for rating!</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefineBreakdown}
            className="text-accent hover:text-accent/80 h-8 px-3"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Refine breakdown
          </Button>
        </div>
      </div>
    )
  }

  // Complete state
  if (isComplete) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 text-green-500">
          <Check className="h-5 w-5" />
          <p className="text-sm font-medium">Rating saved with breakdown!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-card border border-border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Rate the details</h4>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  idx < currentStep ? "bg-accent" : idx === currentStep ? "bg-accent/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {isTagStep && tagDimension ? (
          // Tag selection step
          <div className="space-y-3" key="tags">
            <div>
              <label className="text-sm font-medium text-foreground">{tagDimension.label}</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tagDimension.description || "Select all that apply"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagDimension.options?.map((option) => {
                const isSelected = selectedTags.includes(option.key)
                return (
                  <button
                    key={option.key}
                    onClick={() => handleTagToggle(option.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            {selectedTags.length > 0 && <p className="text-xs text-muted-foreground">{selectedTags.length} selected</p>}
          </div>
        ) : (
          // Slider step
          sliderDimensions[currentStep] && (
            <div className="space-y-3" key={sliderDimensions[currentStep].key}>
              <div>
                <label className="text-sm font-medium text-foreground">{sliderDimensions[currentStep].label}</label>
                <p className="text-xs text-muted-foreground mt-0.5">{sliderDimensions[currentStep].description}</p>
              </div>

              {/* Smoother slider */}
              <Slider
                value={[sliderValues[sliderDimensions[currentStep].key]]}
                onValueChange={([v]) => handleValueChange(sliderDimensions[currentStep].key, v)}
                min={sliderDimensions[currentStep].minValue ?? 1}
                max={sliderDimensions[currentStep].maxValue ?? 5}
                step={sliderDimensions[currentStep].step ?? 0.5}
                className="w-full cursor-pointer [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:transition-transform [&_[role=slider]]:hover:scale-110"
                aria-label={sliderDimensions[currentStep].label}
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Low</span>
                <span>High</span>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDecrement(sliderDimensions[currentStep].key, sliderDimensions[currentStep].minValue ?? 1)
                  }
                  disabled={
                    sliderValues[sliderDimensions[currentStep].key] <= (sliderDimensions[currentStep].minValue ?? 1)
                  }
                  className="h-10 w-10 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="Decrease value"
                >
                  <Minus className="h-5 w-5" />
                </button>

                <span
                  className={`text-3xl font-bold min-w-[3rem] text-center tabular-nums transition-colors ${
                    touchedDimensions.has(sliderDimensions[currentStep].key) ? "text-accent" : "text-foreground"
                  }`}
                >
                  {sliderValues[sliderDimensions[currentStep].key]}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleIncrement(sliderDimensions[currentStep].key, sliderDimensions[currentStep].maxValue ?? 5)
                  }
                  disabled={
                    sliderValues[sliderDimensions[currentStep].key] >= (sliderDimensions[currentStep].maxValue ?? 5)
                  }
                  className="h-10 w-10 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="Increase value"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <button
            onClick={handleSkipDimension}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Skip
          </button>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={isSaving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 px-4"
          >
            {isSaving ? (
              "Saving..."
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Save Breakdown
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
