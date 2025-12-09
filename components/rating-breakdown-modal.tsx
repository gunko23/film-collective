"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface RatingBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  mediaType: "movie" | "tv"
  tmdbId: number
  mediaTitle: string
  onSaveSuccess: () => void
  existingBreakdown?: {
    emotional_impact?: number
    pacing?: number
    aesthetic?: number
    rewatchability?: number
    breakdown_tags?: string[]
    breakdown_notes?: string
  }
}

const PREDEFINED_TAGS = [
  "Cozy",
  "Tense",
  "Visually stunning",
  "Character-driven",
  "Plot-driven",
  "Slow burn",
  "Fast-paced",
  "Funny",
  "Bleak",
  "Feel-good",
  "Weird",
  "Comfort rewatch",
  "Thought-provoking",
  "Heartwarming",
  "Edge of seat",
]

const DIMENSION_LABELS = {
  emotional_impact: "Emotional Impact",
  pacing: "Pacing",
  aesthetic: "Aesthetic",
  rewatchability: "Rewatchability",
}

export function RatingBreakdownModal({
  isOpen,
  onClose,
  mediaType,
  tmdbId,
  mediaTitle,
  onSaveSuccess,
  existingBreakdown,
}: RatingBreakdownModalProps) {
  const [emotionalImpact, setEmotionalImpact] = useState(3)
  const [pacing, setPacing] = useState(3)
  const [aesthetic, setAesthetic] = useState(3)
  const [rewatchability, setRewatchability] = useState(3)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [skipNextTime, setSkipNextTime] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Pre-fill with existing breakdown data if available
  useEffect(() => {
    if (existingBreakdown) {
      setEmotionalImpact(existingBreakdown.emotional_impact || 3)
      setPacing(existingBreakdown.pacing || 3)
      setAesthetic(existingBreakdown.aesthetic || 3)
      setRewatchability(existingBreakdown.rewatchability || 3)
      setSelectedTags(existingBreakdown.breakdown_tags || [])
      setNotes(existingBreakdown.breakdown_notes || "")
    } else {
      // Reset to defaults when no existing breakdown
      setEmotionalImpact(3)
      setPacing(3)
      setAesthetic(3)
      setRewatchability(3)
      setSelectedTags([])
      setNotes("")
    }
    setSkipNextTime(false)
  }, [existingBreakdown, isOpen])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const res = await fetch("/api/ratings/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          tmdbId,
          emotionalImpact,
          pacing,
          aesthetic,
          rewatchability,
          breakdownTags: selectedTags,
          breakdownNotes: notes || null,
          skipBreakdownNextTime: skipNextTime,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save breakdown")
      }

      onSaveSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving breakdown:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Rate Breakdown: {mediaTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dimension Sliders */}
          <div className="space-y-5">
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
              const value =
                key === "emotional_impact"
                  ? emotionalImpact
                  : key === "pacing"
                    ? pacing
                    : key === "aesthetic"
                      ? aesthetic
                      : rewatchability
              const setValue =
                key === "emotional_impact"
                  ? setEmotionalImpact
                  : key === "pacing"
                    ? setPacing
                    : key === "aesthetic"
                      ? setAesthetic
                      : setRewatchability

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">{label}</Label>
                    <span className="text-sm font-bold text-accent">{value}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => setValue(v)}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tag Chips */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Vibe Tags</Label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="breakdown-notes" className="text-sm font-medium">
              Why did you rate it this way? (optional)
            </Label>
            <Textarea
              id="breakdown-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[80px] resize-none bg-background"
            />
          </div>

          {/* Skip Next Time Toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <Label htmlFor="skip-breakdown" className="text-sm cursor-pointer">
              Skip breakdown next time (just save stars)
            </Label>
            <Switch id="skip-breakdown" checked={skipNextTime} onCheckedChange={setSkipNextTime} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-accent hover:bg-accent/90" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Breakdown"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
