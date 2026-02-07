"use client"

import { useState, useId } from "react"
import { getImageUrl } from "@/lib/tmdb/image"
import { colors } from "@/lib/design-tokens"
import type { Film } from "@/components/modals/log-film-modal"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

function extractYear(dateString?: string): string {
  if (!dateString) return ""
  return dateString.substring(0, 4)
}

export function QuickAddCard({
  film,
  existingRating,
  onSelect,
}: {
  film: Film
  existingRating?: number
  onSelect: (film: Film) => void
}) {
  const [hovered, setHovered] = useState(false)
  const baseId = useId()
  const posterUrl = getImageUrl(film.posterPath ?? null, "w185")
  const hasRating = existingRating != null && existingRating > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(film)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: 0,
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          borderRadius: "8px",
          marginBottom: "8px",
          overflow: "hidden",
          transform: hovered ? "scale(1.03)" : "scale(1)",
          transition: "transform 0.15s",
          backgroundColor: colors.surfaceLight,
        }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={film.title}
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
      <p style={{ fontSize: "12px", fontWeight: 500, color: colors.cream }}>{film.title}</p>
      {hasRating ? (
        <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <RatingStar
              key={s}
              fill={getStarFill(s, existingRating!)}
              size={10}
              filledColor={colors.accent}
              emptyColor={`${colors.cream}15`}
              uid={`qac-${baseId}-${s}`}
            />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "11px", color: colors.textMuted }}>{extractYear(film.releaseDate)}</p>
      )}
    </button>
  )
}
