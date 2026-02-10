"use client"

import { useEffect } from "react"

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', sans-serif"

type Props = {
  movieTitle: string
  onComplete: () => void
}

export function LockInSuccess({ movieTitle, onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        animation: "successFadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes successFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes successCheckPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes successTextSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Checkmark circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c97b3a, #e8943a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          animation: "successCheckPop 0.4s ease 0.1s both",
        }}
      >
        <span style={{ fontSize: 28, color: "#fff", fontWeight: 700, lineHeight: 1 }}>
          &#x2713;
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2.5,
          color: "#c97b3a",
          textTransform: "uppercase",
          fontFamily: SANS,
          marginBottom: 12,
          animation: "successTextSlide 0.3s ease 0.3s both",
        }}
      >
        TONIGHT&apos;S PICK IS SET
      </div>

      {/* Movie title */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#e8dcc8",
          fontFamily: SERIF,
          fontStyle: "italic",
          textAlign: "center",
          padding: "0 32px",
          lineHeight: 1.3,
          animation: "successTextSlide 0.3s ease 0.45s both",
        }}
      >
        {movieTitle}
      </div>
    </div>
  )
}
