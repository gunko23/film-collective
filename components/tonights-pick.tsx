"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Sparkles,
  Users,
  Clock,
  Star,
  ChevronRight,
  Check,
  Film,
  Popcorn,
  Heart,
  Zap,
  Brain,
  Trophy,
  RefreshCw,
  ExternalLink,
  Info,
  User,
  ChevronLeft,
  AlertTriangle,
  Volume2,
  Swords,
  Wine,
  Ghost,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import { Button } from "@/components/ui/button"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"

type GroupMember = {
  userId: string
  name: string
  avatarUrl: string | null
}

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

type TonightPickResponse = {
  recommendations: MovieRecommendation[]
  groupProfile: {
    memberCount: number
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

// Generate a consistent color based on user name for default avatars
function getAvatarColor(name: string): string {
  const colors = [
    "bg-gradient-to-br from-rose-400 to-rose-600",
    "bg-gradient-to-br from-amber-400 to-orange-600",
    "bg-gradient-to-br from-emerald-400 to-emerald-600",
    "bg-gradient-to-br from-cyan-400 to-cyan-600",
    "bg-gradient-to-br from-violet-400 to-violet-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
  ]
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

type Props = {
  collectiveId: string
  currentUserId: string
  onBack?: () => void
}

export function TonightsPick({ collectiveId, currentUserId, onBack }: Props) {
  const [step, setStep] = useState<"members" | "mood" | "results">("members")
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState<Mood>(null)
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null)
  const [contentRating, setContentRating] = useState<string | null>(null) // "G", "PG", "PG-13", "R", or null for any
  const [era, setEra] = useState<string | null>(null) // "1980s", "1990s", etc. or null for any
  const [startYear, setStartYear] = useState<number | null>(null) // e.g. 2000 — movies from this year onwards
  const [streamingProviders, setStreamingProviders] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [results, setResults] = useState<TonightPickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1) // For getting different results

  // Parental content filter state - null means "any", otherwise it's the max level allowed
  type ContentLevel = "None" | "Mild" | "Moderate" | "Severe" | null
  const [maxViolence, setMaxViolence] = useState<ContentLevel>(null)
  const [maxSexNudity, setMaxSexNudity] = useState<ContentLevel>(null)
  const [maxProfanity, setMaxProfanity] = useState<ContentLevel>(null)
  const [maxSubstances, setMaxSubstances] = useState<ContentLevel>(null)
  const [maxFrightening, setMaxFrightening] = useState<ContentLevel>(null)
  const [showContentFilters, setShowContentFilters] = useState(true)

  // Fetch members on mount
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/collectives/${collectiveId}/tonight`)
        if (!res.ok) throw new Error("Failed to fetch members")
        const data = await res.json()
        setMembers(data.members)
        // Pre-select current user
        setSelectedMembers([currentUserId])
      } catch (err) {
        setError("Failed to load members")
      } finally {
        setInitialLoading(false)
      }
    }
    fetchMembers()
  }, [collectiveId, currentUserId])

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

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const selectAllMembers = () => {
    setSelectedMembers(members.map((m) => m.userId))
  }

  const getRecommendations = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/tonight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedMembers,
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
    setStep("members")
    setResults(null)
    setSelectedMood(null)
    setContentRating(null)
    setResultsPage(1)
  }

  // Avatar component with fallback for broken images
  const Avatar = ({ member, size = "md" }: { member: GroupMember; size?: "sm" | "md" | "lg" }) => {
    const [imgError, setImgError] = useState(false)

    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    }

    const dimensions = {
      sm: 32,
      md: 40,
      lg: 48,
    }

    // Show initials if no avatar URL or if image failed to load
    if (!member.avatarUrl || imgError) {
      return (
        <div
          className={`${sizeClasses[size]} ${getAvatarColor(member.name || "User")} rounded-full flex items-center justify-center text-white font-medium shadow-inner`}
        >
          {getInitials(member.name || "User")}
        </div>
      )
    }

    return (
      <Image
        src={member.avatarUrl}
        alt={member.name || "User"}
        width={dimensions[size]}
        height={dimensions[size]}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    )
  }

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
            <span>Seen by {movie.seenBy.join(", ")}</span>
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Show fullscreen loading when fetching recommendations
  if (loading) {
    return <TonightsPickLoading />
  }

  // Fullscreen mobile mode (when accessed from collective tab)
  const isFullscreenMobile = !!onBack

  return (
    <div className={isFullscreenMobile ? "min-h-screen flex flex-col" : ""}>
      {/* Back Button - Mobile Only */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-foreground/60 px-5 pt-3 mb-[15px] lg:hidden"
        >
          <ChevronLeft size={18} />
          Back to Feed
        </button>
      )}

      <div className={`space-y-4 sm:space-y-6 flex-1 ${isFullscreenMobile ? "px-5 pb-5" : ""}`}>
      {/* Progress Steps - Mobile Optimized */}
      <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 sm:p-3 sm:justify-start sm:gap-4">
        {["members", "mood", "results"].map((s, i) => {
          const stepIndex = ["members", "mood", "results"].indexOf(step)
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
                  {isCompleted ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm whitespace-nowrap ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s === "members" ? "Who" : s === "mood" ? "Mood" : "Results"}
                </span>
              </div>
              {i < 2 && (
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

      {/* Step 1: Member Selection - Mobile Optimized */}
      {step === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Who's watching tonight?
            </p>
            <Button variant="ghost" size="sm" onClick={selectAllMembers} className="text-xs h-8 px-3">
              Select All
            </Button>
          </div>

          {/* Larger touch targets for mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {members.map((member) => {
              const isSelected = selectedMembers.includes(member.userId)
              return (
                <button
                  key={member.userId}
                  onClick={() => toggleMember(member.userId)}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                      : "border-border/50 bg-card/50 hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar member={member} size="lg" />
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-sm sm:text-base font-medium text-foreground truncate block">
                      {member.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-accent">Selected</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected count indicator */}
          <div className="text-center text-sm text-muted-foreground py-2">
            {selectedMembers.length} of {members.length} selected
          </div>
        </div>
      )}
      {/* Sticky Continue Button */}
      {step === "members" && (
        <div className={`sticky ${isFullscreenMobile ? "bottom-0" : "bottom-20 lg:bottom-0"} z-10 pt-3 pb-2 ${isFullscreenMobile ? "" : "-mx-4 px-4"} bg-gradient-to-t from-background via-background to-transparent`}>
          <button
            onClick={() => setStep("mood")}
            disabled={selectedMembers.length === 0}
            className="w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedMembers.length > 0 ? '#e07850' : '#161619',
              color: selectedMembers.length > 0 ? '#08080a' : 'rgba(248, 246, 241, 0.4)',
            }}
          >
            Continue
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step 2: Mood Selection - Mobile Optimized */}
      {step === "mood" && (
        <div className="space-y-5 sm:space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              What are you in the mood for?
            </p>
            {/* 2 columns on all screens, larger touch targets */}
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

          {/* Runtime Filter - Mobile Optimized */}
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

          {/* Parental Content Filters - Collapsible */}
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
                  {/* Violence */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Violence</span>
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
                          onClick={() => setMaxViolence(level.value as ContentLevel)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            maxViolence === level.value
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sex/Nudity */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Sex/Nudity</span>
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
                          onClick={() => setMaxSexNudity(level.value as ContentLevel)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            maxSexNudity === level.value
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Profanity */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Language</span>
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
                          onClick={() => setMaxProfanity(level.value as ContentLevel)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            maxProfanity === level.value
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Substances */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wine className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Substances</span>
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
                          onClick={() => setMaxSubstances(level.value as ContentLevel)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            maxSubstances === level.value
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frightening */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Ghost className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Frightening Scenes</span>
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
                          onClick={() => setMaxFrightening(level.value as ContentLevel)}
                          className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                            maxFrightening === level.value
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/50 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Note: Movies without parental guide data in our database will still be shown.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
      {/* Sticky Mood Navigation Buttons */}
      {step === "mood" && (
        <div className={`sticky ${isFullscreenMobile ? "bottom-0" : "bottom-20 lg:bottom-0"} z-10 pt-3 pb-2 ${isFullscreenMobile ? "" : "-mx-4 px-4"} bg-gradient-to-t from-background via-background to-transparent`}>
          <div className="flex flex-col gap-2">
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
            <button
              onClick={() => setStep("members")}
              className="w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: 'transparent',
                color: 'rgba(248, 246, 241, 0.55)',
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results - Mobile Optimized */}
      {step === "results" && results && (
        <div className="space-y-4 sm:space-y-6">

          {/* Group Profile Summary */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <Users className="h-4 w-4" />
              <span>
                Recommendations for {results.groupProfile.memberCount} member
                {results.groupProfile.memberCount !== 1 ? "s" : ""}
              </span>
            </div>
            {results.groupProfile.sharedGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Shared favorites:</span>
                {results.groupProfile.sharedGenres.map((genre) => (
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
        <div className={`sticky ${isFullscreenMobile ? "bottom-0" : "bottom-20 lg:bottom-0"} z-10 pt-3 pb-2 ${isFullscreenMobile ? "" : "-mx-4 px-4"} bg-gradient-to-t from-background via-background to-transparent`}>
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
    </div>
  )
}