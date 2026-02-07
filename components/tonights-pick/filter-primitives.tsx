import type React from "react"
import { C, FONT_STACK } from "./constants"

export function FilterPill({
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

export function FilterCard({
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

export function SectionLabel({ children }: { children: React.ReactNode }) {
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
