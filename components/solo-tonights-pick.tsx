"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"
import { C, FONT_STACK } from "@/components/tonights-pick/constants"
import { IconFilm } from "@/components/tonights-pick/icons"
import { GrainOverlay, LightLeaks } from "@/components/tonights-pick/decorative"
import { StepIndicator } from "@/components/tonights-pick/step-indicator"
import { TopNav } from "@/components/tonights-pick/top-nav"
import { BottomActionBar } from "@/components/tonights-pick/bottom-action-bar"
import { MoodFiltersStep } from "@/components/tonights-pick/mood-filters-step"
import { FiltersStep } from "@/components/tonights-pick/filters-step"
import { RecommendationCard } from "@/components/tonights-pick/recommendation-card"
import type { GenrePreference, MovieRecommendation, MoodValue, Audience, ContentLevel } from "@/components/tonights-pick/types"

// ── Solo-specific types ──
type SoloPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

const SOLO_STEPS = [
  { key: "mood", label: "Mood" },
  { key: "filters", label: "Filters" },
  { key: "results", label: "Results" },
]

// ── Main Component ──
type SoloTonightsPickProps = {
  onBack?: () => void
}

export function SoloTonightsPick({ onBack }: SoloTonightsPickProps) {
  const [step, setStep] = useState<"mood" | "filters" | "results">("mood")
  const [selectedMoods, setSelectedMoods] = useState<MoodValue[]>([])
  const [audience, setAudience] = useState<Audience>("anyone")
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null)
  const [contentRating, setContentRating] = useState<string | null>(null)
  const [era, setEra] = useState<string | null>(null)
  const [startYear, setStartYear] = useState<number | null>(null)
  const [streamingProviders, setStreamingProviders] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SoloPickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1)
  const [shownTmdbIds, setShownTmdbIds] = useState<number[]>([])

  const [maxViolence, setMaxViolence] = useState<ContentLevel>(null)
  const [maxSexNudity, setMaxSexNudity] = useState<ContentLevel>(null)
  const [maxProfanity, setMaxProfanity] = useState<ContentLevel>(null)
  const [maxSubstances, setMaxSubstances] = useState<ContentLevel>(null)
  const [maxFrightening, setMaxFrightening] = useState<ContentLevel>(null)
  const [showContentFilters, setShowContentFilters] = useState(true)

  // Dismissal state
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())
  const [undoMovie, setUndoMovie] = useState<MovieRecommendation | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const handleNotInterested = useCallback((movie: MovieRecommendation) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)

    setDismissedIds(prev => new Set(prev).add(movie.tmdbId))
    setUndoMovie(movie)

    fetch("/api/dismissed-movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: movie.tmdbId, source: "recommendation" }),
    }).catch(err => console.error("Failed to dismiss movie:", err))

    undoTimerRef.current = setTimeout(() => {
      setUndoMovie(null)
      undoTimerRef.current = null
    }, 5000)
  }, [])

  const handleUndo = useCallback(() => {
    if (!undoMovie) return
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }

    const movieId = undoMovie.tmdbId
    setDismissedIds(prev => {
      const next = new Set(prev)
      next.delete(movieId)
      return next
    })
    setUndoMovie(null)

    fetch(`/api/dismissed-movies/${movieId}`, { method: "DELETE" })
      .catch(err => console.error("Failed to undo dismissal:", err))
  }, [undoMovie])

  // Load user's saved streaming providers on mount
  useEffect(() => {
    fetch("/api/streaming-providers")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.providers?.length > 0) {
          setStreamingProviders(data.providers.map((p: any) => p.providerId))
        }
      })
      .catch(() => {})
  }, [])

  const toggleStreamingProvider = (providerId: number) => {
    setStreamingProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    )
  }

  const getRecommendations = async (page: number = 1, excludeIds: number[] = []) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tonights-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moods: selectedMoods,
          audience,
          maxRuntime,
          contentRating,
          era,
          startYear,
          streamingProviders: streamingProviders.length > 0 ? streamingProviders : null,
          page,
          parentalFilters: {
            maxViolence,
            maxSexNudity,
            maxProfanity,
            maxSubstances,
            maxFrightening,
          },
          excludeTmdbIds: excludeIds.length > 0 ? excludeIds : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get recommendations")
      }

      const data = await res.json()
      // Track all shown movie IDs for future shuffles
      const newIds = (data.recommendations || []).map((r: any) => r.tmdbId)
      if (excludeIds.length > 0) {
        setShownTmdbIds([...excludeIds, ...newIds])
      } else {
        setShownTmdbIds(newIds)
      }
      setResults(data)
      setResultsPage(page)
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const shuffleResults = () => {
    getRecommendations(resultsPage + 1, shownTmdbIds)
  }

  // Show loading when fetching recommendations
  if (loading) {
    return <TonightsPickLoading />
  }

  // ── Top nav labels ──
  const topNavConfig = {
    mood: { label: "Back", action: onBack || (() => {}) },
    filters: { label: "Back to Mood", action: () => setStep("mood") },
    results: { label: "Back to Filters", action: () => setStep("filters") },
  }

  const isFullscreen = !!onBack

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        fontFamily: FONT_STACK,
        ...(isFullscreen
          ? {
              height: "100dvh",
              background: "#0e0c0a",
              overflow: "hidden",
            }
          : {
              position: "relative" as const,
              minHeight: "100vh",
            }),
      }}
    >
      {/* Grain overlay */}
      {isFullscreen && <GrainOverlay />}

      {/* Light leaks */}
      {isFullscreen && <LightLeaks />}

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Global animation keyframes */}
      <style>{`
        @keyframes sfFadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Close (X) button — exits Tonight's Pick entirely */}
      {onBack && step === "results" && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 60,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid #2a2622",
            background: "rgba(15,13,11,0.85)",
            color: "#666",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#555"
            e.currentTarget.style.color = "#aaa"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2a2622"
            e.currentTarget.style.color = "#666"
          }}
        >
          &#x2715;
        </button>
      )}

      {/* Top Nav */}
      {onBack && (
        <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
          <TopNav label={topNavConfig[step].label} onBack={topNavConfig[step].action} />
        </div>
      )}

      {/* Step Indicator */}
      <div style={{ position: "relative", zIndex: 10, paddingBottom: 16, flexShrink: 0 }}>
        <StepIndicator steps={SOLO_STEPS} currentStep={step} />
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1"
        style={{
          overflowY: "auto",
          position: "relative",
          zIndex: 5,
          paddingBottom: 16,
        }}
      >
        <div style={{ padding: "0 20px" }}>
          {/* Error */}
          {error && (
            <div
              style={{
                borderRadius: 10,
                border: `1px solid ${C.red}44`,
                background: `${C.red}12`,
                padding: "12px 16px",
                fontSize: 14,
                color: C.red,
                marginBottom: 16,
                fontFamily: FONT_STACK,
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1: MOOD */}
          {step === "mood" && (
            <MoodFiltersStep
              selectedMoods={selectedMoods}
              setSelectedMoods={setSelectedMoods}
            />
          )}

          {/* STEP 2: FILTERS */}
          {step === "filters" && (
            <FiltersStep
              audience={audience}
              setAudience={setAudience}
              maxRuntime={maxRuntime}
              setMaxRuntime={setMaxRuntime}
              contentRating={contentRating}
              setContentRating={setContentRating}
              era={era}
              setEra={setEra}
              startYear={startYear}
              setStartYear={setStartYear}
              streamingProviders={streamingProviders}
              setStreamingProviders={setStreamingProviders}
              toggleStreamingProvider={toggleStreamingProvider}
              maxViolence={maxViolence}
              setMaxViolence={setMaxViolence}
              maxSexNudity={maxSexNudity}
              setMaxSexNudity={setMaxSexNudity}
              maxProfanity={maxProfanity}
              setMaxProfanity={setMaxProfanity}
              maxSubstances={maxSubstances}
              setMaxSubstances={setMaxSubstances}
              maxFrightening={maxFrightening}
              setMaxFrightening={setMaxFrightening}
              showContentFilters={showContentFilters}
              setShowContentFilters={setShowContentFilters}
            />
          )}

          {/* STEP 3: RESULTS */}
          {step === "results" && results && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Results header */}
              <div>
                <div style={{
                  fontFamily: FONT_STACK, fontSize: 18, fontWeight: 600,
                  color: C.cream, letterSpacing: "-0.02em", marginBottom: 6,
                }}>Your Picks for Tonight</div>
                <div style={{
                  fontSize: 13, color: C.creamMuted, marginBottom: 4, lineHeight: 1.5,
                }}>Based on your taste and mood</div>
              </div>

              {/* Recommendations List */}
              {(() => {
                const visibleMovies = results.recommendations.filter(m => !dismissedIds.has(m.tmdbId))
                if (results.recommendations.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <div style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
                        <IconFilm size={24} color={C.creamMuted} />
                      </div>
                      <p style={{ fontSize: 17, fontWeight: 600, color: C.cream, margin: "0 0 8px" }}>No recommendations found</p>
                      <p style={{ fontSize: 13, color: C.creamMuted, margin: 0 }}>
                        Try adjusting your mood or runtime preferences
                      </p>
                    </div>
                  )
                }
                if (visibleMovies.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <p style={{ fontSize: 17, fontWeight: 600, color: C.cream, margin: "0 0 8px" }}>
                        No picks left
                      </p>
                      <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 20px" }}>
                        You dismissed all recommendations
                      </p>
                      <button
                        onClick={shuffleResults}
                        style={{
                          background: "none",
                          border: "1px solid #3a3430",
                          borderRadius: 8,
                          padding: "10px 20px",
                          color: "#d4a050",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: FONT_STACK,
                          cursor: "pointer",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a050" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3430" }}
                      >
                        Shuffle for new picks
                      </button>
                    </div>
                  )
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {results.recommendations.map((movie) => {
                      const isDismissed = dismissedIds.has(movie.tmdbId)
                      const visibleIndex = visibleMovies.indexOf(movie)
                      return (
                        <div
                          key={movie.tmdbId}
                          style={{
                            opacity: isDismissed ? 0 : 1,
                            maxHeight: isDismissed ? 0 : 2000,
                            marginBottom: isDismissed ? -14 : 0,
                            overflow: "hidden",
                            transition: "opacity 0.3s ease, max-height 0.3s ease, margin-bottom 0.3s ease",
                          }}
                        >
                          <RecommendationCard
                            movie={movie}
                            index={visibleIndex >= 0 ? visibleIndex : 0}
                            onNotInterested={() => handleNotInterested(movie)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Dismiss undo toast */}
              {undoMovie && (
                <div
                  style={{
                    position: "sticky",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px 16px",
                    background: "#1a1816",
                    borderTop: "1px solid #2a2420",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 10,
                    marginTop: 14,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#8a7e70", fontFamily: FONT_STACK }}>
                    Removed from recommendations
                  </span>
                  <button
                    onClick={handleUndo}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#d4a050",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: FONT_STACK,
                      cursor: "pointer",
                      padding: "2px 4px",
                    }}
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <BottomActionBar
        step={step}
        loading={loading}
        showBack={step !== "mood"}
        onContinue={() => setStep("filters")}
        onGetRecommendations={() => getRecommendations(1)}
        onBack={() => {
          if (step === "filters") setStep("mood")
          else if (step === "results") setStep("filters")
        }}
        onShuffle={shuffleResults}
        hasResults={!!results}
      />
    </div>
  )
}
