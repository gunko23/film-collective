"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"

// ── Soulframe Color Tokens ──
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
  creamSoft: "#8a8279",
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
  green: "#4ade80",
  purple: "#a78bfa",
  red: "#ef4444",
  yellow: "#facc15",
}

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif`

// ── SVG Noise texture for grain overlay ──
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

// ── Types ──
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
type ContentLevel = "None" | "Mild" | "Moderate" | "Severe" | null

// ── Avatar gradient color pairs (unique per member, deterministic) ──
const AVATAR_GRADIENT_PAIRS = [
  [C.orange, C.rose],
  [C.teal, C.blue],
  [C.purple, C.rose],
  [C.blue, C.teal],
  [C.rose, C.orangeMuted],
  [C.green, C.teal],
  [C.blueLight, C.purple],
  [C.orangeLight, C.yellow],
]

function getAvatarGradient(name: string): [string, string] {
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_GRADIENT_PAIRS.length
  return AVATAR_GRADIENT_PAIRS[index] as [string, string]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ── Inline SVG Icons (no lucide-react for mood/filter icons) ──
function IconSparkle({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill={color} />
    </svg>
  )
}

function IconFilm({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  )
}

function IconZap({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
    </svg>
  )
}

function IconHeart({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function IconAward({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

function IconCoffee({ size = 20, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

function IconChevronLeft({ size = 18, color = C.creamMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconChevronRight({ size = 18, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconChevronDown({ size = 16, color = C.creamMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconChevronUp({ size = 16, color = C.creamMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function IconCheck({ size = 14, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconExternalLink({ size = 14, color = C.orange }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function IconInfo({ size = 14, color = C.creamMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconUsers({ size = 16, color = C.creamMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function IconShield({ size = 16, color = C.blueLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconRefreshCw({ size = 16, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}

function IconLoader({ size = 16, color = C.cream }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

// ── Mood Options ──
const MOOD_OPTIONS: { value: Mood; label: string; icon: (c: string) => React.ReactNode; description: string; color: string }[] = [
  {
    value: null,
    label: "Any Mood",
    icon: (c) => <IconSparkle size={20} color={c} />,
    description: "Show me everything",
    color: C.orange,
  },
  {
    value: "fun",
    label: "Fun",
    icon: (c) => <IconCoffee size={20} color={c} />,
    description: "Light & entertaining",
    color: C.teal,
  },
  {
    value: "intense",
    label: "Intense",
    icon: (c) => <IconZap size={20} color={c} />,
    description: "Edge of your seat",
    color: C.rose,
  },
  {
    value: "emotional",
    label: "Emotional",
    icon: (c) => <IconHeart size={20} color={c} />,
    description: "Feel all the feels",
    color: C.blue,
  },
  {
    value: "mindless",
    label: "Mindless",
    icon: (c) => <IconFilm size={20} color={c} />,
    description: "Turn brain off",
    color: C.purple,
  },
  {
    value: "acclaimed",
    label: "Acclaimed",
    icon: (c) => <IconAward size={20} color={c} />,
    description: "Critics' favorites",
    color: C.orange,
  },
]

// ── Content filter category colors ──
const CONTENT_FILTER_COLORS: Record<string, string> = {
  Violence: C.red,
  "Sex/Nudity": C.rose,
  Language: C.purple,
  Substances: C.teal,
  "Frightening Scenes": C.blue,
}

// ── Result card accent bar colors (cycling) ──
const RESULT_ACCENT_COLORS = [C.teal, C.orange, C.blue, C.rose, C.purple]

// ── Grain Overlay ──
function GrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
        opacity: 0.4,
        mixBlendMode: "overlay",
        backgroundImage: GRAIN_SVG,
        backgroundRepeat: "repeat",
      }}
      aria-hidden="true"
    />
  )
}

// ── Light Leaks ──
function LightLeaks() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
      {/* Blue glow - top left */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.blueGlow}, transparent 70%)`,
          filter: "blur(65px)",
        }}
      />
      {/* Orange glow - bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.orangeGlow}, transparent 70%)`,
          filter: "blur(65px)",
        }}
      />
    </div>
  )
}

// ── Step Indicator ──
function StepIndicator({ currentStep }: { currentStep: "members" | "mood" | "results" }) {
  const steps = ["members", "mood", "results"] as const
  const labels = { members: "Who", mood: "Mood", results: "Results" }
  const currentIndex = steps.indexOf(currentStep)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "0 24px",
      }}
    >
      {steps.map((s, i) => {
        const isComplete = i < currentIndex
        const isActive = i === currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            {/* Node + label (inline) */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: isComplete
                    ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                    : isActive
                      ? `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`
                      : `${C.creamSoft}15`,
                  border: isActive
                    ? `1px solid ${C.blue}40`
                    : isComplete
                      ? "none"
                      : `1px solid ${C.creamSoft}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: FONT_STACK,
                  color: isComplete || isActive ? C.warmBlack : C.creamSoft,
                  transition: "all 0.35s ease",
                }}
              >
                {isComplete ? (
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.warmBlack}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.cream : isComplete ? C.creamMuted : C.creamSoft,
                  letterSpacing: "-0.01em",
                }}
              >
                {labels[s]}
              </span>
            </div>
            {/* Connector line after (except last) */}
            {!isLast && (
              <div
                style={{
                  width: 32,
                  height: 1,
                  margin: "0 10px",
                  background: isComplete
                    ? `linear-gradient(to right, ${C.orange}50, ${C.orange}20)`
                    : `${C.creamSoft}18`,
                  transition: "all 0.35s ease",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Top Nav Bar ──
function TopNav({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="flex items-center" style={{ padding: "12px 20px 8px", gap: 12 }}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center"
        style={{
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 0",
          color: C.creamMuted,
          fontSize: 14,
          fontFamily: FONT_STACK,
          fontWeight: 500,
        }}
      >
        <IconChevronLeft size={18} color={C.creamMuted} />
        <span>{label}</span>
      </button>
    </div>
  )
}

// ── Avatar Component ──
function MemberAvatar({
  member,
  size = 44,
  showCheckBadge = false,
}: {
  member: GroupMember
  size?: number
  showCheckBadge?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const [c1, c2] = getAvatarGradient(member.name || "User")

  const avatarContent =
    !member.avatarUrl || imgError ? (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.cream,
          fontSize: size * 0.34,
          fontWeight: 600,
          fontFamily: FONT_STACK,
        }}
      >
        {getInitials(member.name || "User")}
      </div>
    ) : (
      <Image
        src={member.avatarUrl}
        alt={member.name || "User"}
        width={size}
        height={size}
        className="object-cover"
        style={{ width: size, height: size, borderRadius: "50%" }}
        onError={() => setImgError(true)}
      />
    )

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Gradient border ring */}
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          padding: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: C.bgCard,
            padding: 1,
            overflow: "hidden",
          }}
        >
          {avatarContent}
        </div>
      </div>
      {/* Orange check badge */}
      {showCheckBadge && (
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.bgCard}`,
          }}
        >
          <IconCheck size={10} color={C.warmBlack} />
        </div>
      )}
    </div>
  )
}

