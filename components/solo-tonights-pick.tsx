"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  Film,
  Popcorn,
  Heart,
  Zap,
  Brain,
  Trophy,
  RefreshCw,
  ExternalLink,
  Info,
  ChevronLeft,
  Volume2,
  Swords,
  Wine,
  Ghost,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Check,
} from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import { Button } from "@/components/ui/button"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"

type GenrePreference = {
  genreId: number
  genreName: string
  avgScore: number
  ratingCount: number
}

type ParentalGuideInfo = {
  sexNudity: "None" | "Mild" | "Moderate" | "Severe" | null
  violence: "None" | "Mild" | "Moderate" | "Severe" | null
  profanity: "None" | "Mild" | "Moderate" | "Severe" | null
  alcoholDrugsSmoking: "None" | "Mild" | "Moderate" | "Severe" | null
  frighteningIntense: "None" | "Mild" | "Moderate" | "Severe" | null
}

type MovieRecommendation = {
  tmdbId: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  runtime: number | null
  genres: { id: number; name: string }[]
  voteAverage: number
  certification?: string | null
  imdbId?: string | null
  groupFitScore: number
  genreMatchScore: number
  reasoning: string[]
  seenBy: string[]
  parentalGuide?: ParentalGuideInfo | null
}

type SoloPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

type Mood = "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null

const MOOD_OPTIONS: { value: Mood; label: string; icon: React.ReactNode; description: string }[] = [
  { value: null, label: "Any Mood", icon: <Sparkles className="h-5 w-5" />, description: "Show me everything" },
  { value: "fun", label: "Fun", icon: <Popcorn className="h-5 w-5" />, description: "Light & entertaining" },
  { value: "intense", label: "Intense", icon: <Zap className="h-5 w-5" />, description: "Edge of your seat" },
  { value: "emotional", label: "Emotional", icon: <Heart className="h-5 w-5" />, description: "Feel all the feels" },
  { value: "mindless", label: "Mindless", icon: <Brain className="h-5 w-5" />, description: "Turn brain off" },
  { value: "acclaimed", label: "Acclaimed", icon: <Trophy className="h-5 w-5" />, description: "Critics' favorites" },
]

// Fit Score Ring Component
const FitScoreRing = ({ score }: { score: number }) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? "#6abf6e" : score >= 60 ? "#D4753E" : "#a09890"

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(232,224,216,0.08)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold"
        style={{ color }}
      >
        {score}
      </div>
    </div>
  )
}

// Parental Badge Component
const ParentalBadge = ({ category, severity }: { category: string; severity: string }) => {
  if (!severity || severity === "None") return null

  const severityColors = {
    None: { bg: "rgba(76, 175, 80, 0.12)", text: "#6abf6e", border: "rgba(76, 175, 80, 0.25)" },
    Mild: { bg: "rgba(212, 117, 62, 0.10)", text: "#D4753E", border: "rgba(212, 117, 62, 0.25)" },
    Moderate: { bg: "rgba(255, 183, 77, 0.10)", text: "#ffb74d", border: "rgba(255, 183, 77, 0.25)" },
    Severe: { bg: "rgba(244, 67, 54, 0.10)", text: "#f44336", border: "rgba(244, 67, 54, 0.25)" },
  }

  const severityLabels: Record<string, string> = {
    violence: "Violence",
    sexNudity: "Sex/Nudity",
    profanity: "Language",
    alcoholDrugsSmoking: "Substances",
    frighteningIntense: "Intense",
  }

  const colors = severityColors[severity as keyof typeof severityColors] || severityColors.Mild

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <span>{severityLabels[category]}: {severity}</span>
    </div>
  )
}

