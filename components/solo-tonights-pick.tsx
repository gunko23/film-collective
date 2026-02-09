"use client"

import { useState, useEffect } from "react"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"
import { C } from "@/components/tonights-pick/constants"
import { IconChevronLeft, IconUsers, IconFilm } from "@/components/tonights-pick/icons"
import { IconCheck } from "@/components/tonights-pick/icons"
import { MoodFiltersStep } from "@/components/tonights-pick/mood-filters-step"
import { RecommendationCard } from "@/components/tonights-pick/recommendation-card"
import type { GenrePreference, MovieRecommendation, Mood, ContentLevel } from "@/components/tonights-pick/types"

// ── Solo-specific types ──
type SoloPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

// ── Solo Step Indicator (2-step: Mood -> Results) ──
function StepIndicator({ step }: { step: "mood" | "results" }) {
  const steps = ["mood", "results"] as const
  const stepIndex = steps.indexOf(step)

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 0",
    }}>
      {steps.map((s, i) => {
        const isActive = step === s
        const isCompleted = stepIndex > i

        let bg: string
        let borderColor: string
        let textColor: string

        if (isCompleted) {
          bg = `linear-gradient(135deg, ${C.orange}, ${C.orangeMuted})`
          borderColor = C.orange
          textColor = C.warmBlack
        } else if (isActive) {
          bg = `linear-gradient(135deg, ${C.blue}, ${C.blueMuted})`
          borderColor = C.blue
          textColor = C.cream
        } else {
          bg = "transparent"
          borderColor = C.creamFaint
          textColor = C.creamFaint
        }

        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: bg, border: `2px solid ${borderColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, color: textColor,
                transition: "all 0.3s",
              }}>
                {isCompleted ? <IconCheck size={14} color={C.warmBlack} /> : i + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? C.cream : C.creamFaint, whiteSpace: "nowrap",
              }}>
                {s === "mood" ? "Mood & Filters" : "Results"}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 32, height: 2, borderRadius: 1,
                background: isCompleted ? `${C.orange}60` : "rgba(232,226,214,0.1)",
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Back Nav ──
function BackNav({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none", cursor: "pointer",
          padding: "6px 0", color: C.creamMuted, fontSize: 14, fontWeight: 500,
        }}
      >
        <IconChevronLeft size={18} color={C.creamMuted} />
        <span>Back</span>
      </button>
    </div>
  )
}

// ── User Profile Summary ──
function UserProfileSummary() {
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: C.bgCard, border: "1px solid rgba(232,226,214,0.06)",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px 18px",
        gap: 10,
      }}>
        {/* Solo avatar */}
        <div style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.orange}cc, ${C.orangeMuted}88)`,
          border: `2px solid ${C.bg}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <IconUsers size={14} color={C.bg} />
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.cream }}>
            Tonight&apos;s Picks
          </div>
          <div style={{ fontSize: 12, color: C.creamFaint, marginTop: 3 }}>
            based on your ratings
          </div>
        </div>

        {/* Small gold accent divider */}
        <div style={{
          width: 32,
          height: 1.5,
          borderRadius: 1,
          background: "linear-gradient(90deg, transparent, #d4a05088, transparent)",
        }} />
      </div>
    </div>
  )
}

// ── Main Component ──
type SoloTonightsPickProps = {
  onBack?: () => void
}

export function SoloTonightsPick({ onBack }: SoloTonightsPickProps) {
  const [step, setStep] = useState<"mood" | "results">("mood")
  const [selectedMood, setSelectedMood] = useState<Mood>(null)
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
          mood: selectedMood,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Back navigation */}
      {onBack && <BackNav onBack={onBack} />}

      {/* Inline keyframes */}
      <style>{`
        @keyframes sfFadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* Error */}
      {error && (
        <div style={{
          borderRadius: 10, padding: 14, fontSize: 14,
          background: `${C.red}14`, border: `1px solid ${C.red}40`, color: C.red,
        }}>
          {error}
        </div>
      )}

      {/* Step 1: Mood & Filters */}
      {step === "mood" && (
        <MoodFiltersStep
          selectedMood={selectedMood}
          setSelectedMood={setSelectedMood}
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

      {/* Sticky Get Recommendations Button */}
      {step === "mood" && !loading && (
        <div
          className="sticky bottom-20 lg:bottom-0 z-10"
          style={{
            paddingTop: 12, paddingBottom: 8,
            marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
            background: `linear-gradient(to top, ${C.bg}, ${C.bg}ee, transparent)`,
          }}
        >
          <button
            onClick={() => getRecommendations(1)}
            disabled={loading}
            style={{
              width: "100%", height: 48, borderRadius: 14,
              fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeMuted})`,
              color: C.warmBlack,
              transition: "opacity 0.15s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: 18 }}>&#10022;</span>
            Get Recommendations
          </button>
        </div>
      )}

      {/* Step 2: Results */}
      {step === "results" && results && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <UserProfileSummary />

          {/* Recommendations List */}
          {results.recommendations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
                <IconFilm size={24} color={C.creamMuted} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: C.cream, margin: "0 0 8px" }}>No recommendations found</p>
              <p style={{ fontSize: 13, color: C.creamMuted, margin: 0 }}>
                Try adjusting your mood or runtime preferences
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {results.recommendations.map((movie, index) => (
                <RecommendationCard key={movie.tmdbId} movie={movie} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Results Buttons */}
      {step === "results" && results && (
        <div
          className="sticky bottom-20 lg:bottom-0 z-10"
          style={{
            paddingTop: 12, paddingBottom: 8,
            marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
            background: `linear-gradient(to top, ${C.bg}, ${C.bg}ee, transparent)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setStep("mood")}
              style={{
                flex: 1, height: 44, borderRadius: 14,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: C.warmBlack,
                border: `1px solid rgba(232,226,214,0.1)`,
                color: C.cream,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.bgCard }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.warmBlack }}
            >
              <IconChevronLeft size={16} color={C.cream} />
              Back
            </button>
            <button
              onClick={shuffleResults}
              disabled={loading}
              style={{
                flex: 1.4, height: 44, borderRadius: 14,
                fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: `linear-gradient(135deg, ${C.orange}, ${C.orangeMuted})`,
                color: C.warmBlack,
                transition: "opacity 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Shuffle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