// ── Fit Score Ring Component ──
function FitScoreRing({ score }: { score: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? C.teal : score >= 60 ? C.orange : C.creamFaint

  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={radius} fill="none" stroke={`${C.creamFaint}22`} strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 13,
          fontWeight: 600,
          color,
        }}
      >
        {score}
      </div>
    </div>
  )
}

// ── Parental Badge Component ──
function ParentalBadge({ category, severity }: { category: string; severity: string }) {
  if (!severity || severity === "None") return null

  const severityColors = {
    None: { bg: `rgba(74,222,128,0.12)`, text: C.green, border: `rgba(74,222,128,0.25)` },
    Mild: { bg: `rgba(255,107,45,0.10)`, text: C.orange, border: `rgba(255,107,45,0.25)` },
    Moderate: { bg: `rgba(250,204,21,0.10)`, text: C.yellow, border: `rgba(250,204,21,0.25)` },
    Severe: { bg: `rgba(239,68,68,0.10)`, text: C.red, border: `rgba(239,68,68,0.25)` },
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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: FONT_STACK,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <span>{severityLabels[category]}: {severity}</span>
    </div>
  )
}

// ── Recommendation Card Component ──
function RecommendationCard({ movie, index }: { movie: MovieRecommendation; index: number }) {
  const [showGuide, setShowGuide] = useState(false)

  const accentColor = RESULT_ACCENT_COLORS[index % RESULT_ACCENT_COLORS.length]
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ""
  const reasoningText = movie.reasoning?.[0] || ""

  const guide = movie.parentalGuide
  const categories = ["violence", "sexNudity", "profanity", "alcoholDrugsSmoking", "frighteningIntense"] as const
  const hasParentalContent = guide && categories.some((c) => guide[c] && guide[c] !== "None")

  const severityRank = { None: 0, Mild: 1, Moderate: 2, Severe: 3 }
  const maxSeverity = guide
    ? categories.reduce((max, cat) => {
        const level = guide[cat] || "None"
        return severityRank[level as keyof typeof severityRank] > severityRank[max as keyof typeof severityRank]
          ? level
          : max
      }, "None")
    : "None"

  const severityLabels: Record<string, string> = {
    violence: "Violence",
    sexNudity: "Sex/Nudity",
    profanity: "Language",
    alcoholDrugsSmoking: "Substances",
    frighteningIntense: "Intense",
  }

  const parentalWarnings = guide
    ? categories
        .filter((cat) => guide[cat] && guide[cat] !== "None")
        .map((cat) => `${severityLabels[cat]}: ${guide[cat]}`)
    : []

  const fitScoreColor = movie.groupFitScore >= 80 ? C.teal : movie.groupFitScore >= 60 ? C.orange : C.creamFaint

  return (
    <div
      style={{
        borderRadius: 16,
        background: C.bgCard,
        border: `1px solid ${C.creamSoft}0c`,
        position: "relative",
        overflow: "hidden",
        animation: `sfFadeSlideIn 0.4s ease ${index * 0.08}s both`,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(to right, ${accentColor}50, ${accentColor}10, transparent)`,
        }}
      />

      {/* Film header */}
      <div className="flex" style={{ gap: 14, padding: "18px 18px 14px", alignItems: "flex-start" }}>
        {/* Poster */}
        <div style={{ flexShrink: 0 }}>
          {movie.posterPath ? (
            <Image
              src={getImageUrl(movie.posterPath, "w185") || ""}
              alt={movie.title}
              width={70}
              height={100}
              className="object-cover"
              style={{
                width: 70,
                height: 100,
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            />
          ) : (
            <div
              style={{
                width: 70,
                height: 100,
                borderRadius: 8,
                background: `linear-gradient(155deg, ${accentColor}12, ${C.bgElevated})`,
                border: `1px solid ${C.creamSoft}0c`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconFilm size={20} color={C.creamFaint} />
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: FONT_STACK,
              fontSize: 18,
              fontWeight: 700,
              color: C.cream,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {movie.title}
          </h3>
          <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: C.creamMuted }}>{year}</span>
            <span style={{ color: `${C.creamSoft}40` }}>&middot;</span>
            <div className="inline-flex items-center" style={{ gap: 4 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill={C.orange} stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>
                {movie.voteAverage?.toFixed(1)}
              </span>
            </div>
          </div>
          {/* Fit score circle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: `2px solid ${fitScoreColor}50`,
              background: `${fitScoreColor}10`,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "monospace",
              color: fitScoreColor,
              marginTop: 8,
            }}
          >
            {movie.groupFitScore}
          </div>
        </div>
      </div>

      {/* Why we picked this */}
      <div style={{ padding: "0 18px 16px" }}>
        <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
          <IconCheck size={13} color={C.orange} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.orange,
              fontWeight: 600,
              fontFamily: FONT_STACK,
            }}
          >
            Why We Picked This
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            color: C.creamMuted,
            lineHeight: 1.65,
            fontFamily: FONT_STACK,
          }}
        >
          {reasoningText}
        </p>
      </div>

      {/* Parental guide — collapsed toggle */}
      {hasParentalContent && (
        <div style={{ padding: "0 18px 14px" }}>
          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 10,
              background: showGuide ? `${C.red}0a` : "transparent",
              border: `1px solid ${showGuide ? `${C.red}20` : `${C.creamSoft}18`}`,
              cursor: "pointer",
              transition: "all 0.25s ease",
              fontFamily: FONT_STACK,
            }}
          >
            <IconShield size={12} color={showGuide ? C.red : C.creamFaint} />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: showGuide ? C.red : C.creamFaint,
                transition: "color 0.25s ease",
              }}
            >
              Parental Guide
            </span>
            <span
              style={{
                transform: showGuide ? "rotate(90deg)" : "rotate(0)",
                transition: "transform 0.25s ease",
                display: "inline-flex",
              }}
            >
              <IconChevronRight size={12} color={showGuide ? C.red : C.creamFaint} />
            </span>
          </button>

          {/* Expandable content */}
          <div
            style={{
              maxHeight: showGuide ? 120 : 0,
              opacity: showGuide ? 1 : 0,
              overflow: "hidden",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="flex items-center" style={{ gap: 8, paddingTop: 12, paddingBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: `${C.red}12`,
                  border: `1px solid ${C.red}25`,
                  color: C.red,
                  fontWeight: 500,
                }}
              >
                Up to {maxSeverity}
              </span>
            </div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {parentalWarnings.map((w, wi) => (
                <span
                  key={wi}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 10,
                    border: `1px solid ${C.red}25`,
                    color: C.red,
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Details */}
      <div className="flex justify-end" style={{ padding: "0 18px 16px" }}>
        <button
          onClick={() => (window.location.href = `/movies/${movie.tmdbId}`)}
          className="inline-flex items-center"
          style={{
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: `1px solid ${C.creamSoft}20`,
            background: "transparent",
            fontSize: 12,
            color: C.cream,
            fontWeight: 500,
            fontFamily: FONT_STACK,
            cursor: "pointer",
          }}
        >
          <IconExternalLink size={13} color={C.cream} />
          View Details
        </button>
      </div>
    </div>
  )
}

// ── Filter Pill (reusable) ──
function FilterPill({
  label,
  selected,
  onClick,
  accentColor = C.blue,
}: {
  label: string
  selected: boolean
  onClick: () => void
  accentColor?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: FONT_STACK,
        cursor: "pointer",
        border: `1px solid ${selected ? `${accentColor}66` : `${C.creamFaint}33`}`,
        background: selected ? `${accentColor}18` : "transparent",
        color: selected ? C.blueLight : C.creamMuted,
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  )
}

// ── Filter Card Wrapper ──
function FilterCard({
  accentGradient,
  children,
}: {
  accentGradient: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: C.bgCard,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${C.creamFaint}12`,
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 2, background: accentGradient }} />
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  )
}

