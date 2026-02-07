"use client"

import { useState } from "react"
import { getImageUrl } from "@/lib/tmdb/image"
import { colors } from "@/lib/design-tokens"
import type { Film } from "@/components/modals/log-film-modal"

function extractYear(dateString?: string): string {
  if (!dateString) return ""
  return dateString.substring(0, 4)
}

export function SearchResultRow({
  film,
  existingRating,
  onSelect,
}: {
  film: Film
  existingRating?: number
  onSelect: (film: Film) => void
}) {
  const [hovered, setHovered] = useState(false)
  const posterUrl = getImageUrl(film.posterPath ?? null, "w92")
  const hasRating = existingRating != null && existingRating > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(film)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px",
        backgroundColor: hovered ? colors.surfaceLight : colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: "12px",
        cursor: "pointer",
        color: colors.cream,
        textAlign: "left",
        width: "100%",
        transition: "background-color 0.15s",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "68px",
          borderRadius: "6px",
          flexShrink: 0,
          overflow: "hidden",
          backgroundColor: colors.surfaceLight,
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${colors.accent}60, ${colors.cool}30)`,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "15px", fontWeight: 500, marginBottom: "4px" }}>{film.title}</p>
        <p style={{ fontSize: "13px", color: colors.textTertiary }}>
          {extractYear(film.releaseDate)}
          {film.director && ` \u00b7 ${film.director}`}
        </p>
        {hasRating && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <div style={{ display: "flex", gap: "1px" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: "11px",
                    color: s <= Math.round(existingRating!) ? colors.accent : `${colors.cream}15`,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>Rated</span>
          </div>
        )}
      </div>
    </button>
  )
}
