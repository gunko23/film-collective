"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { useSafeUser } from "@/hooks/use-safe-user"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { getImageUrl } from "@/lib/tmdb/image"

// ─── Design System Colors ───────────────────────────────────
const colors = {
  bg: '#08080a',
  surface: '#0f0f12',
  surfaceLight: '#161619',
  cream: '#f8f6f1',
  accent: '#e07850',
  accentSoft: '#d4a574',
  cool: '#7b8cde',
}

// ─── Icons ──────────────────────────────────────────────────
function BackIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkleIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
    </svg>
  )
}

function CheckIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13L9 17L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUpIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 15L12 9L18 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnyMoodIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function FunIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M7 6V4M17 6V4M7 18V20M17 18V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IntenseIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function EmotionalIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function MindlessIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 9H9.01M15 9H15.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function AcclaimedIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 4H16V10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10V4Z" stroke={color} strokeWidth="1.5" />
      <path d="M12 14V17M8 20H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ViolenceIcon({ color = colors.cream, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.5 4L18 7.5L11 14.5L7.5 11L14.5 4Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 21L7.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon({ color = colors.cream, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function LanguageIcon({ color = colors.cream, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function SubstanceIcon({ color = colors.cream, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 3H16L18 8H6L8 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V8" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function FrighteningIcon({ color = colors.cream, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M8 15C8 15 9 13 12 13C15 13 16 15 16 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 10V9M15 10V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function RefreshIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M1 4V10H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 20V14H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon({ color = colors.cream, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M12 6V12L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StarIcon({ color = colors.cream, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  )
}

function FilmIcon({ color = colors.cream, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="2.18" stroke={color} strokeWidth="1.5" />
      <path d="M7 2V22M17 2V22M2 12H22M2 7H7M2 17H7M17 17H22M17 7H22" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// ─── Types ──────────────────────────────────────────────────
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
}

// ─── Fetcher ────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(res => res.json())

// ─── Helpers ────────────────────────────────────────────────
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

// ─── Main Component ─────────────────────────────────────────
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
  const [showContentFilters, setShowContentFilters] = useState(true) // EXPANDED by default
  const [contentFilters, setContentFilters] = useState<Record<string, ContentLevel>>({
    violence: "any",
    sexNudity: "any",
    language: "any",
    substances: "any",
    frightening: "any"
  })

  // Step 3: Results
  const [results, setResults] = useState<MovieRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch collective data
  const { data: collectiveData } = useSWR(
    collectiveId ? `/api/collectives/${collectiveId}` : null,
    fetcher
  )

  // Use the dedicated tonight's pick endpoint for members
  const { data: tonightData, isLoading: membersLoading } = useSWR(
    collectiveId ? `/api/collectives/${collectiveId}/tonight` : null,
    fetcher
  )

  // Transform members data - the tonight endpoint returns { members: [...] }
  const members: Member[] = (tonightData?.members || []).map((m: any, i: number) => ({
    id: m.user_id || m.id,
    name: m.user_name || m.name || "Unknown",
    initials: (m.user_name || m.name || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    color: [colors.accent, colors.cool, "#22c55e", colors.accentSoft, "#f472b6"][i % 5],
    avatar_url: m.user_avatar || m.avatar_url
  }))

  const collectiveName = collectiveData?.name || "Collective"

  // Auto-select current user
  useEffect(() => {
    if (user && members.length > 0 && selectedMembers.length === 0) {
      const currentUserMember = members.find(m => m.id === user.id)
      if (currentUserMember) {
        setSelectedMembers([currentUserMember.id])
      }
    }
  }, [user, members, selectedMembers.length])

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const selectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id))
  }

  const getRecommendations = async () => {
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
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset: "clear" | "kid" | "family") => {
    if (preset === "clear") {
      setContentFilters({
        violence: "any",
        sexNudity: "any",
        language: "any",
        substances: "any",
        frightening: "any"
      })
    } else if (preset === "kid") {
      setContentFilters({
        violence: "mild",
        sexNudity: "none",
        language: "mild",
        substances: "none",
        frightening: "mild"
      })
    } else if (preset === "family") {
      setContentFilters({
        violence: "mod",
        sexNudity: "mild",
        language: "mod",
        substances: "mild",
        frightening: "mod"
      })
    }
  }

  const moods = [
    { id: "any" as Mood, label: "Any Mood", subtitle: "Show me everything", Icon: AnyMoodIcon },
    { id: "fun" as Mood, label: "Fun", subtitle: "Light & entertaining", Icon: FunIcon },
    { id: "intense" as Mood, label: "Intense", subtitle: "Edge of your seat", Icon: IntenseIcon },
    { id: "emotional" as Mood, label: "Emotional", subtitle: "Feel all the feels", Icon: EmotionalIcon },
    { id: "mindless" as Mood, label: "Mindless", subtitle: "Turn brain off", Icon: MindlessIcon },
    { id: "acclaimed" as Mood, label: "Acclaimed", subtitle: "Critics' favorites", Icon: AcclaimedIcon },
  ]

  const runtimes = [
    { id: "any", label: "Any" },
    { id: "90", label: "90m" },
    { id: "120", label: "120m" },
    { id: "150", label: "150m" },
  ]

  const ratings = [
    { id: "any", label: "Any" },
    { id: "g", label: "G" },
    { id: "pg", label: "PG" },
    { id: "pg13", label: "PG-13" },
    { id: "r", label: "R" },
  ]

  const filterLevels: ContentLevel[] = ["any", "none", "mild", "mod", "severe"]
  const filterLabels = ["Any", "None", "Mild", "Mod", "Severe"]

  const contentFilterCategories = [
    { id: "violence", label: "Violence", Icon: ViolenceIcon },
    { id: "sexNudity", label: "Sex/Nudity", Icon: HeartIcon },
    { id: "language", label: "Language", Icon: LanguageIcon },
    { id: "substances", label: "Substances", Icon: SubstanceIcon },
    { id: "frightening", label: "Frightening Scenes", Icon: FrighteningIcon },
  ]

  const steps = [
    { num: 1 as FilmTab, label: "Who" },
    { num: 2 as FilmTab, label: "Mood" },
    { num: 3 as FilmTab, label: "Results" },
  ]

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg, color: colors.cream }}>
        <p>Please sign in to continue</p>
      </div>
    )
  }

  if (membersLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.bg, color: colors.cream }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: `2px solid ${colors.accent}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ marginTop: "16px", fontSize: "14px", color: `${colors.cream}50` }}>Loading...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: "#08080a",
        color: "#f8f6f1",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Step Indicator */}
      <div style={{
        padding: "20px 20px 12px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(248, 246, 241, 0.06)",
        flexShrink: 0
      }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <button
              type="button"
              onClick={() => s.num < step && setStep(s.num)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: s.num <= step ? "pointer" : "default",
                padding: 0,
                color: "inherit"
              }}
            >
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: step >= s.num ? "#e07850" : "#0f0f12",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: step >= s.num ? "#08080a" : "rgba(248, 246, 241, 0.4)"
              }}>
                {s.num}
              </div>
              <span style={{
                fontSize: "13px",
                fontWeight: step === s.num ? 600 : 400,
                color: step >= s.num ? "#f8f6f1" : "rgba(248, 246, 241, 0.4)"
              }}>
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "1px",
                backgroundColor: step > s.num ? "#e07850" : "rgba(248, 246, 241, 0.1)",
                margin: "0 10px"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Content - Scrollable area */}
      <div
        className="elegant-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          minHeight: 0
        }}
      >
        {/* Step 1: Who's Watching */}
        {step === 1 && (
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px"
            }}>
              <p style={{ fontSize: "14px" }}>Who's watching tonight?</p>
              <button
                type="button"
                onClick={selectAllMembers}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: colors.accent
                }}
              >
                Select All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      backgroundColor: isSelected ? `${colors.accent}10` : colors.surface,
                      border: `1px solid ${isSelected ? colors.accent + "30" : colors.cream + "06"}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      color: colors.cream,
                      width: "100%",
                      textAlign: "left"
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: member.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.bg,
                      overflow: "hidden"
                    }}>
                      {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.name} width={40} height={40} style={{ objectFit: "cover" }} />
                      ) : (
                        member.initials
                      )}
                    </div>

                    {/* Name + Selected label */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500 }}>{member.name}</p>
                      {isSelected && (
                        <p style={{ fontSize: "12px", color: colors.accent, marginTop: "1px" }}>Selected</p>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? colors.accent : "transparent",
                      border: `2px solid ${isSelected ? colors.accent : colors.cream + "20"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {isSelected && <CheckIcon color={colors.bg} size={12} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <p style={{
              textAlign: "center",
              fontSize: "13px",
              color: `${colors.cream}50`,
              marginTop: "16px"
            }}>
              {selectedMembers.length} of {members.length} selected
            </p>
          </>
        )}

        {/* Step 2: Mood & Filters */}
        {step === 2 && (
          <>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>
              What are you in the mood for?
            </p>

            {/* Mood Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              marginBottom: "24px"
            }}>
              {moods.map((m) => {
                const isSelected = selectedMood === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    style={{
                      padding: "14px 12px",
                      backgroundColor: isSelected ? `${colors.accent}10` : colors.surface,
                      border: `1px solid ${isSelected ? colors.accent + "35" : colors.cream + "06"}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      color: colors.cream,
                      textAlign: "left"
                    }}
                  >
                    <m.Icon color={isSelected ? colors.accent : `${colors.cream}45`} size={22} />
                    <p style={{ fontSize: "14px", fontWeight: 500, marginTop: "8px", marginBottom: "2px" }}>{m.label}</p>
                    <p style={{ fontSize: "11px", color: `${colors.cream}40` }}>{m.subtitle}</p>
                  </button>
                )
              })}
            </div>

            {/* Runtime */}
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: `${colors.cream}40`,
              marginBottom: "8px"
            }}>
              Maximum runtime <span style={{ opacity: 0.5 }}>(optional)</span>
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
              {runtimes.map((r) => {
                const isSelected = maxRuntime === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setMaxRuntime(r.id)}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: isSelected ? `${colors.accent}12` : colors.surface,
                      border: `1px solid ${isSelected ? colors.accent + "35" : colors.cream + "08"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: isSelected ? colors.cream : `${colors.cream}55`,
                      fontSize: "13px",
                      fontWeight: isSelected ? 500 : 400
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>

            {/* Content Rating */}
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: `${colors.cream}40`,
              marginBottom: "8px"
            }}>
              Content rating <span style={{ opacity: 0.5 }}>(optional)</span>
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
              {ratings.map((r) => {
                const isSelected = contentRating === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setContentRating(r.id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: isSelected ? `${colors.accent}12` : colors.surface,
                      border: `1px solid ${isSelected ? colors.accent + "35" : colors.cream + "08"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: isSelected ? colors.cream : `${colors.cream}55`,
                      fontSize: "13px",
                      fontWeight: isSelected ? 500 : 400
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: "11px", color: `${colors.cream}30`, marginBottom: "18px", lineHeight: 1.4 }}>
              Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
            </p>

            {/* Content Filters */}
            <button
              type="button"
              onClick={() => setShowContentFilters(!showContentFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px",
                backgroundColor: colors.surface,
                border: `1px solid ${colors.cream}08`,
                borderRadius: showContentFilters ? "12px 12px 0 0" : "12px",
                cursor: "pointer",
                color: colors.cream
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FilterIcon color={`${colors.cream}45`} size={18} />
                <span style={{ fontSize: "14px", fontWeight: 500 }}>Content Filters</span>
              </div>
              {showContentFilters
                ? <ChevronUpIcon color={`${colors.cream}40`} size={18} />
                : <ChevronDownIcon color={`${colors.cream}40`} size={18} />
              }
            </button>

            {showContentFilters && (
              <div style={{
                padding: "14px",
                backgroundColor: colors.surface,
                border: `1px solid ${colors.cream}08`,
                borderTop: "none",
                borderRadius: "0 0 12px 12px"
              }}>
                <p style={{ fontSize: "12px", color: `${colors.cream}45`, marginBottom: "14px", lineHeight: 1.4 }}>
                  Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                </p>

                {/* Presets */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => applyPreset("clear")}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "transparent",
                      border: `1px solid ${colors.cream}15`,
                      borderRadius: "100px",
                      cursor: "pointer",
                      color: `${colors.cream}55`,
                      fontSize: "12px"
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("kid")}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#22c55e20",
                      border: "1px solid #22c55e40",
                      borderRadius: "100px",
                      cursor: "pointer",
                      color: "#22c55e",
                      fontSize: "12px",
                      fontWeight: 500
                    }}
                  >
                    Kid-Friendly
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("family")}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: `${colors.cool}20`,
                      border: `1px solid ${colors.cool}40`,
                      borderRadius: "100px",
                      cursor: "pointer",
                      color: colors.cool,
                      fontSize: "12px",
                      fontWeight: 500
                    }}
                  >
                    Family Night
                  </button>
                </div>

                {/* Filter Categories */}
                {contentFilterCategories.map((cat) => (
                  <div key={cat.id} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <cat.Icon color={`${colors.cream}45`} size={16} />
                      <span style={{ fontSize: "13px", color: `${colors.cream}65` }}>{cat.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {filterLevels.map((level, i) => {
                        const isSelected = contentFilters[cat.id] === level
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setContentFilters(prev => ({ ...prev, [cat.id]: level }))}
                            style={{
                              flex: 1,
                              padding: "6px 2px",
                              backgroundColor: isSelected ? `${colors.accent}12` : colors.surfaceLight,
                              border: `1px solid ${isSelected ? colors.accent + "35" : "transparent"}`,
                              borderRadius: "4px",
                              cursor: "pointer",
                              color: isSelected ? colors.cream : `${colors.cream}45`,
                              fontSize: "11px",
                              fontWeight: isSelected ? 500 : 400
                            }}
                          >
                            {filterLabels[i]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <p style={{ fontSize: "11px", color: `${colors.cream}30`, marginTop: "12px", lineHeight: 1.4 }}>
                  Note: Movies without parental guide data in our database will still be shown.
                </p>
              </div>
            )}
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <>
            {error && (
              <div style={{
                padding: "12px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "#ef4444"
              }}>
                {error}
              </div>
            )}

            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <FilmIcon color={`${colors.cream}30`} size={48} />
                <p style={{ fontSize: "16px", fontWeight: 500, marginTop: "16px" }}>No recommendations found</p>
                <p style={{ fontSize: "13px", color: `${colors.cream}50`, marginTop: "4px" }}>
                  Try adjusting your mood or runtime preferences
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {results.map((movie) => (
                  <Link
                    key={movie.tmdbId}
                    href={`/movies/${movie.tmdbId}`}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px",
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.cream}06`,
                      borderRadius: "12px",
                      textDecoration: "none",
                      color: colors.cream
                    }}
                  >
                    {/* Poster */}
                    <div style={{
                      width: "70px",
                      height: "105px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: colors.surfaceLight
                    }}>
                      {movie.posterPath ? (
                        <Image
                          src={getImageUrl(movie.posterPath, "w185") || ""}
                          alt={movie.title}
                          width={70}
                          height={105}
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <FilmIcon color={`${colors.cream}30`} size={24} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <h3 style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {movie.title}
                        </h3>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "100px",
                          fontSize: "11px",
                          fontWeight: 600,
                          flexShrink: 0,
                          backgroundColor: movie.groupFitScore >= 70
                            ? "rgba(34, 197, 94, 0.2)"
                            : movie.groupFitScore >= 50
                              ? "rgba(245, 158, 11, 0.2)"
                              : `${colors.cream}10`,
                          color: movie.groupFitScore >= 70
                            ? "#22c55e"
                            : movie.groupFitScore >= 50
                              ? "#f59e0b"
                              : `${colors.cream}50`
                        }}>
                          {movie.groupFitScore}%
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        {movie.releaseDate && (
                          <span style={{ fontSize: "12px", color: `${colors.cream}50` }}>
                            {new Date(movie.releaseDate).getFullYear()}
                          </span>
                        )}
                        {movie.runtime && (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: `${colors.cream}50` }}>
                            <ClockIcon color={`${colors.cream}50`} size={12} />
                            {movie.runtime}m
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: `${colors.cream}50` }}>
                          <StarIcon color="#f59e0b" size={12} />
                          {movie.voteAverage.toFixed(1)}
                        </span>
                      </div>

                      {/* Genres */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                        {movie.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre.id}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: colors.surfaceLight,
                              fontSize: "10px",
                              color: `${colors.cream}60`
                            }}
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>

                      {/* Reasoning */}
                      {movie.reasoning.length > 0 && (
                        <p style={{
                          fontSize: "11px",
                          color: `${colors.cream}40`,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {movie.reasoning[0]}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - Fixed above bottom nav */}
      <div style={{
        padding: "14px 20px",
        paddingBottom: "90px",
        borderTop: "1px solid rgba(248, 246, 241, 0.08)",
        flexShrink: 0,
        backgroundColor: "#08080a"
      }}>
        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={selectedMembers.length === 0}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: selectedMembers.length > 0 ? "#e07850" : "#161619",
              border: "none",
              borderRadius: "12px",
              color: selectedMembers.length > 0 ? "#08080a" : "rgba(248, 246, 241, 0.4)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: selectedMembers.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Continue
          </button>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={getRecommendations}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#e07850",
                border: "none",
                borderRadius: "12px",
                color: "#08080a",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "10px",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <RefreshIcon color="#08080a" size={18} />
                  Finding films...
                </>
              ) : (
                <>
                  <SparkleIcon color="#08080a" size={18} />
                  Get Recommendations
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(248, 246, 241, 0.55)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <BackIcon color="rgba(248, 246, 241, 0.45)" size={14} />
              Back
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: "#0f0f12",
                border: "1px solid rgba(248, 246, 241, 0.1)",
                borderRadius: "12px",
                color: "#f8f6f1",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <BackIcon color="#f8f6f1" size={16} />
              Back
            </button>
            <button
              type="button"
              onClick={getRecommendations}
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: "#e07850",
                border: "none",
                borderRadius: "12px",
                color: "#08080a",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                opacity: loading ? 0.7 : 1
              }}
            >
              <RefreshIcon color="#08080a" size={16} />
              Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <MobileBottomNav className="z-[100]" />

      {/* Scrollbar styles */}
      <style jsx global>{`
        .elegant-scroll::-webkit-scrollbar { width: 4px; }
        .elegant-scroll::-webkit-scrollbar-track { background: transparent; }
        .elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248, 246, 241, 0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}