// ── Section Label ──
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 10px",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: FONT_STACK,
        color: C.creamMuted,
      }}
    >
      {children}
    </p>
  )
}

// ── Main Component ──
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
  const [contentRating, setContentRating] = useState<string | null>(null)
  const [era, setEra] = useState<string | null>(null)
  const [startYear, setStartYear] = useState<number | null>(null)
  const [streamingProviders, setStreamingProviders] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [results, setResults] = useState<TonightPickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1)

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
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.providers?.length > 0) {
          setStreamingProviders(data.providers.map((p: any) => p.providerId))
        }
      })
      .catch(() => {})
  }, [])

  const toggleStreamingProvider = (providerId: number) => {
    setStreamingProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId],
    )
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
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

  const isFullscreenMobile = !!onBack

  // ── Loading states ──
  if (initialLoading) {
    return (
      <div
        style={{
          ...(isFullscreenMobile
            ? { height: "100vh", display: "flex", flexDirection: "column" as const, background: C.bg }
            : {}),
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{ padding: "80px 0", fontFamily: FONT_STACK }}
        >
          <div className="flex items-center" style={{ gap: 12, color: C.creamMuted }}>
            <IconLoader size={20} color={C.creamMuted} />
            <span style={{ fontSize: 14 }}>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <TonightsPickLoading />
  }

  // ── Determine top nav labels ──
  const topNavConfig = {
    members: { label: "Back to Feed", action: onBack || (() => {}) },
    mood: { label: "Back to Who", action: () => setStep("members") },
    results: { label: "Back to Mood", action: () => setStep("mood") },
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        position: "relative" as const,
        fontFamily: FONT_STACK,
        ...(isFullscreenMobile
          ? {
              height: "100vh",
              background: C.bg,
              overflow: "hidden",
            }
          : {
              minHeight: "100vh",
            }),
      }}
    >
      {/* Grain overlay */}
      {isFullscreenMobile && <GrainOverlay />}

      {/* Light leaks */}
      {isFullscreenMobile && <LightLeaks />}

      {/* Global animation keyframes */}
      <style>{`
        @keyframes sfFadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top Nav */}
      {onBack && (
        <div style={{ position: "relative", zIndex: 10 }}>
          <TopNav label={topNavConfig[step].label} onBack={topNavConfig[step].action} />
        </div>
      )}

      {/* Step Indicator */}
      <div style={{ position: "relative", zIndex: 10, paddingBottom: 16 }}>
        <StepIndicator currentStep={step} />
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

          {/* ════════ STEP 1: WHO ════════ */}
          {step === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="flex items-center justify-between">
                <p style={{ margin: 0, fontSize: 14, color: C.creamMuted, fontFamily: FONT_STACK }}>
                  Who's watching tonight?
                </p>
                <button
                  onClick={selectAllMembers}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: FONT_STACK,
                    color: C.blueLight,
                    padding: "4px 8px",
                  }}
                >
                  Select All
                </button>
              </div>

              {/* Member grid */}
              <div className="grid grid-cols-1" style={{ gap: 10 }}>
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.userId)
                  const [c1, c2] = getAvatarGradient(member.name || "User")
                  const memberColor = c1

                  return (
                    <button
                      key={member.userId}
                      onClick={() => toggleMember(member.userId)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 16px",
                        borderRadius: 14,
                        border: isSelected
                          ? `1px solid ${memberColor}55`
                          : `1px solid ${C.creamFaint}18`,
                        background: isSelected
                          ? `linear-gradient(135deg, ${memberColor}10, ${memberColor}06)`
                          : C.bgCard,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        position: "relative" as const,
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                        fontFamily: FONT_STACK,
                      }}
                    >
                      {/* Top accent bar when selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: `linear-gradient(90deg, ${memberColor}, ${memberColor}88, transparent)`,
                          }}
                        />
                      )}

                      <MemberAvatar member={member} size={44} showCheckBadge={isSelected} />

                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 15,
                            fontWeight: 500,
                            color: C.cream,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {member.name}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: memberColor,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selection count */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: C.creamMuted,
                  padding: "4px 0",
                  fontFamily: FONT_STACK,
                }}
              >
                {selectedMembers.length} of {members.length} selected
              </div>
            </div>
          )}

          {/* ════════ STEP 2: MOOD ════════ */}
          {step === "mood" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Mood grid */}
              <div>
                <SectionLabel>What are you in the mood for?</SectionLabel>
                <div className="grid grid-cols-2" style={{ gap: 10 }}>
                  {MOOD_OPTIONS.map((option) => {
                    const isSelected = selectedMood === option.value
                    const moodColor = option.color

                    return (
                      <button
                        key={option.value || "any"}
                        onClick={() => setSelectedMood(option.value)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                          padding: "18px 12px",
                          borderRadius: 14,
                          border: isSelected
                            ? `1px solid ${moodColor}55`
                            : `1px solid ${C.creamFaint}18`,
                          background: isSelected
                            ? `linear-gradient(135deg, ${moodColor}12, ${moodColor}06)`
                            : C.bgCard,
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.2s ease",
                          fontFamily: FONT_STACK,
                        }}
                      >
                        {/* Top accent bar when selected */}
                        {isSelected && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 2,
                              background: `linear-gradient(90deg, ${moodColor}, ${moodColor}88, transparent)`,
                            }}
                          />
                        )}

                        {/* Icon circle */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isSelected ? `${moodColor}22` : `${C.creamFaint}18`,
                            transition: "all 0.2s ease",
                            transform: isSelected ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {option.icon(isSelected ? moodColor : C.creamMuted)}
                        </div>

                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: C.cream,
                          }}
                        >
                          {option.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: C.creamMuted,
                            textAlign: "center",
                            lineHeight: 1.3,
                          }}
                        >
                          {option.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Runtime Filter Card */}
              <FilterCard accentGradient={`linear-gradient(90deg, ${C.blue}, ${C.blueLight}88, transparent)`}>
                <SectionLabel>Maximum runtime (optional)</SectionLabel>
                <div className="grid grid-cols-4" style={{ gap: 8 }}>
                  {[null, 90, 120, 150].map((time) => (
                    <FilterPill
                      key={time || "any"}
                      label={time ? `${time}m` : "Any"}
                      selected={maxRuntime === time}
                      onClick={() => setMaxRuntime(time)}
                      accentColor={C.blue}
                    />
                  ))}
                </div>
              </FilterCard>

              {/* Content Rating Filter Card */}
              <FilterCard accentGradient={`linear-gradient(90deg, ${C.blue}, ${C.teal}88, transparent)`}>
                <SectionLabel>Content rating (optional)</SectionLabel>
                <div className="grid grid-cols-5" style={{ gap: 6 }}>
                  {[
                    { value: null, label: "Any" },
                    { value: "G", label: "G" },
                    { value: "PG", label: "PG" },
                    { value: "PG-13", label: "PG-13" },
                    { value: "R", label: "R" },
                  ].map((rating) => (
                    <FilterPill
                      key={rating.value || "any"}
                      label={rating.label}
                      selected={contentRating === rating.value}
                      onClick={() => setContentRating(rating.value)}
                      accentColor={C.blue}
                    />
                  ))}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
                  Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
                </p>
              </FilterCard>

              {/* Era + Released After Combined Card */}
              <FilterCard accentGradient={`linear-gradient(90deg, ${C.teal}, ${C.teal}88, transparent)`}>
                {/* Era section */}
                <SectionLabel>Era (optional)</SectionLabel>
                <div className="grid grid-cols-4" style={{ gap: 8 }}>
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
                    <FilterPill
                      key={option.value || "any"}
                      label={option.label}
                      selected={era === option.value}
                      onClick={() => setEra(option.value)}
                      accentColor={C.teal}
                    />
                  ))}
                </div>

                {/* Faint gradient divider */}
                <div
                  style={{
                    height: 1,
                    margin: "14px 0",
                    background: `linear-gradient(90deg, transparent, ${C.creamFaint}22, transparent)`,
                  }}
                />

                {/* Released After section */}
                <SectionLabel>Released after (optional)</SectionLabel>
                <div className="grid grid-cols-4" style={{ gap: 8 }}>
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
                    <FilterPill
                      key={option.value || "any"}
                      label={option.label}
                      selected={startYear === option.value}
                      onClick={() => setStartYear(option.value)}
                      accentColor={C.teal}
                    />
                  ))}
                </div>
                {era && startYear ? (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
                    Era filter takes priority over released after
                  </p>
                ) : null}
              </FilterCard>

              {/* Streaming Services Filter Card */}
              <FilterCard accentGradient={`linear-gradient(90deg, ${C.blueMuted}, ${C.blue}88, transparent)`}>
                <SectionLabel>Streaming services (optional)</SectionLabel>
                <div className="grid grid-cols-3" style={{ gap: 8 }}>
                  {US_SUBSCRIPTION_PROVIDERS.map((provider) => {
                    const isSelected = streamingProviders.includes(provider.id)
                    return (
                      <button
                        key={provider.id}
                        onClick={() => toggleStreamingProvider(provider.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                          cursor: "pointer",
                          border: `1px solid ${isSelected ? `${C.blue}66` : `${C.creamFaint}33`}`,
                          background: isSelected ? `${C.blue}18` : "transparent",
                          color: isSelected ? C.blueLight : C.creamMuted,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={getImageUrl(provider.logoPath, "w92") || ""}
                          alt={provider.shortName}
                          width={18}
                          height={18}
                          className="flex-shrink-0"
                          style={{ borderRadius: 4, width: 18, height: 18 }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {provider.shortName}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {streamingProviders.length > 0 && (
                  <button
                    onClick={() => setStreamingProviders([])}
                    style={{
                      marginTop: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: C.creamFaint,
                      fontFamily: FONT_STACK,
                      padding: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.creamFaint)}
                  >
                    Clear streaming filter
                  </button>
                )}
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 10,
                    color: `${C.creamFaint}88`,
                    fontFamily: FONT_STACK,
                  }}
                >
                  Streaming data by JustWatch
                </p>
              </FilterCard>

              {/* Content Filters Accordion Card */}
              <div
                style={{
                  background: C.bgCard,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1px solid ${C.creamFaint}12`,
                }}
              >
                {/* Accent bar: blue to rose */}
                <div
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, ${C.blue}, ${C.rose}88, transparent)`,
                  }}
                />

                {/* Accordion header */}
                <button
                  onClick={() => setShowContentFilters(!showContentFilters)}
                  className="flex items-center justify-between"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                    transition: "background 0.15s",
                  }}
                >
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <IconShield size={16} color={C.blueLight} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.cream }}>Content Filters</span>
                    {(maxViolence || maxSexNudity || maxProfanity || maxSubstances || maxFrightening) && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: `${C.blueLight}20`,
                          color: C.blueLight,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  {showContentFilters ? (
                    <IconChevronUp size={16} color={C.creamMuted} />
                  ) : (
                    <IconChevronDown size={16} color={C.creamMuted} />
                  )}
                </button>

                {showContentFilters && (
                  <div
                    style={{
                      padding: "0 16px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      borderTop: `1px solid ${C.creamFaint}12`,
                      paddingTop: 14,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: C.creamFaint, fontFamily: FONT_STACK }}>
                      Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                    </p>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap" style={{ gap: 8 }}>
                      <button
                        onClick={() => {
                          setMaxViolence(null)
                          setMaxSexNudity(null)
                          setMaxProfanity(null)
                          setMaxSubstances(null)
                          setMaxFrightening(null)
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1px solid ${C.creamFaint}33`,
                          background: "transparent",
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                          color: C.creamMuted,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
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
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1px solid ${C.green}44`,
                          background: `${C.green}12`,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                          color: C.green,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
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
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1px solid ${C.yellow}44`,
                          background: `${C.yellow}12`,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                          color: C.yellow,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        Family Night
                      </button>
                    </div>

                    {/* Individual Category Filters */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {([
                        { label: "Violence", state: maxViolence, setter: setMaxViolence },
                        { label: "Sex/Nudity", state: maxSexNudity, setter: setMaxSexNudity },
                        { label: "Language", state: maxProfanity, setter: setMaxProfanity },
                        { label: "Substances", state: maxSubstances, setter: setMaxSubstances },
                        { label: "Frightening Scenes", state: maxFrightening, setter: setMaxFrightening },
                      ] as const).map((category) => {
                        const catColor = CONTENT_FILTER_COLORS[category.label] || C.creamMuted
                        return (
                          <div key={category.label}>
                            <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  fontFamily: FONT_STACK,
                                  color: C.cream,
                                }}
                              >
                                {category.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-5" style={{ gap: 6 }}>
                              {[
                                { value: null, label: "Any" },
                                { value: "None", label: "None" },
                                { value: "Mild", label: "Mild" },
                                { value: "Moderate", label: "Mod" },
                                { value: "Severe", label: "Severe" },
                              ].map((level) => {
                                const isLevelSelected = category.state === level.value
                                return (
                                  <button
                                    key={level.value || "any"}
                                    onClick={() =>
                                      category.setter(level.value as ContentLevel)
                                    }
                                    style={{
                                      padding: "7px 4px",
                                      borderRadius: 8,
                                      fontSize: 11,
                                      fontWeight: 500,
                                      fontFamily: FONT_STACK,
                                      cursor: "pointer",
                                      border: `1px solid ${isLevelSelected ? `${catColor}55` : `${C.creamFaint}28`}`,
                                      background: isLevelSelected ? `${catColor}18` : "transparent",
                                      color: isLevelSelected ? catColor : C.creamMuted,
                                      transition: "all 0.15s ease",
                                      textAlign: "center",
                                    }}
                                  >
                                    {level.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: C.creamFaint,
                        fontFamily: FONT_STACK,
                      }}
                    >
                      Note: Movies without parental guide data in our database will still be shown.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP 3: RESULTS ════════ */}
          {step === "results" && results && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Group Profile Summary */}
              <div
                style={{
                  borderRadius: 14,
                  border: `1px solid ${C.creamFaint}15`,
                  background: C.bgCard,
                  padding: "14px 16px",
                }}
              >
                <div className="flex items-center" style={{ gap: 8, marginBottom: 10, fontSize: 13, color: C.creamMuted }}>
                  <IconUsers size={16} color={C.creamMuted} />
                  <span style={{ fontFamily: FONT_STACK }}>
                    Recommendations for {results.groupProfile.memberCount} member
                    {results.groupProfile.memberCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {results.groupProfile.sharedGenres.length > 0 && (
                  <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
                      Shared favorites:
                    </span>
                    {results.groupProfile.sharedGenres.map((genre) => (
                      <span
                        key={genre.genreId}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          background: `${C.teal}15`,
                          color: C.teal,
                          fontSize: 11,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                        }}
                      >
                        {genre.genreName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations List */}
              {results.recommendations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ margin: "0 auto 16px", width: 48 }}>
                    <IconFilm size={48} color={C.creamFaint} />
                  </div>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      color: C.cream,
                      margin: "0 0 8px",
                      fontFamily: FONT_STACK,
                    }}
                  >
                    No recommendations found
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: C.creamMuted,
                      margin: 0,
                      fontFamily: FONT_STACK,
                    }}
                  >
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
        </div>
      </div>

      {/* ════════ STICKY BOTTOM ACTION BARS ════════ */}

      {/* Step 1: Continue button */}
      {step === "members" && (
        <div
          style={{
            flexShrink: 0,
            zIndex: 20,
            padding: "12px 20px 20px",
            background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
          }}
        >
          <button
            onClick={() => setStep("mood")}
            disabled={selectedMembers.length === 0}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "none",
              cursor: selectedMembers.length === 0 ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: FONT_STACK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background:
                selectedMembers.length > 0
                  ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                  : `${C.creamFaint}22`,
              color: selectedMembers.length > 0 ? C.warmBlack : `${C.creamFaint}66`,
              opacity: selectedMembers.length === 0 ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            Continue
            <IconChevronRight size={18} color={selectedMembers.length > 0 ? C.warmBlack : `${C.creamFaint}66`} />
          </button>
        </div>
      )}

      {/* Step 2: Get Recommendations + Back link */}
      {step === "mood" && (
        <div
          style={{
            flexShrink: 0,
            zIndex: 20,
            padding: "12px 20px 20px",
            background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => getRecommendations(1)}
              disabled={loading}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: FONT_STACK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                color: C.warmBlack,
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <>
                  <IconLoader size={18} color={C.warmBlack} />
                  Finding films...
                </>
              ) : (
                <>
                  <IconSparkle size={18} color={C.warmBlack} />
                  Get Recommendations
                </>
              )}
            </button>
            <button
              onClick={() => setStep("members")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: FONT_STACK,
                color: C.creamMuted,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "color 0.15s",
              }}
            >
              <IconChevronLeft size={16} color={C.creamMuted} />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Back + Shuffle side by side */}
      {step === "results" && results && (
        <div
          style={{
            flexShrink: 0,
            zIndex: 20,
            padding: "12px 20px 20px",
            background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
          }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            {/* Back (secondary) */}
            <button
              onClick={() => setStep("mood")}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                border: `1px solid ${C.creamFaint}22`,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: FONT_STACK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: C.bgCard,
                color: C.cream,
                transition: "all 0.15s ease",
              }}
            >
              <IconChevronLeft size={16} color={C.cream} />
              Back
            </button>

            {/* Shuffle (primary, flex 1.4) */}
            <button
              onClick={shuffleResults}
              disabled={loading}
              style={{
                flex: 1.4,
                height: 46,
                borderRadius: 14,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: FONT_STACK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                color: C.warmBlack,
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <IconLoader size={16} color={C.warmBlack} />
              ) : (
                <IconRefreshCw size={16} color={C.warmBlack} />
              )}
              Shuffle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
