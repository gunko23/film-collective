"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"

// ── Soulframe color tokens ──
const C = {
  bg: "#0f0d0b", bgCard: "#1a1714", bgCardHover: "#211e19", bgElevated: "#252119",
  blue: "#3d5a96", blueMuted: "#2e4470", blueLight: "#5a7cb8",
  orange: "#ff6b2d", orangeMuted: "#cc5624", orangeLight: "#ff8f5e",
  cream: "#e8e2d6", creamMuted: "#a69e90", creamFaint: "#6b6358", warmBlack: "#0a0908",
  teal: "#4a9e8e", rose: "#c4616a", green: "#4ade80", purple: "#a78bfa", red: "#ef4444", yellow: "#facc15",
}

// ── Types ──
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

// ── Inline SVG Icons ──
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
)

const CoffeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 110 8h-1" />
    <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
)

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
)

const AwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
)

const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44A2.5 2.5 0 015 17.5a2.5 2.5 0 01.49-4.78A2.5 2.5 0 014 10a2.5 2.5 0 013.92-2.06A2.5 2.5 0 019.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44A2.5 2.5 0 0019 17.5a2.5 2.5 0 00-.49-4.78A2.5 2.5 0 0020 10a2.5 2.5 0 00-3.92-2.06A2.5 2.5 0 0014.5 2z" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blueLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const FilmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.creamMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const CheckIcon = ({ size = 14, color = C.cream }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ChevronDownIcon = ({ size = 12, color = C.creamMuted, className = "" }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const InfoIcon = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.creamMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

// ── Mood config with unique colors ──
const MOOD_OPTIONS: { value: Mood; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { value: null, label: "Any Mood", icon: <SparkleIcon />, description: "Show me everything", color: C.orange },
  { value: "fun", label: "Fun", icon: <CoffeeIcon />, description: "Light & entertaining", color: C.yellow },
  { value: "intense", label: "Intense", icon: <ZapIcon />, description: "Edge of your seat", color: C.red },
  { value: "emotional", label: "Emotional", icon: <HeartIcon />, description: "Feel all the feels", color: C.rose },
  { value: "mindless", label: "Mindless", icon: <BrainIcon />, description: "Turn brain off", color: C.teal },
  { value: "acclaimed", label: "Acclaimed", icon: <AwardIcon />, description: "Critics' favorites", color: C.purple },
]

// ── Accent bar cycling colors for result cards ──
const ACCENT_COLORS = [C.orange, C.teal, C.blue, C.rose, C.purple, C.green]

// ── FitScoreRing ──
const FitScoreRing = ({ score }: { score: number }) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? C.teal : score >= 60 ? C.orange : C.creamFaint

  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
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
        style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "monospace", fontSize: 13, fontWeight: 600, color,
        }}
      >
        {score}
      </div>
    </div>
  )
}

// ── ParentalBadge ──
const ParentalBadge = ({ category, severity }: { category: string; severity: string }) => {
  if (!severity || severity === "None") return null

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    None: { bg: `rgba(74,158,142,0.12)`, text: C.teal, border: `rgba(74,158,142,0.25)` },
    Mild: { bg: `rgba(255,107,45,0.10)`, text: C.orangeLight, border: `rgba(255,107,45,0.25)` },
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

  const colors = severityColors[severity] || severityColors.Mild

  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 8px", borderRadius: 6,
        fontSize: 11, fontWeight: 500,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      <span>{severityLabels[category]}: {severity}</span>
    </div>
  )
}

