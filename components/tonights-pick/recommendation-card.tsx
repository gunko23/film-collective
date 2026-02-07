"use client"

import { useState } from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { C, FONT_STACK, RESULT_ACCENT_COLORS } from "./constants"
import { IconFilm, IconCheck, IconExternalLink, IconShield, IconChevronRight } from "./icons"
import type { MovieRecommendation, ParentalGuideInfo } from "./types"

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

export function RecommendationCard({ movie, index }: { movie: MovieRecommendation; index: number }) {
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

      {/* Parental guide -- collapsed toggle */}
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