// Recommendation Card Component
const RecommendationCard = ({ movie, index }: { movie: MovieRecommendation; index: number }) => {
  const [parentalGuideOpen, setParentalGuideOpen] = useState(false)

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ""
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const mins = movie.runtime ? movie.runtime % 60 : 0
  const runtimeStr = movie.runtime ? `${hours}h ${mins}m` : null
  const reasoningText = movie.reasoning?.[0] || ""

  // Check if parental guide has any content
  const guide = movie.parentalGuide
  const categories = ["violence", "sexNudity", "profanity", "alcoholDrugsSmoking", "frighteningIntense"] as const
  const hasParentalContent = guide && categories.some(c => guide[c] && guide[c] !== "None")

  // Find highest severity for summary
  const severityRank = { None: 0, Mild: 1, Moderate: 2, Severe: 3 }
  const maxSeverity = guide ? categories.reduce((max, cat) => {
    const level = guide[cat] || "None"
    return severityRank[level as keyof typeof severityRank] > severityRank[max as keyof typeof severityRank] ? level : max
  }, "None") : "None"

  const summaryColors = {
    None: { bg: "rgba(76, 175, 80, 0.12)", text: "#6abf6e", border: "rgba(76, 175, 80, 0.25)" },
    Mild: { bg: "rgba(212, 117, 62, 0.10)", text: "#D4753E", border: "rgba(212, 117, 62, 0.25)" },
    Moderate: { bg: "rgba(255, 183, 77, 0.10)", text: "#ffb74d", border: "rgba(255, 183, 77, 0.25)" },
    Severe: { bg: "rgba(244, 67, 54, 0.10)", text: "#f44336", border: "rgba(244, 67, 54, 0.25)" },
  }
  const summaryColor = summaryColors[maxSeverity as keyof typeof summaryColors] || summaryColors.Mild

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        background: "linear-gradient(135deg, rgba(30,26,22,0.95) 0%, rgba(20,17,14,0.98) 100%)",
        borderColor: "rgba(232,224,216,0.07)",
        animation: `fadeSlideIn 0.4s ease ${index * 0.08}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(212,117,62,0.25)"
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(232,224,216,0.07)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Header: Poster + Meta */}
      <div className="flex gap-3.5 p-4 pb-0">
        {/* Poster */}
        <div className="flex-shrink-0">
          {movie.posterPath ? (
            <Image
              src={getImageUrl(movie.posterPath, "w185") || ""}
              alt={movie.title}
              width={80}
              height={120}
              className="rounded-lg object-cover w-20 h-[120px] shadow-lg"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
            />
          ) : (
            <div className="w-20 h-[120px] bg-[rgba(232,224,216,0.05)] rounded-lg flex items-center justify-center shadow-lg">
              <Film className="h-6 w-6 text-[#a09890]" />
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[17px] font-bold leading-[1.25] text-[#e8e0d8] line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {movie.title}
            </h3>
            <FitScoreRing score={movie.groupFitScore} />
          </div>

          {/* Year · Rating · Runtime row */}
          <div className="flex items-center gap-2 flex-wrap text-[13px] text-[#a09890]">
            <span>{year}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[#D4753E] text-[13px]">★</span>
              <span className="text-[#e8e0d8] font-mono font-medium text-[13px]">
                {movie.voteAverage?.toFixed(1)}
              </span>
            </span>
            {runtimeStr && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>{runtimeStr}</span>
              </>
            )}
          </div>

          {/* Genre pills */}
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {movie.genres?.slice(0, 3).map(g => (
              <span
                key={g.id}
                className="inline-block px-2 py-0.5 rounded text-[11px] font-medium text-[#a09890]"
                style={{
                  background: "rgba(232,224,216,0.06)",
                  border: "1px solid rgba(232,224,216,0.08)",
                  letterSpacing: "0.02em",
                }}
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reasoning Section */}
      <div className="px-4 pt-3.5">
        <div
          className="rounded-[10px] p-3.5"
          style={{
            background: "rgba(212,117,62,0.04)",
            borderLeft: "3px solid rgba(212,117,62,0.35)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Check className="h-3.5 w-3.5 text-[#D4753E] opacity-70" />
            <span
              className="text-[10px] font-semibold text-[#D4753E] opacity-70 uppercase tracking-wider"
            >
              Why we picked this
            </span>
          </div>
          <p className="text-[13.5px] leading-[1.55] text-[#c8c0b8] m-0">
            {reasoningText}
          </p>
        </div>
      </div>

      {/* Seen By */}
      {movie.seenBy?.length > 0 && (
        <div className="px-4 pt-2 flex items-center gap-1.5 text-[11px] text-[#a09890] opacity-70">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>You may have seen this</span>
        </div>
      )}

      {/* Parental Guide (collapsed) */}
      {hasParentalContent && (
        <div className="px-4 pt-2">
          <button
            onClick={() => setParentalGuideOpen(!parentalGuideOpen)}
            className="inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-1 text-[12px] opacity-85 hover:opacity-100 transition-opacity"
            style={{ color: summaryColor.text }}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="font-medium">Parental Guide</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{
                background: summaryColor.bg,
                border: `1px solid ${summaryColor.border}`,
              }}
            >
              Up to {maxSeverity}
            </span>
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${parentalGuideOpen ? "rotate-180" : ""}`}
            />
          </button>

          {parentalGuideOpen && guide && (
            <div
              className="flex flex-wrap gap-1.5 mt-2 pt-2"
              style={{
                borderTop: "1px solid rgba(232,224,216,0.06)",
                animation: "fadeSlideIn 0.2s ease",
              }}
            >
              {categories.map(cat => (
                <ParentalBadge key={cat} category={cat} severity={guide[cat] || "None"} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-end items-center gap-2 px-4 py-3.5 pt-3">
        <button
          onClick={() => window.location.href = `/movies/${movie.tmdbId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-150"
          style={{
            background: "rgba(212,117,62,0.12)",
            border: "1px solid rgba(212,117,62,0.2)",
            color: "#D4753E",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(212,117,62,0.2)"
            e.currentTarget.style.borderColor = "rgba(212,117,62,0.35)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(212,117,62,0.12)"
            e.currentTarget.style.borderColor = "rgba(212,117,62,0.2)"
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Details
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export function SoloTonightsPick() {
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

  type ContentLevel = "None" | "Mild" | "Moderate" | "Severe" | null
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

  const getRecommendations = async (page: number = 1) => {
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
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get recommendations")
      }

      const data = await res.json()
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
    getRecommendations(resultsPage + 1)
  }

  const reset = () => {
    setStep("mood")
    setResults(null)
    setSelectedMood(null)
    setContentRating(null)
    setResultsPage(1)
  }

  // Show fullscreen loading when fetching recommendations
  if (loading) {
    return <TonightsPickLoading />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/30">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Tonight&apos;s Pick</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Find something to watch</p>
          </div>
        </div>
        {step === "results" && (
          <Button variant="outline" onClick={reset} size="sm" className="gap-2 self-start sm:self-auto">
            <RefreshCw className="h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 sm:p-3 sm:justify-start sm:gap-4">
        {["mood", "results"].map((s, i) => {
          const stepIndex = ["mood", "results"].indexOf(step)
          const isActive = step === s
          const isCompleted = stepIndex > i

          return (
            <div key={s} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : isCompleted
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm whitespace-nowrap ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s === "mood" ? "Mood & Filters" : "Results"}
                </span>
              </div>
              {i < 1 && (
                <div className={`hidden sm:block w-8 h-0.5 rounded-full ${isCompleted ? "bg-accent/40" : "bg-muted"}`} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Step 1: Mood & Filters */}
      {step === "mood" && (
        <div className="space-y-5 sm:space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              What are you in the mood for?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {MOOD_OPTIONS.map((option) => {
                const isSelected = selectedMood === option.value
                return (
                  <button
                    key={option.value || "any"}
                    onClick={() => setSelectedMood(option.value)}
                    className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                        : "border-border/50 bg-card/50 hover:border-accent/50 active:bg-accent/5"
                    }`}
                  >
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl ${
                        isSelected ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Runtime Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Maximum runtime (optional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[null, 90, 120, 150].map((time) => (
                <button
                  key={time || "any"}
                  onClick={() => setMaxRuntime(time)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    maxRuntime === time
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {time ? `${time}m` : "Any"}
                </button>
              ))}
            </div>
          </div>

          {/* Content Rating Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Content rating (optional)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: null, label: "Any" },
                { value: "G", label: "G" },
                { value: "PG", label: "PG" },
                { value: "PG-13", label: "PG-13" },
                { value: "R", label: "R" },
              ].map((rating) => (
                <button
                  key={rating.value || "any"}
                  onClick={() => setContentRating(rating.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    contentRating === rating.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {rating.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
            </p>
          </div>

          {/* Era Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Era (optional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: null, label: "Any" },
                { value: "1960s", label: "60s" },
                { value: "1970s", label: "70s" },
                { value: "1980s", label: "80s" },
                { value: "1990s", label: "90s" },
                { value: "2000s", label: "00s" },
                { value: "2010s", label: "10s" },
                { value: "2020s", label: "20s" },
              ].map((option) => (
                <button
                  key={option.value || "any"}
                  onClick={() => setEra(option.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    era === option.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Released After Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Released after (optional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: null, label: "Any" },
                { value: 1970, label: "1970+" },
                { value: 1980, label: "1980+" },
                { value: 1990, label: "1990+" },
                { value: 2000, label: "2000+" },
                { value: 2010, label: "2010+" },
                { value: 2020, label: "2020+" },
                { value: 2024, label: "2024+" },
              ].map((option) => (
                <button
                  key={option.value || "any"}
                  onClick={() => setStartYear(option.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    startYear === option.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {era && startYear ? (
              <p className="text-xs text-muted-foreground mt-2">
                Era filter takes priority over released after
              </p>
            ) : null}
          </div>

          {/* Streaming Services Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Streaming services (optional)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {US_SUBSCRIPTION_PROVIDERS.map((provider) => {
                const isSelected = streamingProviders.includes(provider.id)
                return (
                  <button
                    key={provider.id}
                    onClick={() => toggleStreamingProvider(provider.id)}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                    }`}
                  >
                    <Image
                      src={getImageUrl(provider.logoPath, "w92") || ""}
                      alt={provider.shortName}
                      width={22}
                      height={22}
                      className="rounded-md flex-shrink-0"
                    />
                    <span className="text-xs truncate">{provider.shortName}</span>
                  </button>
                )
              })}
            </div>
            {streamingProviders.length > 0 && (
              <button
                onClick={() => setStreamingProviders([])}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear streaming filter
              </button>
            )}
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              Streaming data by JustWatch
            </p>
          </div>

          {/* Parental Content Filters */}
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowContentFilters(!showContentFilters)}
              className="w-full flex items-center justify-between p-3 sm:p-4 bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-foreground">Content Filters</span>
                {(maxViolence || maxSexNudity || maxProfanity || maxSubstances || maxFrightening) && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                    Active
                  </span>
                )}
              </div>
              {showContentFilters ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showContentFilters && (
              <div className="p-3 sm:p-4 space-y-4 border-t border-border/50 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setMaxViolence(null)
                      setMaxSexNudity(null)
                      setMaxProfanity(null)
                      setMaxSubstances(null)
                      setMaxFrightening(null)
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium hover:bg-card/50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      setMaxViolence("Mild")
                      setMaxSexNudity("Mild")
                      setMaxProfanity("Mild")
                      setMaxSubstances("Mild")
                      setMaxFrightening("Mild")
                    }}
                    className="px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                  >
                    Kid-Friendly
                  </button>
                  <button
                    onClick={() => {
                      setMaxViolence("Moderate")
                      setMaxSexNudity("Moderate")
                      setMaxProfanity("Moderate")
                      setMaxSubstances("Moderate")
                      setMaxFrightening("Moderate")
                    }}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    Family Night
                  </button>
                </div>

                {/* Individual Category Filters */}
                <div className="space-y-3">
                  {([
                    { label: "Violence", icon: <Swords className="h-3.5 w-3.5 text-muted-foreground" />, state: maxViolence, setter: setMaxViolence },
                    { label: "Sex/Nudity", icon: <Heart className="h-3.5 w-3.5 text-muted-foreground" />, state: maxSexNudity, setter: setMaxSexNudity },
                    { label: "Language", icon: <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />, state: maxProfanity, setter: setMaxProfanity },
                    { label: "Substances", icon: <Wine className="h-3.5 w-3.5 text-muted-foreground" />, state: maxSubstances, setter: setMaxSubstances },
                    { label: "Frightening Scenes", icon: <Ghost className="h-3.5 w-3.5 text-muted-foreground" />, state: maxFrightening, setter: setMaxFrightening },
                  ] as const).map((category) => (
                    <div key={category.label}>
                      <div className="flex items-center gap-2 mb-2">
                        {category.icon}
                        <span className="text-xs font-medium text-foreground">{category.label}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { value: null, label: "Any" },
                          { value: "None", label: "None" },
                          { value: "Mild", label: "Mild" },
                          { value: "Moderate", label: "Mod" },
                          { value: "Severe", label: "Severe" },
                        ].map((level) => (
                          <button
                            key={level.value || "any"}
                            onClick={() => category.setter(level.value as ContentLevel)}
                            className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                              category.state === level.value
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border/50 text-muted-foreground hover:border-accent/50"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Note: Movies without parental guide data in our database will still be shown.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
      {/* Sticky Get Recommendations Button */}
      {step === "mood" && !loading && (
        <div className="sticky bottom-20 lg:bottom-0 z-10 pt-3 pb-2 -mx-4 px-4 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={() => getRecommendations(1)}
            disabled={loading}
            className="w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#e07850',
              color: '#08080a',
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Finding films...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Get Recommendations
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Results */}
      {step === "results" && results && (
        <div className="space-y-4 sm:space-y-6">

          {/* User Profile Summary */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <User className="h-4 w-4" />
              <span>Based on your ratings</span>
            </div>
            {results.userProfile.sharedGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Your favorites:</span>
                {results.userProfile.sharedGenres.map((genre) => (
                  <span
                    key={genre.genreId}
                    className="px-2 py-0.5 sm:py-1 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs"
                  >
                    {genre.genreName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations List */}
          {results.recommendations.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Film className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">No recommendations found</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Try adjusting your mood or runtime preferences
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {results.recommendations.map((movie, index) => (
                <RecommendationCard key={movie.tmdbId} movie={movie} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Sticky Results Buttons */}
      {step === "results" && results && (
        <div className="sticky bottom-20 lg:bottom-0 z-10 pt-3 pb-2 -mx-4 px-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("mood")}
              className="flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: '#0f0f12',
                border: '1px solid rgba(248, 246, 241, 0.1)',
                color: '#f8f6f1',
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={shuffleResults}
              disabled={loading}
              className="flex-1 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#e07850',
                color: '#08080a',
              }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Shuffle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
