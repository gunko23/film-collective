"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { useSafeUser } from "@/hooks/use-safe-user"
import { getImageUrl } from "@/lib/tmdb/image"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"
import { useReasoningChannel } from "@/hooks/use-reasoning-channel"

// ─── Soulframe Design Tokens ─────────────────────────────────
const C = {
  bg: "#0f0d0b",
  bgCard: "#1a1714",
  bgCardHover: "#211e19",
  bgElevated: "#252119",
  blue: "#3d5a96",
  blueMuted: "#2e4470",
  blueLight: "#5a7cb8",
  blueGlow: "rgba(61,90,150,0.18)",
  orange: "#ff6b2d",
  orangeMuted: "#cc5624",
  orangeLight: "#ff8f5e",
  orangeGlow: "rgba(255,107,45,0.14)",
  cream: "#e8e2d6",
  creamMuted: "#a69e90",
  creamFaint: "#6b6358",
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
  green: "#4ade80",
  purple: "#a78bfa",
  red: "#ef4444",
  yellow: "#facc15",
}

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif'

const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`

// ─── Icons ───────────────────────────────────────────────────
function BackIcon({ color = C.creamMuted, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function CheckSmall({ color = C.warmBlack, size = 9 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ChevronIcon({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ShieldIcon({ color = C.blueLight, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function SparkleIcon({ color = C.warmBlack, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
    </svg>
  )
}

function RefreshIcon({ color = C.warmBlack, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}

function FilmIcon({ color = C.creamFaint, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20M2 16h20M8 4v16M16 4v16" />
    </svg>
  )
}

function LinkIcon({ color = C.cream, size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6" /><path d="M10 14L21 3" />
    </svg>
  )
}

function StarFilled({ color = C.orange, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function CheckmarkIcon({ color = C.orange, size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// Mood icons
function MoodSparkle({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" />
    </svg>
  )
}

function MoodCoffee({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

function MoodZap({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function MoodHeart({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function MoodAward({ color = C.creamFaint, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )
}

// ─── Types ───────────────────────────────────────────────────
type FilmTab = 1 | 2 | 3
type Mood = "any" | "fun" | "intense" | "emotional" | "mindless" | "acclaimed"
type ContentLevel = "any" | "none" | "mild" | "mod" | "severe"

type Member = {
  id: string
  name: string
  initials: string
  color: string
  avatar_url?: string | null
}

type MovieRecommendation = {
  tmdbId: number
  title: string
  overview: string
  posterPath: string | null
  releaseDate: string
  runtime: number | null
  genres: { id: number; name: string }[]
  voteAverage: number
  groupFitScore: number
  reasoning: string[]
  parentalGuide?: {
    sexNudity: string | null
    violence: string | null
    profanity: string | null
    alcoholDrugsSmoking: string | null
    frighteningIntense: string | null
  } | null
  seenBy?: string[]
}

// ─── Fetcher ─────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(res => res.json())

// ─── Helpers ─────────────────────────────────────────────────
function capitalize(str: string): string {
  if (str === "mod") return "Moderate"
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatContentRating(rating: string): string {
  const map: Record<string, string> = {
    "g": "G",
    "pg": "PG",
    "pg13": "PG-13",
    "r": "R"
  }
  return map[rating] || rating.toUpperCase()
}

// Mood color map
const MOOD_COLORS: Record<string, string> = {
  any: C.orange,
  fun: C.teal,
  intense: C.rose,
  emotional: C.blue,
  mindless: C.purple,
  acclaimed: C.orange,
}

// Member avatar color pairs
const MEMBER_COLORS = [
  { from: "#ff6b2d", to: "#ff8f5e" },
  { from: "#3d5a96", to: "#5a7cb8" },
  { from: "#4a9e8e", to: "#6bc4b4" },
  { from: "#c4616a", to: "#d88088" },
  { from: "#2e4470", to: "#5a7cb8" },
]

// Score color helper
function scoreColor(score: number): string {
  if (score >= 70) return C.teal
  if (score >= 50) return C.orange
  return C.creamFaint
}

// ─── Main Component ──────────────────────────────────────────
export default function CollectiveTonightsPickPage() {
  const params = useParams()
  const router = useRouter()
  const collectiveId = params.id as string
  const { user } = useSafeUser()

  // Step state
  const [step, setStep] = useState<FilmTab>(1)

  // Step 1: Who's watching
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Step 2: Mood & Filters
  const [selectedMood, setSelectedMood] = useState<Mood>("any")
  const [maxRuntime, setMaxRuntime] = useState<string>("any")
  const [contentRating, setContentRating] = useState<string>("any")
  const [era, setEra] = useState<string>("any")
  const [releasedAfter, setReleasedAfter] = useState<string>("any")
  const [streamingProviders, setStreamingProviders] = useState<number[]>([])
  const [showContentFilters, setShowContentFilters] = useState(false)
  const [contentFilters, setContentFilters] = useState<Record<string, ContentLevel>>({
    violence: "any",
    sexNudity: "any",
    language: "any",
    substances: "any",
    frightening: "any"
  })

  // Step 3: Results
  const [results, setResults] = useState<MovieRecommendation[]>([])
  const [reasoningChannel, setReasoningChannel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1)

  // Subscribe to reasoning channel for streaming LLM reasoning
  const { applyReasoning, isLoading: reasoningLoading } = useReasoningChannel(reasoningChannel)

  // Enrich results with streamed reasoning data
  const enrichedResults = useMemo(() => {
    return applyReasoning(results)
  }, [results, applyReasoning])

  // Fetch collective data
  const { data: collectiveData } = useSWR(
    collectiveId ? `/api/collectives/${collectiveId}` : null,
    fetcher
  )

  // Fetch members
  const { data: tonightData, isLoading: membersLoading } = useSWR(
    collectiveId ? `/api/collectives/${collectiveId}/tonight` : null,
    fetcher
  )

  const members: Member[] = (tonightData?.members || []).map((m: any, i: number) => ({
    id: m.user_id || m.id,
    name: m.user_name || m.name || "Unknown",
    initials: (m.user_name || m.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    color: MEMBER_COLORS[i % MEMBER_COLORS.length].from,
    avatar_url: m.user_avatar || m.avatar_url
  }))

  // Auto-select current user
  useEffect(() => {
    if (user && members.length > 0 && selectedMembers.length === 0) {
      const currentUserMember = members.find(m => m.id === user.id)
      if (currentUserMember) {
        setSelectedMembers([currentUserMember.id])
      }
    }
  }, [user, members, selectedMembers.length])

  // Load saved streaming providers
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

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const selectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id))
    }
  }

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
      const res = await fetch(`/api/collectives/${collectiveId}/tonight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedMembers,
          mood: selectedMood === "any" ? null : selectedMood,
          maxRuntime: maxRuntime === "any" ? null : parseInt(maxRuntime),
          contentRating: contentRating === "any" ? null : formatContentRating(contentRating),
          era: era === "any" ? null : era,
          startYear: releasedAfter === "any" ? null : parseInt(releasedAfter),
          streamingProviders: streamingProviders.length > 0 ? streamingProviders : null,
          page,
          parentalFilters: {
            maxViolence: contentFilters.violence === "any" ? null : capitalize(contentFilters.violence),
            maxSexNudity: contentFilters.sexNudity === "any" ? null : capitalize(contentFilters.sexNudity),
            maxProfanity: contentFilters.language === "any" ? null : capitalize(contentFilters.language),
            maxSubstances: contentFilters.substances === "any" ? null : capitalize(contentFilters.substances),
            maxFrightening: contentFilters.frightening === "any" ? null : capitalize(contentFilters.frightening),
          }
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get recommendations")
      }

      const data = await res.json()
      setResults(data.recommendations || [])
      setReasoningChannel(data.reasoningChannel || null)
      setResultsPage(page)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset: "clear" | "kid" | "family") => {
    if (preset === "clear") {
      setContentFilters({ violence: "any", sexNudity: "any", language: "any", substances: "any", frightening: "any" })
    } else if (preset === "kid") {
      setContentFilters({ violence: "mild", sexNudity: "none", language: "mild", substances: "none", frightening: "mild" })
    } else if (preset === "family") {
      setContentFilters({ violence: "mod", sexNudity: "mild", language: "mod", substances: "mild", frightening: "mod" })
    }
  }

  const goBack = () => {
    if (step === 1) {
      router.back()
    } else {
      setStep((step - 1) as FilmTab)
    }
  }

  const backLabel = step === 1 ? "Back to Feed" : step === 2 ? "Back to Who" : "Back to Mood"

  // Mood options config
  const moods = [
    { id: "any" as Mood, name: "Any Mood", sub: "Show me everything", icon: MoodSparkle, color: C.orange },
    { id: "fun" as Mood, name: "Fun", sub: "Light & entertaining", icon: MoodCoffee, color: C.teal },
    { id: "intense" as Mood, name: "Intense", sub: "Edge of your seat", icon: MoodZap, color: C.rose },
    { id: "emotional" as Mood, name: "Emotional", sub: "Feel all the feels", icon: MoodHeart, color: C.blue },
    { id: "mindless" as Mood, name: "Mindless", sub: "Turn brain off", icon: MoodCoffee, color: C.purple },
    { id: "acclaimed" as Mood, name: "Acclaimed", sub: "Critics' favorites", icon: MoodAward, color: C.orange },
  ]

  const filterLevels: ContentLevel[] = ["any", "none", "mild", "mod", "severe"]
  const filterLabels = ["Any", "None", "Mild", "Mod", "Severe"]

  const contentFilterCategories = [
    { id: "violence", label: "Violence", color: C.red },
    { id: "sexNudity", label: "Sex/Nudity", color: C.rose },
    { id: "language", label: "Language", color: C.yellow },
    { id: "substances", label: "Substances", color: C.purple },
    { id: "frightening", label: "Frightening Scenes", color: C.orange },
  ]

  // ─── Auth / Loading guards ─────────────────────────────────
  if (!user) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: C.bg, color: C.cream, fontFamily: FONT,
      }}>
        <p>Please sign in to continue</p>
      </div>
    )
  }

  if (membersLoading) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundColor: C.bg, color: C.cream, fontFamily: FONT,
      }}>
        <div style={{
          width: 32, height: 32,
          border: `2px solid ${C.orange}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ marginTop: 16, fontSize: 14, color: C.creamMuted }}>Loading...</p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (loading) {
    return <TonightsPickLoading />
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        @keyframes popIn {
          0% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes moodPop {
          0% { transform: scale(0.93); }
          40% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes reasoningShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .tp-scrollbar::-webkit-scrollbar { width: 4px; }
        .tp-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .tp-scrollbar::-webkit-scrollbar-thumb { background: rgba(107,99,88,0.12); border-radius: 3px; }
      `}</style>

      <div style={{
        background: C.bg, color: C.cream, fontFamily: FONT,
        position: "relative", height: "100vh",
        display: "flex", flexDirection: "column",
        overflowX: "hidden",
      }}>
        {/* Grain overlay */}
        <div style={{
          position: "fixed", inset: 0, backgroundImage: grainSVG,
          backgroundRepeat: "repeat", pointerEvents: "none",
          zIndex: 9998, opacity: 0.4, mixBlendMode: "overlay" as const,
        }} />

        {/* Light leaks */}
        <div style={{
          position: "fixed", top: -80, left: -90, width: 240, height: 240,
          borderRadius: "50%", background: `radial-gradient(circle, ${C.blueGlow}, transparent 70%)`,
          filter: "blur(65px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", bottom: -60, right: -80, width: 240, height: 240,
          borderRadius: "50%", background: `radial-gradient(circle, ${C.orangeGlow}, transparent 70%)`,
          filter: "blur(65px)", pointerEvents: "none", opacity: 0.4,
        }} />

        {/* ═══ Top Nav ═══ */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center",
          padding: "14px 24px 10px", gap: 12, zIndex: 10,
        }}>
          <div onClick={goBack} style={{ cursor: "pointer", padding: 4 }}>
            <BackIcon size={18} color={C.creamMuted} />
          </div>
          <span style={{ fontSize: 13, color: C.creamMuted }}>{backLabel}</span>
        </div>

        {/* ═══ Stepper ═══ */}
        <div style={{ flexShrink: 0, padding: "8px 24px 24px", zIndex: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
          }}>
            {[
              { num: 1 as FilmTab, label: "Who" },
              { num: 2 as FilmTab, label: "Mood" },
              { num: 3 as FilmTab, label: "Results" },
            ].map((s, i, arr) => {
              const isActive = s.num === step
              const isComplete = s.num < step
              const isLast = i === arr.length - 1
              return (
                <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: isComplete
                        ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                        : isActive
                          ? `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`
                          : `rgba(107,99,88,0.08)`,
                      border: isActive
                        ? `1px solid rgba(61,90,150,0.25)`
                        : isComplete ? "none" : `1px solid rgba(107,99,88,0.12)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, fontFamily: FONT,
                      color: isComplete || isActive ? C.warmBlack : C.creamFaint,
                      transition: "all 0.35s ease",
                    }}>
                      {isComplete ? (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.warmBlack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : s.num}
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? C.cream : isComplete ? C.creamMuted : C.creamFaint,
                      letterSpacing: "-0.01em",
                    }}>{s.label}</span>
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 32, height: 1, margin: "0 10px",
                      background: isComplete
                        ? `linear-gradient(to right, ${C.orange}50, ${C.orange}20)`
                        : "rgba(107,99,88,0.08)",
                      transition: "all 0.35s ease",
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ Step Content ═══ */}

        {/* ──── STEP 1: WHO ──── */}
        {step === 1 && (
          <>
            <div className="tp-scrollbar" style={{
              flex: 1, overflowY: "auto", padding: "0 24px", zIndex: 10,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 16,
              }}>
                <div style={{
                  fontFamily: FONT, fontSize: 18, fontWeight: 600,
                  color: C.cream, letterSpacing: "-0.02em",
                }}>Who's watching tonight?</div>
                <div onClick={selectAllMembers} style={{
                  fontSize: 13, color: C.blueLight, cursor: "pointer", fontWeight: 500,
                }}>{selectedMembers.length === members.length ? "Deselect All" : "Select All"}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {members.map((m, i) => {
                  const isSelected = selectedMembers.includes(m.id)
                  const colorPair = MEMBER_COLORS[i % MEMBER_COLORS.length]
                  return (
                    <div key={m.id} onClick={() => toggleMember(m.id)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 18px", borderRadius: 14,
                      background: isSelected
                        ? `linear-gradient(135deg, ${colorPair.from}12, ${C.bgCard})`
                        : C.bgCard,
                      border: `1px solid ${isSelected ? colorPair.from + "30" : "rgba(107,99,88,0.04)"}`,
                      cursor: "pointer",
                      transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                    }}>
                      {isSelected && (
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: 2,
                          borderRadius: "14px 14px 0 0",
                          background: `linear-gradient(to right, ${colorPair.from}40, transparent)`,
                        }} />
                      )}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${colorPair.from}, ${colorPair.to})`,
                        boxShadow: isSelected ? `0 3px 14px ${colorPair.from}25` : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontFamily: FONT, fontWeight: 700, color: C.bg,
                        flexShrink: 0, position: "relative", overflow: "hidden",
                        transition: "box-shadow 0.35s ease",
                      }}>
                        {m.avatar_url ? (
                          <Image src={m.avatar_url} alt={m.name} width={44} height={44} style={{ objectFit: "cover", width: 44, height: 44 }} />
                        ) : (
                          m.initials
                        )}
                        {isSelected && (
                          <div style={{
                            position: "absolute", bottom: -2, right: -2,
                            width: 18, height: 18, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                            border: `2px solid ${C.bg}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <CheckSmall />
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: C.cream }}>{m.name}</div>
                        {isSelected && (
                          <div style={{ fontSize: 12, color: C.orange, marginTop: 2, fontWeight: 500 }}>Selected</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{
                textAlign: "center", marginTop: 16,
                fontSize: 13, color: C.creamFaint,
              }}>
                {selectedMembers.length} of {members.length} selected
              </div>
              <div style={{ height: 16 }} />
            </div>

            {/* Sticky bottom */}
            <div style={{
              position: "sticky", bottom: 0, zIndex: 100, flexShrink: 0,
              padding: "16px 24px 24px",
              background: `linear-gradient(to top, ${C.bg} 60%, ${C.bg}ee 80%, transparent)`,
            }}>
              <button
                type="button"
                onClick={() => selectedMembers.length > 0 && setStep(2)}
                disabled={selectedMembers.length === 0}
                style={{
                  width: "100%", padding: "16px 32px", borderRadius: 14, border: "none",
                  background: selectedMembers.length === 0
                    ? "rgba(107,99,88,0.08)"
                    : `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                  boxShadow: selectedMembers.length === 0 ? "none" : `0 4px 20px ${C.orange}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  cursor: selectedMembers.length === 0 ? "default" : "pointer",
                  opacity: selectedMembers.length === 0 ? 0.5 : 1,
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  fontFamily: FONT,
                }}>
                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: selectedMembers.length === 0 ? C.creamFaint : C.warmBlack,
                }}>Continue</span>
                <ChevronIcon size={18} color={selectedMembers.length === 0 ? C.creamFaint : C.warmBlack} />
              </button>
            </div>
          </>
        )}

        {/* ──── STEP 2: MOOD & FILTERS ──── */}
        {step === 2 && (
          <>
            <div className="tp-scrollbar" style={{
              flex: 1, overflowY: "auto", padding: "0 24px", zIndex: 10,
            }}>
              <div style={{
                fontFamily: FONT, fontSize: 18, fontWeight: 600,
                color: C.cream, letterSpacing: "-0.02em", marginBottom: 16,
              }}>What are you in the mood for?</div>

              {/* Mood grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                marginBottom: 28,
              }}>
                {moods.map((mood) => {
                  const isActive = selectedMood === mood.id
                  const IconComponent = mood.icon
                  return (
                    <div key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      style={{
                        padding: "20px 16px", borderRadius: 14,
                        background: isActive
                          ? `linear-gradient(155deg, ${mood.color}14, ${C.bgCard})`
                          : C.bgCard,
                        border: `1.5px solid ${isActive ? mood.color + "40" : "rgba(107,99,88,0.04)"}`,
                        cursor: "pointer",
                        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                        position: "relative", textAlign: "center",
                        boxShadow: isActive ? `0 4px 24px ${mood.color}12` : "none",
                      }}>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0, height: 2,
                          borderRadius: "14px 14px 0 0",
                          background: `linear-gradient(to right, ${mood.color}60, ${mood.color}10, transparent)`,
                        }} />
                      )}
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: isActive ? `${mood.color}22` : "rgba(107,99,88,0.07)",
                        border: `1px solid ${isActive ? mood.color + "30" : "rgba(107,99,88,0.07)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        transform: isActive ? "scale(1.08)" : "scale(1)",
                      }}>
                        <IconComponent size={16} color={isActive ? mood.color : C.creamFaint} />
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: isActive ? 600 : 500, color: C.cream,
                        marginBottom: 3,
                      }}>{mood.name}</div>
                      <div style={{
                        fontSize: 11.5, color: C.creamMuted, lineHeight: 1.5,
                      }}>{mood.sub}</div>
                    </div>
                  )
                })}
              </div>

              {/* ── Filter Cards ── */}

              {/* Runtime */}
              <div style={{
                padding: "18px 20px", borderRadius: 14,
                background: C.bgCard, border: "1px solid rgba(107,99,88,0.04)",
                marginBottom: 14, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: `linear-gradient(to right, ${C.blue}30, transparent)`,
                }} />
                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                  color: C.blueLight, fontWeight: 600, marginBottom: 12,
                }}>Maximum Runtime</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {[
                    { id: "any", label: "Any" },
                    { id: "90", label: "90m" },
                    { id: "120", label: "120m" },
                    { id: "150", label: "150m" },
                  ].map(opt => {
                    const isActive = maxRuntime === opt.id
                    return (
                      <div key={opt.id} onClick={() => setMaxRuntime(opt.id)} style={{
                        padding: "8px 16px", borderRadius: 20,
                        background: isActive ? `${C.blue}18` : "transparent",
                        border: `1.5px solid ${isActive ? C.blue + "50" : "rgba(107,99,88,0.09)"}`,
                        color: isActive ? C.blueLight : C.creamFaint,
                        fontSize: 13, fontWeight: isActive ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}>{opt.label}</div>
                    )
                  })}
                </div>
              </div>

              {/* Content Rating */}
              <div style={{
                padding: "18px 20px", borderRadius: 14,
                background: C.bgCard, border: "1px solid rgba(107,99,88,0.04)",
                marginBottom: 14, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: `linear-gradient(to right, ${C.blue}25, ${C.teal}10, transparent)`,
                }} />
                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                  color: C.blueLight, fontWeight: 600, marginBottom: 12,
                }}>Content Rating</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {[
                    { id: "any", label: "Any" },
                    { id: "g", label: "G" },
                    { id: "pg", label: "PG" },
                    { id: "pg13", label: "PG-13" },
                    { id: "r", label: "R" },
                  ].map(opt => {
                    const isActive = contentRating === opt.id
                    return (
                      <div key={opt.id} onClick={() => setContentRating(opt.id)} style={{
                        padding: "8px 16px", borderRadius: 20,
                        background: isActive ? `${C.blue}18` : "transparent",
                        border: `1.5px solid ${isActive ? C.blue + "50" : "rgba(107,99,88,0.09)"}`,
                        color: isActive ? C.blueLight : C.creamFaint,
                        fontSize: 13, fontWeight: isActive ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}>{opt.label}</div>
                    )
                  })}
                </div>
                <div style={{
                  fontSize: 11, color: C.creamFaint, marginTop: 10, lineHeight: 1.5,
                }}>Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)</div>
              </div>

              {/* Era + Released After (combined card) */}
              <div style={{
                padding: "18px 20px", borderRadius: 14,
                background: C.bgCard, border: "1px solid rgba(107,99,88,0.04)",
                marginBottom: 14, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: `linear-gradient(to right, ${C.teal}25, transparent)`,
                }} />
                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                  color: C.teal, fontWeight: 600, marginBottom: 12,
                }}>Era</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {["Any", "60s", "70s", "80s", "90s", "00s", "10s", "20s"].map(opt => {
                    const id = opt === "Any" ? "any" : opt === "60s" ? "1960s" : opt === "70s" ? "1970s" : opt === "80s" ? "1980s" : opt === "90s" ? "1990s" : opt === "00s" ? "2000s" : opt === "10s" ? "2010s" : "2020s"
                    const isActive = era === id
                    return (
                      <div key={opt} onClick={() => setEra(id)} style={{
                        padding: "8px 16px", borderRadius: 20,
                        background: isActive ? `${C.teal}18` : "transparent",
                        border: `1.5px solid ${isActive ? C.teal + "50" : "rgba(107,99,88,0.09)"}`,
                        color: isActive ? C.teal : C.creamFaint,
                        fontSize: 13, fontWeight: isActive ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}>{opt}</div>
                    )
                  })}
                </div>

                {/* Divider */}
                <div style={{
                  height: 1, margin: "18px 0",
                  background: `linear-gradient(to right, rgba(107,99,88,0.08), transparent)`,
                }} />

                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                  color: C.teal, fontWeight: 600, marginBottom: 12,
                }}>Released After</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {[
                    { id: "any", label: "Any" },
                    { id: "1970", label: "1970+" },
                    { id: "1980", label: "1980+" },
                    { id: "1990", label: "1990+" },
                    { id: "2000", label: "2000+" },
                    { id: "2010", label: "2010+" },
                    { id: "2020", label: "2020+" },
                    { id: "2024", label: "2024+" },
                  ].map(opt => {
                    const isActive = releasedAfter === opt.id
                    return (
                      <div key={opt.id} onClick={() => setReleasedAfter(opt.id)} style={{
                        padding: "8px 16px", borderRadius: 20,
                        background: isActive ? `${C.teal}18` : "transparent",
                        border: `1.5px solid ${isActive ? C.teal + "50" : "rgba(107,99,88,0.09)"}`,
                        color: isActive ? C.teal : C.creamFaint,
                        fontSize: 13, fontWeight: isActive ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}>{opt.label}</div>
                    )
                  })}
                </div>
              </div>

              {/* Streaming Services */}
              <div style={{
                padding: "18px 20px", borderRadius: 14,
                background: C.bgCard, border: "1px solid rgba(107,99,88,0.04)",
                marginBottom: 14, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: `linear-gradient(to right, ${C.blueMuted}30, transparent)`,
                }} />
                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const,
                  color: C.blueLight, fontWeight: 600, marginBottom: 12,
                }}>Streaming Services</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {US_SUBSCRIPTION_PROVIDERS.map(svc => {
                    const isActive = streamingProviders.includes(svc.id)
                    return (
                      <div key={svc.id} onClick={() => toggleStreamingProvider(svc.id)} style={{
                        padding: "8px 14px", borderRadius: 20,
                        background: isActive ? `${C.blue}18` : "transparent",
                        border: `1px solid ${isActive ? C.blue + "50" : "rgba(107,99,88,0.09)"}`,
                        color: isActive ? C.blueLight : C.creamFaint,
                        fontSize: 12, fontWeight: isActive ? 500 : 400,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.25s ease",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, overflow: "hidden",
                          background: `${C.blue}15`, flexShrink: 0,
                        }}>
                          <Image
                            src={getImageUrl(svc.logoPath, "w92") || ""}
                            alt={svc.shortName}
                            width={18}
                            height={18}
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        {svc.shortName}
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.creamFaint, marginTop: 10 }}>
                  Streaming data by <span style={{ color: C.orange, fontWeight: 500 }}>JustWatch</span>
                </div>
              </div>

              {/* Content Filters (Accordion) */}
              <div style={{
                borderRadius: 14, background: C.bgCard,
                border: "1px solid rgba(107,99,88,0.04)",
                marginBottom: 16, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  borderRadius: "14px 14px 0 0",
                  background: `linear-gradient(to right, ${C.blue}25, ${C.rose}10, transparent)`,
                }} />
                <div onClick={() => setShowContentFilters(!showContentFilters)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 18px", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ShieldIcon size={16} color={C.blueLight} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.cream }}>Content Filters</span>
                  </div>
                  <div style={{
                    transform: showContentFilters ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 0.25s ease",
                  }}>
                    <ChevronIcon size={16} color={C.creamFaint} />
                  </div>
                </div>

                {showContentFilters && (
                  <div style={{ padding: "0 18px 18px" }}>
                    <div style={{
                      fontSize: 12, color: C.creamMuted, lineHeight: 1.5, marginBottom: 14,
                    }}>Set maximum levels for each category. Movies exceeding these levels will be filtered out.</div>

                    {/* Presets */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      <div onClick={() => applyPreset("clear")} style={{
                        padding: "6px 14px", borderRadius: 16,
                        border: `1px solid rgba(107,99,88,0.12)`,
                        fontSize: 12, color: C.creamFaint, cursor: "pointer",
                      }}>Clear All</div>
                      <div onClick={() => applyPreset("kid")} style={{
                        padding: "6px 14px", borderRadius: 16,
                        background: `${C.green}15`, border: `1px solid ${C.green}30`,
                        fontSize: 12, color: C.green, cursor: "pointer",
                      }}>Kid-Friendly</div>
                      <div onClick={() => applyPreset("family")} style={{
                        padding: "6px 14px", borderRadius: 16,
                        background: `${C.blue}15`, border: `1px solid ${C.blue}30`,
                        fontSize: 12, color: C.blueLight, cursor: "pointer",
                      }}>Family Night</div>
                    </div>

                    {/* Categories — no icons, text labels only */}
                    {contentFilterCategories.map((cat) => (
                      <div key={cat.id} style={{ marginBottom: 18 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: 500, color: C.cream,
                          marginBottom: 8, letterSpacing: "0.01em",
                        }}>{cat.label}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {filterLevels.map((level, li) => {
                            const isActive = contentFilters[cat.id] === level
                            return (
                              <div key={level}
                                onClick={() => setContentFilters(prev => ({ ...prev, [cat.id]: level }))}
                                style={{
                                  padding: "7px 0", borderRadius: 16, flex: 1,
                                  textAlign: "center" as const,
                                  background: isActive ? `${cat.color}18` : "transparent",
                                  border: `1.5px solid ${isActive ? cat.color + "45" : "rgba(107,99,88,0.12)"}`,
                                  fontSize: 11.5, fontWeight: isActive ? 500 : 400,
                                  color: isActive ? cat.color : C.creamFaint,
                                  cursor: "pointer",
                                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                  boxShadow: isActive ? `0 0 10px ${cat.color}12` : "none",
                                }}>{filterLabels[li]}</div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <div style={{
                      fontSize: 11, color: C.creamFaint, lineHeight: 1.5, marginTop: 4,
                    }}>Note: Movies without parental guide data in our database will still be shown.</div>
                  </div>
                )}
              </div>

              <div style={{ height: 16 }} />
            </div>

            {/* Sticky bottom */}
            <div style={{
              position: "sticky", bottom: 0, zIndex: 100, flexShrink: 0,
              padding: "16px 24px 24px",
              background: `linear-gradient(to top, ${C.bg} 60%, ${C.bg}ee 80%, transparent)`,
            }}>
              <button
                type="button"
                onClick={() => getRecommendations(1)}
                disabled={loading}
                style={{
                  width: "100%", padding: "16px 32px", borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                  boxShadow: `0 4px 20px ${C.orange}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontFamily: FONT,
                }}>
                <SparkleIcon size={18} color={C.warmBlack} />
                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: C.warmBlack, letterSpacing: "-0.01em",
                }}>{loading ? "Finding films..." : "Get Recommendations"}</span>
              </button>
              <div onClick={goBack} style={{
                textAlign: "center", marginTop: 10,
                fontSize: 13, color: C.creamFaint, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <BackIcon size={14} color={C.creamFaint} />
                Back
              </div>
            </div>
          </>
        )}

        {/* ──── STEP 3: RESULTS ──── */}
        {step === 3 && (
          <>
            <div className="tp-scrollbar" style={{
              flex: 1, overflowY: "auto", padding: "0 24px", zIndex: 10,
            }}>
              {error && (
                <div style={{
                  padding: "12px 16px", marginBottom: 16, borderRadius: 14,
                  background: `${C.red}12`, border: `1px solid ${C.red}30`,
                  fontSize: 14, color: C.red,
                }}>
                  {error}
                </div>
              )}

              <div style={{
                fontFamily: FONT, fontSize: 18, fontWeight: 600,
                color: C.cream, letterSpacing: "-0.02em", marginBottom: 6,
              }}>Your Picks for Tonight</div>
              <div style={{
                fontSize: 13, color: C.creamMuted, marginBottom: 20, lineHeight: 1.5,
              }}>Based on your collective's taste and mood</div>

              {enrichedResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <FilmIcon color={C.creamFaint} size={48} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No recommendations found</p>
                  <p style={{ fontSize: 13, color: C.creamMuted }}>
                    Try adjusting your mood or runtime preferences
                  </p>
                </div>
              ) : (
                enrichedResults.map((movie, i) => {
                  const accentColors = [C.teal, C.orange, C.blue, C.rose, C.purple]
                  const filmColor = accentColors[i % accentColors.length]
                  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ""
                  const sc = scoreColor(movie.groupFitScore)

                  // Parental guide helpers
                  const guide = movie.parentalGuide
                  const parentalCats = ["violence", "sexNudity", "profanity", "alcoholDrugsSmoking", "frighteningIntense"] as const
                  const hasParental = guide && parentalCats.some(c => guide[c] && guide[c] !== "None")
                  const severityRank = { None: 0, Mild: 1, Moderate: 2, Severe: 3 }
                  const maxSev = guide ? parentalCats.reduce((max, cat) => {
                    const level = guide[cat] || "None"
                    return (severityRank[level as keyof typeof severityRank] || 0) > (severityRank[max as keyof typeof severityRank] || 0) ? level : max
                  }, "None" as string) : "None"

                  const parentalLabels: Record<string, string> = {
                    violence: "Violence",
                    sexNudity: "Sex/Nudity",
                    profanity: "Language",
                    alcoholDrugsSmoking: "Substances",
                    frighteningIntense: "Intense",
                  }

                  return (
                    <div key={movie.tmdbId} style={{
                      borderRadius: 16, background: C.bgCard,
                      border: "1px solid rgba(107,99,88,0.04)",
                      marginBottom: 16, position: "relative",
                      animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                    }}>
                      {/* Accent bar */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 2,
                        borderRadius: "16px 16px 0 0",
                        background: `linear-gradient(to right, ${filmColor}50, ${filmColor}10, transparent)`,
                      }} />

                      {/* Film header */}
                      <div style={{
                        display: "flex", gap: 14, padding: "18px 18px 14px", alignItems: "flex-start",
                      }}>
                        <div style={{
                          width: 70, height: 100, borderRadius: 8, flexShrink: 0,
                          overflow: "hidden",
                          background: `linear-gradient(155deg, ${filmColor}12, ${C.bgElevated})`,
                          border: "1px solid rgba(107,99,88,0.04)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {movie.posterPath ? (
                            <Image
                              src={getImageUrl(movie.posterPath, "w185") || ""}
                              alt={movie.title}
                              width={70}
                              height={100}
                              style={{ objectFit: "cover", width: 70, height: 100 }}
                            />
                          ) : (
                            <FilmIcon size={20} color={C.creamFaint + "60"} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: FONT, fontSize: 18, fontWeight: 700,
                            color: C.cream, letterSpacing: "-0.02em", lineHeight: 1.2,
                          }}>{movie.title}</div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                          }}>
                            <span style={{ fontSize: 13, color: C.creamMuted }}>{year}</span>
                            <span style={{ color: C.creamFaint + "40" }}>·</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <StarFilled />
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>
                                {movie.voteAverage?.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          {/* Score badge */}
                          <div style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 34, height: 34, borderRadius: "50%",
                            border: `2px solid ${sc}50`,
                            background: `${sc}10`,
                            fontSize: 11, fontWeight: 700, color: sc,
                            marginTop: 8,
                          }}>{movie.groupFitScore}</div>
                        </div>
                      </div>

                      {/* Genres */}
                      {movie.genres?.length > 0 && (
                        <div style={{ padding: "0 18px 8px", display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {movie.genres.slice(0, 3).map(g => (
                            <span key={g.id} style={{
                              padding: "2px 8px", borderRadius: 6,
                              background: "rgba(107,99,88,0.06)",
                              border: "1px solid rgba(107,99,88,0.08)",
                              fontSize: 11, color: C.creamMuted, letterSpacing: "0.02em",
                            }}>{g.name}</span>
                          ))}
                        </div>
                      )}

                      {/* Why we picked this */}
                      {(movie.reasoning?.length > 0 || reasoningLoading) && (
                        <div style={{ padding: "0 18px 16px" }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                          }}>
                            <CheckmarkIcon size={13} color={C.orange} />
                            <span style={{
                              fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const,
                              color: C.orange, fontWeight: 600,
                            }}>Why We Picked This</span>
                          </div>
                          {reasoningLoading && !movie.reasoning?.[0] ? (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                              <div style={{
                                height: 13, width: "92%", borderRadius: 4,
                                background: "linear-gradient(90deg, #1a1714 25%, #242018 50%, #1a1714 75%)",
                                backgroundSize: "200% 100%",
                                animation: "reasoningShimmer 1.5s ease-in-out infinite",
                              }} />
                              <div style={{
                                height: 13, width: "78%", borderRadius: 4,
                                background: "linear-gradient(90deg, #1a1714 25%, #242018 50%, #1a1714 75%)",
                                backgroundSize: "200% 100%",
                                animation: "reasoningShimmer 1.5s ease-in-out infinite 0.1s",
                              }} />
                            </div>
                          ) : (
                            <div style={{
                              fontSize: 13.5, color: C.creamMuted, lineHeight: 1.65,
                            }}>{movie.reasoning?.[0]}</div>
                          )}
                        </div>
                      )}

                      {/* Seen by */}
                      {movie.seenBy && movie.seenBy.length > 0 && (
                        <div style={{
                          padding: "0 18px 8px", fontSize: 11, color: C.creamFaint, opacity: 0.7,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Seen by {movie.seenBy.join(", ")}</span>
                        </div>
                      )}

                      {/* Parental guide (conditional) */}
                      {hasParental && (
                        <ParentalGuideSection
                          guide={guide!}
                          parentalCats={parentalCats}
                          parentalLabels={parentalLabels}
                          maxSev={maxSev}
                        />
                      )}

                      {/* View Details */}
                      <div style={{
                        padding: "0 18px 16px", display: "flex", justifyContent: "flex-end",
                      }}>
                        <Link href={`/movies/${movie.tmdbId}`} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "8px 16px", borderRadius: 10,
                          border: "1px solid rgba(107,99,88,0.09)",
                          fontSize: 12, color: C.cream, fontWeight: 500,
                          textDecoration: "none",
                          cursor: "pointer",
                        }}>
                          <LinkIcon size={13} color={C.cream} />
                          View Details
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}

              <div style={{ height: 16 }} />
            </div>

            {/* Sticky bottom */}
            <div style={{
              position: "sticky", bottom: 0, zIndex: 100, flexShrink: 0,
              padding: "16px 24px 24px",
              background: `linear-gradient(to top, ${C.bg} 60%, ${C.bg}ee 80%, transparent)`,
            }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={goBack} style={{
                  flex: 1, padding: 16, borderRadius: 14,
                  background: C.bgCard, border: `1px solid rgba(107,99,88,0.08)`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 14, fontWeight: 500, color: C.cream, cursor: "pointer",
                  fontFamily: FONT,
                }}>
                  <BackIcon size={16} color={C.cream} />
                  Back
                </button>
                <button type="button"
                  onClick={() => getRecommendations(resultsPage + 1)}
                  disabled={loading}
                  style={{
                    flex: 1.4, padding: 16, borderRadius: 14, border: "none",
                    background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                    boxShadow: `0 4px 20px rgba(255,107,45,0.19)`,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontSize: 14, fontWeight: 600, fontFamily: FONT,
                    color: C.warmBlack, cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  <RefreshIcon size={16} color={C.warmBlack} />
                  Shuffle
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Parental Guide Collapsible Section ─────────────────────
function ParentalGuideSection({
  guide,
  parentalCats,
  parentalLabels,
  maxSev,
}: {
  guide: NonNullable<MovieRecommendation["parentalGuide"]>
  parentalCats: readonly string[]
  parentalLabels: Record<string, string>
  maxSev: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ padding: "0 18px 14px" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 10,
          background: open ? `${C.red}0a` : "transparent",
          border: `1px solid ${open ? C.red + "20" : "rgba(107,99,88,0.1)"}`,
          cursor: "pointer",
          transition: "all 0.25s ease",
        }}>
        <ShieldIcon size={12} color={open ? C.red : C.creamFaint} />
        <span style={{
          fontSize: 11.5, fontWeight: 500,
          color: open ? C.red : C.creamFaint,
          transition: "color 0.25s ease",
        }}>Parental Guide</span>
        {maxSev !== "None" && (
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 10,
            background: `${C.red}12`, border: `1px solid ${C.red}25`,
            color: C.red, fontWeight: 500,
          }}>Up to {maxSev}</span>
        )}
        <div style={{
          transform: open ? "rotate(90deg)" : "rotate(0)",
          transition: "transform 0.25s ease",
          display: "flex",
        }}>
          <ChevronIcon size={12} color={open ? C.red : C.creamFaint} />
        </div>
      </div>

      <div style={{
        maxHeight: open ? 200 : 0,
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, paddingTop: 12 }}>
          {parentalCats.map(cat => {
            const severity = guide[cat as keyof typeof guide]
            if (!severity || severity === "None") return null
            return (
              <span key={cat} style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 10,
                border: `1px solid ${C.red}25`, color: C.red,
              }}>{parentalLabels[cat]}: {severity}</span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
