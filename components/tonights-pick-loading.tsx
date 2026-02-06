"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

// ── Film-inspired loading phrases ──
const loadingPhrases = [
  "Searching the archives…",
  "Rolling through the reels…",
  "Matching your taste…",
  "Curating tonight's lineup…",
  "Finding hidden gems…",
  "Consulting the critics…",
  "Lights, camera, almost…",
]

// ── Spinning Film Reel ──
function FilmReel({ size = 120, speed = 3 }: { size?: number; speed?: number }) {
  const spokeCount = 5
  const outerR = size / 2
  const innerR = outerR * 0.32
  const hubR = outerR * 0.18
  const rimWidth = outerR * 0.13

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ animation: `spinReel ${speed}s linear infinite` }}
    >
      {/* Outer rim */}
      <circle
        cx={outerR}
        cy={outerR}
        r={outerR - 2}
        fill="none"
        stroke="#D4753E"
        strokeWidth={rimWidth}
        opacity="0.2"
      />
      <circle
        cx={outerR}
        cy={outerR}
        r={outerR - 2}
        fill="none"
        stroke="#D4753E"
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Sprocket holes around rim */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const holeR = outerR - rimWidth / 2 - 1
        const cx = outerR + Math.cos(angle) * holeR
        const cy = outerR + Math.sin(angle) * holeR
        return (
          <circle
            key={`hole-${i}`}
            cx={cx}
            cy={cy}
            r={rimWidth * 0.22}
            fill="#0D0B09"
            stroke="#D4753E"
            strokeWidth="0.5"
            opacity="0.4"
          />
        )
      })}

      {/* Inner area */}
      <circle
        cx={outerR}
        cy={outerR}
        r={innerR + 4}
        fill="none"
        stroke="#D4753E"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Spokes */}
      {Array.from({ length: spokeCount }).map((_, i) => {
        const angle = (i / spokeCount) * Math.PI * 2
        const x1 = outerR + Math.cos(angle) * hubR
        const y1 = outerR + Math.sin(angle) * hubR
        const x2 = outerR + Math.cos(angle) * innerR
        const y2 = outerR + Math.sin(angle) * innerR
        return (
          <line
            key={`spoke-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#D4753E"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />
        )
      })}

      {/* Center hub */}
      <circle
        cx={outerR}
        cy={outerR}
        r={hubR}
        fill="#0D0B09"
        stroke="#D4753E"
        strokeWidth="2"
        opacity="0.7"
      />
      <circle cx={outerR} cy={outerR} r={hubR * 0.4} fill="#D4753E" opacity="0.3" />
    </svg>
  )
}

// ── Film strip frame that floats across ──
function FilmStrip({ delay = 0, top = "20%", direction = 1 }: { delay?: number; top?: string; direction?: number }) {
  const frameCount = 5
  const frameW = 32
  const frameH = 24
  const gap = 4
  const holeSize = 4
  const stripH = frameH + 16
  const stripW = (frameW + gap) * frameCount + gap

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: direction > 0 ? "-200px" : "auto",
        right: direction < 0 ? "-200px" : "auto",
        animation: `${direction > 0 ? "driftRight" : "driftLeft"} ${12 + delay * 2}s linear infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.08,
      }}
    >
      <svg width={stripW} height={stripH} viewBox={`0 0 ${stripW} ${stripH}`}>
        {/* Strip background */}
        <rect x="0" y="0" width={stripW} height={stripH} rx="2" fill="#D4753E" />

        {/* Sprocket holes top */}
        {Array.from({ length: frameCount * 2 + 1 }).map((_, i) => (
          <rect
            key={`ht-${i}`}
            x={gap + i * ((stripW - gap * 2) / (frameCount * 2))}
            y="2"
            width={holeSize}
            height={holeSize}
            rx="1"
            fill="#0D0B09"
          />
        ))}

        {/* Sprocket holes bottom */}
        {Array.from({ length: frameCount * 2 + 1 }).map((_, i) => (
          <rect
            key={`hb-${i}`}
            x={gap + i * ((stripW - gap * 2) / (frameCount * 2))}
            y={stripH - holeSize - 2}
            width={holeSize}
            height={holeSize}
            rx="1"
            fill="#0D0B09"
          />
        ))}

        {/* Frames */}
        {Array.from({ length: frameCount }).map((_, i) => (
          <rect
            key={`frame-${i}`}
            x={gap + i * (frameW + gap)}
            y={8}
            width={frameW}
            height={frameH}
            rx="1"
            fill="#0D0B09"
            opacity="0.7"
          />
        ))}
      </svg>
    </div>
  )
}

// ── Floating dust/light particles ──
function Particles() {
  const particles = Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 5,
    drift: (Math.random() - 0.5) * 40,
  }))

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.size > 3 ? "#D4753E" : "#e8e0d8",
            opacity: 0,
            animation: `particleFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  )
}

// ── Projector light beam ──
function ProjectorBeam() {
  return (
    <div
      style={{
        position: "absolute",
        top: "-10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "150%",
        height: "55%",
        background:
          "conic-gradient(from 170deg at 50% 0%, transparent 35%, rgba(212,117,62,0.03) 45%, rgba(212,117,62,0.06) 50%, rgba(212,117,62,0.03) 55%, transparent 65%)",
        pointerEvents: "none",
        animation: "beamPulse 4s ease-in-out infinite",
      }}
    />
  )
}

// ── Countdown digit ──
function CountdownNumber({ number }: { number: number }) {
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: "'Playfair Display', serif",
        fontSize: 160,
        fontWeight: 700,
        color: "#D4753E",
        opacity: 0.04,
        lineHeight: 1,
        animation: "countdownPulse 1s ease-out forwards",
        pointerEvents: "none",
      }}
    >
      {number}
    </div>
  )
}

// ── Main Loading Component ──
export function TonightsPickLoading() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [showCountdown, setShowCountdown] = useState(true)

  // Cycle through loading phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setShowCountdown(false)
      return
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1100)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        borderRadius: "16px",
        background: "#0D0B09",
      }}
    >
      <style jsx>{`
        @keyframes spinReel {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes driftRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100vw + 400px));
          }
        }

        @keyframes driftLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100vw - 400px));
          }
        }

        @keyframes particleFloat {
          0%,
          100% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          15% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.3;
          }
          85% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) translateX(20px);
          }
        }

        @keyframes beamPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes phraseIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes countdownPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.08;
          }
          40% {
            transform: scale(1.1);
            opacity: 0.06;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        @keyframes reelFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes dotPulse {
          0%,
          80%,
          100% {
            opacity: 0.2;
            transform: scale(0.85);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes marqueeGrain {
          0%,
          100% {
            opacity: 0.03;
          }
          50% {
            opacity: 0.06;
          }
        }
      `}</style>

      {/* ── Background atmosphere ── */}
      <ProjectorBeam />
      <Particles />

      {/* Film strips drifting in background */}
      <FilmStrip delay={0} top="15%" direction={1} />
      <FilmStrip delay={3} top="38%" direction={-1} />
      <FilmStrip delay={1.5} top="62%" direction={1} />
      <FilmStrip delay={4.5} top="82%" direction={-1} />

      {/* Film grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          animation: "marqueeGrain 3s ease-in-out infinite",
        }}
      />

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* ── Center content ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          zIndex: 10,
          animation: "fadeInUp 0.8s ease-out",
          padding: "40px 24px",
        }}
      >
        {/* Countdown watermark */}
        {showCountdown && countdown > 0 && (
          <div
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              top: "-40px",
            }}
          >
            <CountdownNumber key={countdown} number={countdown} />
          </div>
        )}

        {/* Film reel */}
        <div style={{ animation: "reelFloat 3s ease-in-out infinite" }}>
          <div
            style={{
              position: "relative",
              filter: "drop-shadow(0 0 40px rgba(212,117,62,0.15))",
            }}
          >
            <FilmReel size={120} speed={3} />

            {/* Center glow */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(212,117,62,0.15) 0%, transparent 70%)",
                animation: "beamPulse 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#e8e0d8",
              letterSpacing: "0.01em",
            }}
          >
            Tonight's Pick
          </h2>

          {/* Shimmer line */}
          <div
            style={{
              margin: "10px auto 0",
              width: 60,
              height: 2,
              borderRadius: 1,
              background: "linear-gradient(90deg, transparent, #D4753E, transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Loading phrase */}
        <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p
            key={phraseIndex}
            style={{
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#a09890",
              animation: "phraseIn 0.4s ease-out",
              letterSpacing: "0.02em",
            }}
          >
            {loadingPhrases[phraseIndex]}
          </p>
        </div>

        {/* Dot pulse indicator */}
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#D4753E",
                animation: `dotPulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom: fake card skeletons fading in ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 24px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "100%",
              maxWidth: 480,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(30,26,22,0.5) 0%, rgba(20,17,14,0.6) 100%)",
              border: "1px solid rgba(232,224,216,0.04)",
              animation: "fadeInUp 0.6s ease-out backwards",
              animationDelay: `${1.5 + i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
