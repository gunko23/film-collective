"use client"

import { SimpleStarRating } from "@/components/simple-star-rating"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { InlineBreakdownFlow } from "@/components/inline-breakdown-flow"

export interface ExistingBreakdown {
  dimensionScores?: Record<string, number>
  dimensionTags?: Record<string, string[]>
  // Legacy fields kept for backwards compatibility
  emotional_impact?: number
  pacing?: number
  aesthetic?: number
  rewatchability?: number
  breakdown_tags?: string[]
  breakdown_notes?: string
}

interface RatingSectionProps {
  user: object | null
  isRateLimited: boolean
  userRating: number
  setUserRating: (rating: number) => void
  userComment: string
  setUserComment: (comment: string) => void
  isSaving: boolean
  saveMessage: string | null
  isEditMode: boolean
  setIsEditMode: (editing: boolean) => void
  showBreakdownFlow: boolean
  setShowBreakdownFlow: (show: boolean) => void
  existingBreakdown: ExistingBreakdown | undefined
  hasExistingRating: boolean
  handleSaveRating: () => void
  handleBreakdownComplete: (savedBreakdown?: {
    dimensionScores?: Record<string, number>
    dimensionTags?: Record<string, string[]>
  }) => void
  isMovie: boolean
  tmdbId: number
}

export function RatingSection({
  user,
  isRateLimited,
  userRating,
  setUserRating,
  userComment,
  setUserComment,
  isSaving,
  saveMessage,
  isEditMode,
  setIsEditMode,
  showBreakdownFlow,
  setShowBreakdownFlow,
  existingBreakdown,
  hasExistingRating,
  handleSaveRating,
  handleBreakdownComplete,
  isMovie,
  tmdbId,
}: RatingSectionProps) {
  return (
    <div className="space-y-3 sm:space-y-4 rounded-xl bg-card p-3 sm:p-6 ring-1 ring-border/50">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your Rating
        </h2>
        {!user && (
          <Button
            variant="link"
            size="sm"
            onClick={() => (window.location.href = "/auth/signin")} // Redirect to sign in page
            className="text-accent p-0 h-auto text-[10px] sm:text-xs"
          >
            Sign in to rate
          </Button>
        )}
      </div>

      {user && (
        <>
          {!showBreakdownFlow ? (
            <>
              {!hasExistingRating || isEditMode ? (
                <SimpleStarRating
                  value={userRating}
                  onChange={setUserRating}
                  disabled={isSaving || isRateLimited}
                />
              ) : (
                <SimpleStarRating value={userRating} onChange={() => {}} readonly={true} />
              )}
              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  placeholder={`Your thoughts on this ${isMovie ? "film" : "show"}...`}
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="min-h-[60px] sm:min-h-[80px] resize-none bg-background text-xs sm:text-sm"
                  disabled={isSaving || isRateLimited || (hasExistingRating && !isEditMode)}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                {hasExistingRating && !isEditMode ? (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    disabled={isRateLimited}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Update Rating
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveRating}
                    disabled={isSaving || userRating === 0 || isRateLimited}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {isSaving ? "Saving..." : "Save Rating"}
                  </Button>
                )}
                {isEditMode && (
                  <Button
                    onClick={() => setIsEditMode(false)}
                    variant="outline"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
                {saveMessage && (
                  <span
                    className={`text-xs sm:text-sm text-center sm:text-left ${saveMessage === "Saved" ? "text-green-500" : "text-red-500"}`}
                  >
                    {saveMessage}
                  </span>
                )}
              </div>
              {existingBreakdown && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Your breakdown:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {existingBreakdown.dimensionScores &&
                      Object.entries(existingBreakdown.dimensionScores).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-muted rounded capitalize">
                          {key.replace(/_/g, " ")}: {value}/5
                        </span>
                      ))}
                    {!existingBreakdown.dimensionScores && (
                      <>
                        {existingBreakdown.emotional_impact && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Emotional: {existingBreakdown.emotional_impact}/5
                          </span>
                        )}
                        {existingBreakdown.pacing && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Pacing: {existingBreakdown.pacing}/5
                          </span>
                        )}
                        {existingBreakdown.aesthetic && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Aesthetic: {existingBreakdown.aesthetic}/5
                          </span>
                        )}
                        {existingBreakdown.rewatchability && (
                          <span className="px-2 py-1 bg-muted rounded">
                            Rewatchability: {existingBreakdown.rewatchability}/5
                          </span>
                        )}
                      </>
                    )}
                    {existingBreakdown.dimensionTags &&
                      Object.entries(existingBreakdown.dimensionTags).map(([dimKey, tags]) =>
                        tags.map((tag) => (
                          <span
                            key={`${dimKey}-${tag}`}
                            className="px-2 py-1 bg-accent/20 text-accent rounded capitalize"
                          >
                            {tag.replace(/_/g, " ")}
                          </span>
                        )),
                      )}
                    {!existingBreakdown.dimensionTags &&
                      existingBreakdown.breakdown_tags?.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-accent/20 text-accent rounded capitalize">
                          {tag.replace(/_/g, " ")}
                        </span>
                      ))}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowBreakdownFlow(true)}
                    className="mt-2 h-auto p-0 text-accent"
                  >
                    Edit breakdown
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <SimpleStarRating rating={userRating} readonly size="lg" />
              <span className="text-sm text-muted-foreground">Rating saved!</span>
              <InlineBreakdownFlow
                isActive={showBreakdownFlow}
                mediaType={isMovie ? "movie" : "tv"}
                tmdbId={tmdbId}
                onComplete={handleBreakdownComplete}
                existingBreakdown={existingBreakdown}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