// ── RecommendationCard (Soulframe) ──
const RecommendationCard = ({ movie, index }: { movie: MovieRecommendation; index: number }) => {
  const [parentalGuideOpen, setParentalGuideOpen] = useState(false)

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ""
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0
  const mins = movie.runtime ? movie.runtime % 60 : 0
  const runtimeStr = movie.runtime ? `${hours}h ${mins}m` : null
  const reasoningText = movie.reasoning?.[0] || ""
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length]

  const guide = movie.parentalGuide
  const categories = ["violence", "sexNudity", "profanity", "alcoholDrugsSmoking", "frighteningIntense"] as const
  const hasParentalContent = guide && categories.some(c => guide[c] && guide[c] !== "None")

  const severityRank = { None: 0, Mild: 1, Moderate: 2, Severe: 3 }
  const maxSeverity = guide ? categories.reduce((max, cat) => {
    const level = guide[cat] || "None"
    return severityRank[level as keyof typeof severityRank] > severityRank[max as keyof typeof severityRank] ? level : max
  }, "None") : "None"

  const summaryColors: Record<string, { bg: string; text: string; border: string }> = {
    None: { bg: `rgba(74,158,142,0.12)`, text: C.teal, border: `rgba(74,158,142,0.25)` },
    Mild: { bg: `rgba(255,107,45,0.10)`, text: C.orangeLight, border: `rgba(255,107,45,0.25)` },
    Moderate: { bg: `rgba(250,204,21,0.10)`, text: C.yellow, border: `rgba(250,204,21,0.25)` },
    Severe: { bg: `rgba(239,68,68,0.10)`, text: C.red, border: `rgba(239,68,68,0.25)` },
  }
  const summaryColor = summaryColors[maxSeverity] || summaryColors.Mild

  // Score badge color
  const scoreColor = movie.groupFitScore >= 80 ? C.teal : movie.groupFitScore >= 60 ? C.orange : C.creamFaint

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: C.bgCard,
        border: `1px solid rgba(232,226,214,0.07)`,
        transition: "border-color 0.2s, box-shadow 0.3s",
        animation: `sfFadeSlideIn 0.4s ease ${index * 0.08}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accentColor}40`
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(232,226,214,0.07)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80, transparent)` }} />

      {/* Header: Poster + Meta */}
      <div style={{ display: "flex", gap: 14, padding: "16px 16px 0" }}>
        {/* Poster */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          {movie.posterPath ? (
            <Image
              src={getImageUrl(movie.posterPath, "w185") || ""}
              alt={movie.title}
              width={80}
              height={120}
              className="rounded-lg object-cover"
              style={{ width: 80, height: 120, boxShadow: "0 4px 16px rgba(0,0,0,0.4)", borderRadius: 10 }}
            />
          ) : (
            <div style={{
              width: 80, height: 120, background: "rgba(232,226,214,0.05)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FilmIcon />
            </div>
          )}
          {/* Score badge circle overlay */}
          <div style={{
            position: "absolute", bottom: -8, right: -8,
            width: 36, height: 36, borderRadius: "50%",
            background: C.bgCard, border: `2px solid ${scoreColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: scoreColor,
            boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
          }}>
            {movie.groupFitScore}
          </div>
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <h3 style={{
            fontSize: 17, fontWeight: 700, lineHeight: 1.25, color: C.cream, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {movie.title}
          </h3>

          {/* Year / Rating / Runtime */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: C.creamMuted }}>
            <span>{year}</span>
            <span style={{ opacity: 0.3 }}>*</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: C.orange, fontSize: 13 }}>&#9733;</span>
              <span style={{ color: C.cream, fontFamily: "monospace", fontWeight: 500, fontSize: 13 }}>
                {movie.voteAverage?.toFixed(1)}
              </span>
            </span>
            {runtimeStr && (
              <>
                <span style={{ opacity: 0.3 }}>*</span>
                <span>{runtimeStr}</span>
              </>
            )}
          </div>

          {/* Genre pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            {movie.genres?.slice(0, 3).map(g => (
              <span
                key={g.id}
                style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 4,
                  fontSize: 11, fontWeight: 500, color: C.creamMuted,
                  background: "rgba(232,226,214,0.06)", border: "1px solid rgba(232,226,214,0.08)",
                  letterSpacing: "0.02em",
                }}
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* WHY WE PICKED THIS */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            borderRadius: 10, padding: 14,
            background: `${accentColor}08`,
            borderLeft: `3px solid ${accentColor}60`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <CheckIcon size={14} color={accentColor} />
            <span style={{
              fontSize: 10, fontWeight: 700, color: accentColor, opacity: 0.8,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Why we picked this
            </span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#c8c0b8", margin: 0 }}>
            {reasoningText}
          </p>
        </div>
      </div>

      {/* Seen By */}
      {movie.seenBy?.length > 0 && (
        <div style={{
          padding: "8px 16px 0", display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: C.creamMuted, opacity: 0.7,
        }}>
          <EyeIcon />
          <span>You may have seen this</span>
        </div>
      )}

      {/* Parental Guide (collapsed) */}
      {hasParentalContent && (
        <div style={{ padding: "8px 16px 0" }}>
          <button
            onClick={() => setParentalGuideOpen(!parentalGuideOpen)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, fontSize: 12, color: summaryColor.text,
              opacity: 0.85, transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.85" }}
          >
            <InfoIcon size={14} />
            <span style={{ fontWeight: 500 }}>Parental Guide</span>
            <span
              style={{
                fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                background: summaryColor.bg, border: `1px solid ${summaryColor.border}`,
              }}
            >
              Up to {maxSeverity}
            </span>
            <ChevronDownIcon
              size={12}
              color={summaryColor.text}
              className={parentalGuideOpen ? "sf-chevron-rotated" : "sf-chevron"}
            />
          </button>

          {parentalGuideOpen && guide && (
            <div
              style={{
                display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingTop: 8,
                borderTop: "1px solid rgba(232,226,214,0.06)",
                animation: "sfFadeSlideIn 0.2s ease",
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
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "12px 16px 14px" }}>
        <button
          onClick={() => window.location.href = `/movies/${movie.tmdbId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
            background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accentColor}28`
            e.currentTarget.style.borderColor = `${accentColor}50`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${accentColor}18`
            e.currentTarget.style.borderColor = `${accentColor}30`
          }}
        >
          <ExternalLinkIcon />
          View Details
        </button>
      </div>
    </div>
  )
}

// ── Filter pill style helper ──
function pillStyle(isSelected: boolean, accentColor: string = C.blue): React.CSSProperties {
  return {
    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s", border: "1px solid",
    background: isSelected ? `${accentColor}18` : "rgba(232,226,214,0.04)",
    borderColor: isSelected ? `${accentColor}50` : "rgba(232,226,214,0.08)",
    color: isSelected ? C.cream : C.creamMuted,
  }
}

// ── Filter card wrapper ──
function FilterCard({ accentColor, accentEnd, children }: { accentColor: string; accentEnd?: string; children: React.ReactNode }) {
  const gradient = accentEnd
    ? `linear-gradient(90deg, ${accentColor}, ${accentEnd}, transparent)`
    : `linear-gradient(90deg, ${accentColor}, ${accentColor}60, transparent)`
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: C.bgCard, border: "1px solid rgba(232,226,214,0.06)",
    }}>
      <div style={{ height: 3, background: gradient }} />
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  )
}

// ── Content filter level pill colors per category ──
const CONTENT_CATEGORY_COLORS: Record<string, string> = {
  Violence: C.red,
  "Sex/Nudity": C.rose,
  Language: C.orange,
  Substances: C.purple,
  "Frightening Scenes": C.teal,
}

function contentPillStyle(isSelected: boolean, categoryLabel: string): React.CSSProperties {
  const catColor = CONTENT_CATEGORY_COLORS[categoryLabel] || C.blue
  return {
    padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s", border: "1px solid", textAlign: "center",
    background: isSelected ? `${catColor}18` : "transparent",
    borderColor: isSelected ? `${catColor}50` : "rgba(232,226,214,0.08)",
    color: isSelected ? C.cream : C.creamFaint,
  }
}

// ── Step Indicator ──
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
                {isCompleted ? <CheckIcon size={14} color={C.warmBlack} /> : i + 1}
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
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 0",
          color: C.creamMuted,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.creamMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Back</span>
      </button>
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
        .sf-chevron {
          transition: transform 0.2s;
          transform: rotate(0deg);
        }
        .sf-chevron-rotated {
          transition: transform 0.2s;
          transform: rotate(180deg);
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

      {/* ═══════════════════════════════════════════ */}
      {/* Step 1: Mood & Filters                     */}
      {/* ═══════════════════════════════════════════ */}
      {step === "mood" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Mood Cards - 2x3 grid */}
          <div>
            <p style={{ fontSize: 14, color: C.creamMuted, margin: "0 0 12px" }}>
              What are you in the mood for?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {MOOD_OPTIONS.map((option) => {
                const isSelected = selectedMood === option.value
                return (
                  <button
                    key={option.value || "any"}
                    onClick={() => setSelectedMood(option.value)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      padding: "16px 12px", borderRadius: 14, cursor: "pointer",
                      transition: "all 0.2s", border: "1px solid", position: "relative", overflow: "hidden",
                      background: isSelected
                        ? `linear-gradient(135deg, ${option.color}12, ${option.color}06)`
                        : C.bgCard,
                      borderColor: isSelected ? `${option.color}60` : "rgba(232,226,214,0.06)",
                    }}
                  >
                    {/* Accent bar on selected */}
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${option.color}, transparent)`,
                      }} />
                    )}

                    {/* Icon circle */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isSelected ? `${option.color}20` : "rgba(232,226,214,0.06)",
                      color: isSelected ? option.color : C.creamFaint,
                      transition: "all 0.2s",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                    }}>
                      {option.icon}
                    </div>

                    <span style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>{option.label}</span>
                    <span style={{ fontSize: 12, color: C.creamFaint, textAlign: "center", lineHeight: 1.3 }}>
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Runtime Filter */}
          <FilterCard accentColor={C.blue}>
            <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 10px", fontWeight: 500 }}>
              Maximum Runtime
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[null, 90, 120, 150].map((time) => (
                <button
                  key={time || "any"}
                  onClick={() => setMaxRuntime(time)}
                  style={pillStyle(maxRuntime === time, C.blue)}
                >
                  {time ? `${time}m` : "Any"}
                </button>
              ))}
            </div>
          </FilterCard>

          {/* Content Rating Filter */}
          <FilterCard accentColor={C.blue} accentEnd={C.teal}>
            <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 10px", fontWeight: 500 }}>
              Content Rating
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
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
                  style={pillStyle(contentRating === rating.value, C.blue)}
                >
                  {rating.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.creamFaint, margin: "8px 0 0" }}>
              Includes that rating and below (e.g., PG-13 includes G, PG, and PG-13)
            </p>
          </FilterCard>

          {/* Era + Released After - Combined Card */}
          <FilterCard accentColor={C.teal}>
            <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 10px", fontWeight: 500 }}>
              Era
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
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
                  style={pillStyle(era === option.value, C.teal)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Faint divider */}
            <div style={{ height: 1, background: "rgba(232,226,214,0.06)", margin: "14px 0" }} />

            <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 10px", fontWeight: 500 }}>
              Released After
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
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
                  style={pillStyle(startYear === option.value, C.teal)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {era && startYear ? (
              <p style={{ fontSize: 11, color: C.creamFaint, margin: "8px 0 0" }}>
                Era filter takes priority over released after
              </p>
            ) : null}
          </FilterCard>

          {/* Streaming Services */}
          <FilterCard accentColor={C.blueMuted}>
            <p style={{ fontSize: 13, color: C.creamMuted, margin: "0 0 10px", fontWeight: 500 }}>
              Streaming Services
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {US_SUBSCRIPTION_PROVIDERS.map((provider) => {
                const isSelected = streamingProviders.includes(provider.id)
                return (
                  <button
                    key={provider.id}
                    onClick={() => toggleStreamingProvider(provider.id)}
                    style={{
                      ...pillStyle(isSelected, C.blue),
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <Image
                      src={getImageUrl(provider.logoPath, "w92") || ""}
                      alt={provider.shortName}
                      width={22}
                      height={22}
                      style={{ borderRadius: 5, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                  background: "transparent", border: "none", cursor: "pointer",
                  marginTop: 8, fontSize: 12, color: C.creamFaint, padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.cream }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.creamFaint }}
              >
                Clear streaming filter
              </button>
            )}
            <p style={{ fontSize: 10, color: `${C.creamFaint}80`, margin: "8px 0 0" }}>
              Streaming data by JustWatch
            </p>
          </FilterCard>

          {/* Content Filters Accordion */}
          <div style={{
            borderRadius: 14, overflow: "hidden",
            background: C.bgCard, border: "1px solid rgba(232,226,214,0.06)",
          }}>
            {/* Accent bar: blue-to-rose */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${C.blue}, ${C.rose}, transparent)` }} />

            <button
              onClick={() => setShowContentFilters(!showContentFilters)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: 16, background: "transparent", border: "none", cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,226,214,0.02)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldIcon />
                <span style={{ fontSize: 14, fontWeight: 500, color: C.cream }}>Content Filters</span>
                {(maxViolence || maxSexNudity || maxProfanity || maxSubstances || maxFrightening) && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 12,
                    background: `${C.blueLight}20`, color: C.blueLight, fontSize: 11, fontWeight: 500,
                  }}>
                    Active
                  </span>
                )}
              </div>
              <ChevronDownIcon
                size={16}
                color={C.creamFaint}
                className={showContentFilters ? "sf-chevron-rotated" : "sf-chevron"}
              />
            </button>

            {showContentFilters && (
              <div style={{
                padding: 16, paddingTop: 0,
                borderTop: "1px solid rgba(232,226,214,0.06)",
                display: "flex", flexDirection: "column", gap: 16,
              }}>
                <p style={{ fontSize: 12, color: C.creamFaint, margin: 0 }}>
                  Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                </p>

                {/* Quick Presets */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    onClick={() => {
                      setMaxViolence(null)
                      setMaxSexNudity(null)
                      setMaxProfanity(null)
                      setMaxSubstances(null)
                      setMaxFrightening(null)
                    }}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: "transparent", border: "1px solid rgba(232,226,214,0.1)",
                      color: C.creamMuted, cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,226,214,0.04)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
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
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: `${C.green}14`, border: `1px solid ${C.green}30`,
                      color: C.green, cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${C.green}22` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${C.green}14` }}
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
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: `${C.yellow}14`, border: `1px solid ${C.yellow}30`,
                      color: C.yellow, cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${C.yellow}22` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${C.yellow}14` }}
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
                  ] as const).map((category) => (
                    <div key={category.label}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.cream }}>
                          {category.label}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6 }}>
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
                            style={contentPillStyle(category.state === level.value, category.label)}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 12, color: C.creamFaint, margin: 0 }}>
                  Note: Movies without parental guide data in our database will still be shown.
                </p>
              </div>
            )}
          </div>

        </div>
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
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Finding films...
              </>
            ) : (
              <>
                <span style={{ fontSize: 18 }}>&#10022;</span>
                Get Recommendations
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* Step 2: Results                            */}
      {/* ═══════════════════════════════════════════ */}
      {step === "results" && results && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* User Profile Summary */}
          <div style={{
            borderRadius: 14, padding: 14, overflow: "hidden",
            background: C.bgCard, border: "1px solid rgba(232,226,214,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.creamMuted, marginBottom: 10 }}>
              <UserIcon />
              <span>Based on your ratings</span>
            </div>
            {results.userProfile.sharedGenres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.creamFaint }}>Your favorites:</span>
                {results.userProfile.sharedGenres.map((genre) => (
                  <span
                    key={genre.genreId}
                    style={{
                      padding: "3px 10px", borderRadius: 12,
                      background: `${C.blue}18`, color: C.blueLight, fontSize: 11, fontWeight: 500,
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
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
                <FilmIcon />
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
            {/* Back button */}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            {/* Shuffle button */}
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
              {loading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              )}
              Shuffle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
