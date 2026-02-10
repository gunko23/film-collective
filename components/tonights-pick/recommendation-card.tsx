"use client"

import { useState } from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import type { MovieRecommendation, ConcessionPairings } from "./types"

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', sans-serif"

// ─── LOCK IT IN BUTTON ───
function LockItInButton({
  isLocked,
  onLockIn,
}: {
  isLocked: boolean
  onLockIn: () => void
}) {
  if (isLocked) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          color: "#2ecc71",
          fontFamily: SANS,
          padding: "8px 16px",
        }}
      >
        &#x2713; Locked In
      </span>
    )
  }

  return (
    <button
      onClick={onLockIn}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "transparent",
        border: "1px solid #c97b3a44",
        borderRadius: 8,
        padding: "8px 16px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: "#c97b3a",
        fontFamily: SANS,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#c97b3a11"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      <span style={{ fontSize: 10 }}>&#x25B6;</span>
      Lock It In
    </button>
  )
}

// ─── METASCORE-STYLE FIT BADGE ───
function FitScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#6c3" : score >= 60 ? "#fc3" : "#f33"
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `2px solid ${color}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        color,
        fontFamily: SANS,
        background: `${color}10`,
      }}
    >
      {score}
    </div>
  )
}

// ─── CHALKBOARD CONCESSION STAND ───
function ChalkboardSection({ pairings }: { pairings: ConcessionPairings }) {
  const items = [
    { label: "cocktail", icon: "\uD83C\uDF78", ...pairings.cocktail },
    { label: "zero-proof", icon: "\uD83C\uDF3F", ...pairings.zeroproof },
    { label: "snack", icon: "\uD83E\uDDC2", ...pairings.snack },
  ]

  return (
    <div
      style={{
        background: "linear-gradient(170deg, #1b2b1b 0%, #162016 50%, #1a271a 100%)",
        borderRadius: 6,
        overflow: "hidden",
        position: "relative",
        boxShadow: "inset 0 0 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Wood frame top */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(180deg, #5a3f22, #4a3318)",
          borderBottom: "1px solid #2a1a08",
        }}
      />

      {/* Chalk dust texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.025) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "14px 16px 10px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid #5a7a5a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              color: "#7a9a7a",
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: 3.5,
              color: "#7a9a7a",
              textTransform: "uppercase",
              fontFamily: SANS,
              fontWeight: 500,
            }}
          >
            Pair with your screening
          </span>
        </div>

        {/* Items */}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "9px 0",
              borderTop: i > 0 ? "1px solid #243024" : "none",
            }}
          >
            <span style={{ fontSize: 15, marginTop: 1, opacity: 0.85 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span style={{ fontSize: 13.5, color: "#e2ddd0", fontFamily: SERIF, fontStyle: "italic" }}>
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: "#5a7a5a",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontFamily: SANS,
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "#7a9a7a", lineHeight: 1.5, fontFamily: SERIF }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wood frame bottom */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(180deg, #4a3318, #5a3f22)",
          borderTop: "1px solid #2a1a08",
        }}
      />
    </div>
  )
}

// ─── PARENTAL GUIDE TOGGLE ───
function ParentalGuide({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b6259"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span
          style={{
            fontSize: 11,
            color: "#6b6259",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: SANS,
            fontWeight: 500,
          }}
        >
          Parental Guide
        </span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            background: "#1a1714",
            borderRadius: 6,
            borderLeft: "2px solid #4a3828",
            fontSize: 12,
            color: "#8a7e70",
            lineHeight: 1.6,
            fontFamily: SERIF,
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}

// ─── MOVIE CARD ───
export function RecommendationCard({
  movie,
  index,
  isLocked = false,
  isFaded = false,
  onLockIn,
}: {
  movie: MovieRecommendation
  index: number
  isLocked?: boolean
  isFaded?: boolean
  onLockIn?: () => void
}) {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ""
  const reasoningText = movie.reasoning?.[0] || ""
  const parentalText = movie.parentalSummary || null

  return (
    <div
      style={{
        background: "linear-gradient(175deg, #181410 0%, #141210 100%)",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        border: isLocked ? "1px solid #2ecc7144" : "1px solid #2a2420",
        animation: `sfFadeSlideIn 0.4s ease ${index * 0.08}s both`,
        opacity: isFaded ? 0.35 : 1,
        transition: "opacity 0.4s ease, border-color 0.3s ease",
      }}
    >
      {/* Left accent stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(180deg, #e8843a 0%, #c45a2a 100%)",
          borderRadius: "10px 0 0 10px",
        }}
      />

      {/* Card content */}
      <div style={{ padding: "18px 18px 14px 20px" }}>
        {/* Movie info row */}
        <div style={{ display: "flex", gap: 14 }}>
          {/* Poster */}
          <div
            style={{
              width: 82,
              height: 120,
              borderRadius: 5,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            {movie.posterPath ? (
              <Image
                src={getImageUrl(movie.posterPath, "w185") || ""}
                alt={movie.title}
                width={82}
                height={120}
                style={{ width: 82, height: 120, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #2a2030, #1a1520)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#4a4050",
                  fontFamily: SANS,
                  padding: 8,
                  textAlign: "center",
                }}
              >
                {movie.title}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: "#ece6da",
                margin: "0 0 6px 0",
                fontFamily: SERIF,
                lineHeight: 1.2,
              }}
            >
              {movie.title}
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#6b6259", fontFamily: SANS }}>{year}</span>

              {/* Star rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#e8a43a">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#e8a43a", fontFamily: SANS }}>
                  {movie.voteAverage?.toFixed(1)}
                </span>
              </div>

              <FitScoreBadge score={movie.groupFitScore} />
            </div>
          </div>
        </div>

        {/* Why we picked this */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#e8843a18",
                border: "1.5px solid #e8843a55",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e8843a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2.5,
                color: "#e8843a",
                textTransform: "uppercase",
                fontFamily: SANS,
              }}
            >
              Why we picked this
            </span>
          </div>
          <p
            style={{
              fontSize: 13.5,
              color: "#998e80",
              lineHeight: 1.7,
              margin: 0,
              fontFamily: SERIF,
            }}
          >
            {reasoningText}
          </p>
        </div>

        {/* Chalkboard concession stand */}
        {movie.pairings && (
          <div style={{ marginTop: 16 }}>
            <ChalkboardSection pairings={movie.pairings} />
          </div>
        )}

        {/* Bottom actions */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {parentalText ? (
            <ParentalGuide text={parentalText} />
          ) : (
            <div />
          )}

          <button
            onClick={() => (window.location.href = `/movies/${movie.tmdbId}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1px solid #2a2420",
              borderRadius: 20,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#e8843a55"
              e.currentTarget.style.background = "#e8843a0a"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2420"
              e.currentTarget.style.background = "none"
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7e70"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={{ fontSize: 12, color: "#8a7e70", fontFamily: SANS, fontWeight: 500 }}>
              View Details
            </span>
          </button>
        </div>

        {/* Lock It In action */}
        {onLockIn && (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <LockItInButton isLocked={isLocked} onLockIn={onLockIn} />
          </div>
        )}
      </div>
    </div>
  )
}
