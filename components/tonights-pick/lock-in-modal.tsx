"use client"

import type { GroupMember } from "./types"
import { getAvatarGradient } from "./constants"

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', sans-serif"

type Props = {
  movieTitle: string
  movieYear: string | number
  participants: GroupMember[]
  onConfirm: () => void
  onCancel: () => void
}

export function LockInModal({ movieTitle, movieYear, participants, onConfirm, onCancel }: Props) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.66)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "lockInFadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes lockInFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lockInSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1c18",
          borderRadius: 16,
          border: "1px solid #2a2622",
          maxWidth: 340,
          width: "calc(100% - 40px)",
          padding: "28px 24px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          animation: "lockInSlideUp 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            color: "#c97b3a",
            textTransform: "uppercase",
            fontFamily: SANS,
            marginBottom: 14,
          }}
        >
          LOCK IN TONIGHT&apos;S PICK?
        </div>

        {/* Movie title */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#e8dcc8",
            fontFamily: SERIF,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {movieTitle}
        </div>

        {/* Year */}
        <div
          style={{
            fontSize: 13,
            color: "#777",
            fontFamily: SANS,
            marginBottom: 18,
          }}
        >
          {movieYear}
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "#2a2622", marginBottom: 16 }} />

        {/* Participants */}
        {participants.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex" }}>
                {participants.map((p, i) => {
                  const [c1, c2] = getAvatarGradient(p.name)
                  return (
                    <div
                      key={p.userId}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: p.avatarUrl
                          ? `url(${p.avatarUrl}) center/cover`
                          : `linear-gradient(135deg, ${c1}cc, ${c2}88)`,
                        border: "2px solid #1e1c18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1e1c18",
                        marginLeft: i === 0 ? 0 : -8,
                        zIndex: participants.length - i,
                        position: "relative",
                      }}
                    >
                      {!p.avatarUrl && (p.name?.[0] || "?")}
                    </div>
                  )
                })}
              </div>
              <span style={{ fontSize: 12, color: "#888", fontFamily: SANS }}>
                Watching together
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, background: "#2a2622", marginBottom: 16 }} />
          </>
        )}

        {/* Helper text */}
        <div
          style={{
            fontSize: 12,
            color: "#666",
            fontFamily: SANS,
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          This will be saved as a planned watch and visible on your dashboard and collective page.
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid #2a2622",
              background: "transparent",
              color: "#999",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: SANS,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#444"
              e.currentTarget.style.color = "#ccc"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2622"
              e.currentTarget.style.color = "#999"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #c97b3a, #e8943a)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: SANS,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)"
            }}
          >
            Lock It In
          </button>
        </div>
      </div>
    </div>
  )
}
