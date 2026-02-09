import { useState, useEffect, useRef } from "react";

// ── Color palette (Soulframe-aligned) ──
const C = {
  bg: "#0c0a08",
  warm: "#1a1510",
  card: "#1e1915",
  gold: "#d4a050",
  goldDim: "#a07830",
  orange: "#d4753e",
  orangeDim: "#a85a30",
  cream: "#e8dcc6",
  creamMid: "#b0a088",
  creamDim: "#706858",
  curtainDeep: "#6a1a1a",
  curtainMid: "#8a2828",
  curtainLight: "#a83838",
};

const phrases = [
  "Warming up the projector…",
  "Shuffling the reels…",
  "Buttering the popcorn…",
  "Dimming the lights…",
  "Matching your vibe…",
  "Polling your friends…",
  "Mixing the drinks…",
  "Checking the critics…",
  "Rolling through the archives…",
  "Almost showtime…",
];

function FrameIcon({ type, size = 28 }) {
  const s = { stroke: C.gold, strokeWidth: 1.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "star") return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" {...s} /></svg>;
  if (type === "film") return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" {...s} /><line x1="7" y1="2" x2="7" y2="22" {...s} /><line x1="17" y1="2" x2="17" y2="22" {...s} /><line x1="2" y1="12" x2="22" y2="12" {...s} /></svg>;
  if (type === "heart") return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" {...s} /></svg>;
  if (type === "popcorn") return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M7 8 L5 21 L19 21 L17 8" {...s} /><circle cx="8" cy="5.5" r="2.5" {...s} /><circle cx="12" cy="4" r="2.8" {...s} /><circle cx="16" cy="5.5" r="2.5" {...s} /></svg>;
  if (type === "drink") return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M8 2 L6 12 L7 21 L17 21 L18 12 L16 2 Z" {...s} /><line x1="6" y1="7" x2="18" y2="7" {...s} /><path d="M18 7 Q22 9 20 12" {...s} /></svg>;
  if (type === "ticket") return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M2 9 L2 5 Q2 3 4 3 L20 3 Q22 3 22 5 L22 9 Q20 9 20 11 Q20 13 22 13 L22 19 Q22 21 20 21 L4 21 Q2 21 2 19 L2 13 Q4 13 4 11 Q4 9 2 9" {...s} /><line x1="10" y1="3" x2="10" y2="21" {...s} strokeDasharray="3 3" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...s} /><circle cx="12" cy="12" r="3" {...s} /></svg>;
}

const frameIcons = ["star", "film", "heart", "popcorn", "drink", "ticket", "reel", "star", "film", "heart"];

function Sparkle({ x, y, delay, size }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`, width: size, height: size, opacity: 0,
      animation: `sparkle ${2 + Math.random() * 2}s ease-in-out infinite`, animationDelay: `${delay}s`,
    }}>
      <svg width={size} height={size} viewBox="0 0 16 16">
        <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill={C.gold} opacity="0.7" />
      </svg>
    </div>
  );
}

function Curtain({ side, isOpen }) {
  const folds = 6;
  return (
    <div style={{
      position: "absolute", top: 0, bottom: 0, [side]: 0, width: "52%", zIndex: 20, overflow: "hidden",
      transform: isOpen ? `translateX(${side === "left" ? "-92%" : "92%"})` : "translateX(0)",
      transition: "transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <svg width="100%" height="100%" viewBox="0 0 200 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`c-${side}`} x1={side === "left" ? "1" : "0"} x2={side === "left" ? "0" : "1"} y1="0" y2="0">
            <stop offset="0%" stopColor={C.curtainDeep} />
            <stop offset="30%" stopColor={C.curtainMid} />
            <stop offset="60%" stopColor={C.curtainLight} />
            <stop offset="80%" stopColor={C.curtainMid} />
            <stop offset="100%" stopColor={C.curtainDeep} />
          </linearGradient>
        </defs>
        <rect width="200" height="400" fill={`url(#c-${side})`} />
        {Array.from({ length: folds }).map((_, i) => (
          <rect key={i} x={(i / folds) * 200} y="0" width={200 / folds / 2} height="400"
            fill="rgba(0,0,0,0.15)" style={{ animation: `curtainWave ${3 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
        ))}
      </svg>
    </div>
  );
}

function ScrollingFilmStrip({ direction = 1, speed = 20, y = "50%" }) {
  const frameW = 44;
  const frameH = 32;
  const stripH = frameH + 16;
  const count = 10;
  const totalW = count * (frameW + 5) + 5;

  return (
    <div style={{
      position: "absolute", top: y, left: 0, right: 0, height: stripH,
      transform: "translateY(-50%)", overflow: "hidden", opacity: 0.1,
    }}>
      <div style={{
        display: "flex", gap: 5, paddingLeft: 5, width: totalW * 2,
        animation: `${direction > 0 ? "scrollRight" : "scrollLeft"} ${speed}s linear infinite`,
      }}>
        {Array.from({ length: count * 2 }).map((_, i) => (
          <div key={i} style={{
            width: frameW, height: stripH, borderRadius: 2, background: C.orange, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          }}>
            <div style={{ position: "absolute", top: 2, left: 3, right: 3, display: "flex", justifyContent: "space-between" }}>
              {[0, 1, 2].map(h => <div key={h} style={{ width: 4, height: 3, borderRadius: 1, background: C.bg }} />)}
            </div>
            <div style={{ position: "absolute", bottom: 2, left: 3, right: 3, display: "flex", justifyContent: "space-between" }}>
              {[0, 1, 2].map(h => <div key={h} style={{ width: 4, height: 3, borderRadius: 1, background: C.bg }} />)}
            </div>
            <div style={{
              width: frameW - 8, height: frameH - 4, borderRadius: 1, background: C.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FrameIcon type={frameIcons[i % frameIcons.length]} size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilmProgressBar({ progress }) {
  const count = 8;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => {
        const filled = (i / count) < progress;
        return (
          <div key={i} style={{
            width: 18, height: 12, borderRadius: 2,
            border: `1px solid ${filled ? C.gold : C.creamDim}44`,
            background: filled ? `${C.gold}18` : "transparent",
            transition: "all 0.4s ease", transitionDelay: `${i * 50}ms`,
            overflow: "hidden", position: "relative",
          }}>
            {filled && <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(135deg, ${C.gold}30, ${C.orange}20)`,
              animation: "frameFillIn 0.3s ease-out",
            }} />}
          </div>
        );
      })}
    </div>
  );
}

function Clapperboard({ snap, scale = 1 }) {
  const w = 72 * scale;
  const h = 60 * scale;
  const armH = 12 * scale;
  return (
    <div style={{ position: "relative", width: w, height: h + armH }}>
      <div style={{
        position: "absolute", top: 0, left: 3 * scale, width: w - 6 * scale, height: armH,
        background: `repeating-linear-gradient(135deg, ${C.cream}, ${C.cream} ${5 * scale}px, ${C.bg} ${5 * scale}px, ${C.bg} ${10 * scale}px)`,
        borderRadius: `${3 * scale}px ${3 * scale}px 0 0`, transformOrigin: "left bottom",
        transform: snap ? "rotate(0deg)" : "rotate(-30deg)",
        transition: "transform 0.15s cubic-bezier(0.4, 0, 1, 1)",
        zIndex: 2, border: `${1.5 * scale}px solid ${C.creamDim}44`,
      }} />
      <div style={{
        position: "absolute", top: armH - 1, left: 0, width: w, height: h,
        background: C.card, borderRadius: `0 0 ${5 * scale}px ${5 * scale}px`,
        border: `${1.5 * scale}px solid ${C.creamDim}33`,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 2 * scale,
      }}>
        <div style={{ width: "80%", height: 1, background: `${C.creamDim}33` }} />
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 6 * scale,
          color: C.creamDim, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>Tonight's Pick</div>
        <div style={{ width: "80%", height: 1, background: `${C.creamDim}33` }} />
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 8 * scale,
          color: C.gold, fontWeight: 600,
        }}>TAKE 1</div>
      </div>
    </div>
  );
}

// ── The loading component itself ──
function TonightsPickLoadingInner() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [clapSnap, setClapSnap] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setClapSnap(true), 600);
    const t2 = setTimeout(() => setClapSnap(false), 750);
    const t3 = setTimeout(() => setClapSnap(true), 900);
    const t4 = setTimeout(() => setCurtainsOpen(true), 1400);
    const t5 = setTimeout(() => setShowContent(true), 2200);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!showContent) return;
    const iv = setInterval(() => setPhraseIdx(p => (p + 1) % phrases.length), 2200);
    return () => clearInterval(iv);
  }, [showContent]);

  useEffect(() => {
    if (!showContent) return;
    const iv = setInterval(() => {
      setProgress(p => p >= 1 ? 1 : p + (1 - p) * (0.02 + Math.random() * 0.06));
    }, 300);
    return () => clearInterval(iv);
  }, [showContent]);

  const sparkles = useRef(
    Array.from({ length: 12 }).map(() => ({
      x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
      delay: Math.random() * 4, size: 8 + Math.random() * 8,
    }))
  ).current;

  return (
    <div style={{
      width: "100%", height: "100%", minHeight: 420, position: "relative",
      overflow: "hidden", background: C.bg, fontFamily: "'DM Sans', sans-serif",
    }}>
      <Curtain side="left" isOpen={curtainsOpen} />
      <Curtain side="right" isOpen={curtainsOpen} />

      {/* Pelmet */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 14, zIndex: 25,
        background: `linear-gradient(180deg, ${C.curtainDeep}, ${C.curtainMid})`,
        borderBottom: `2px solid ${C.curtainDeep}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}>
        <svg width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -8, left: 0 }}>
          <path d={Array.from({ length: 20 }).map((_, i) =>
            `${i === 0 ? "M" : "L"} ${i * 20} 0 Q ${i * 20 + 10} 8 ${(i + 1) * 20} 0`
          ).join(" ")} fill={C.curtainMid} />
        </svg>
      </div>

      {/* Screen area */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", width: "90%", height: "55%",
          background: "conic-gradient(from 170deg at 50% -10%, transparent 38%, rgba(212,160,80,0.03) 46%, rgba(212,160,80,0.06) 50%, rgba(212,160,80,0.03) 54%, transparent 62%)",
          animation: "beamSweep 5s ease-in-out infinite", transform: "translateX(-50%)", pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: "projectorFlicker 2s steps(8) infinite",
        }} />

        <ScrollingFilmStrip direction={1} speed={22} y="25%" />
        <ScrollingFilmStrip direction={-1} speed={28} y="75%" />

        {showContent && sparkles.map((s, i) => (
          <Sparkle key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
        ))}

        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.6) 100%)",
        }} />

        {/* Center content */}
        <div style={{
          position: "relative", zIndex: 15, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 22, padding: "32px 20px",
          opacity: showContent ? 1 : 0, transform: showContent ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <div style={{ animation: showContent ? "floatUp 4s ease-in-out infinite" : "none" }}>
            <Clapperboard snap={clapSnap} scale={0.9} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{
              margin: 0, fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 700, color: C.cream, letterSpacing: "0.01em",
            }}>Tonight's Pick</h2>
            <div style={{
              margin: "8px auto 0", width: 40, height: 2, borderRadius: 1,
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
              animation: "gentlePulse 2.5s ease-in-out infinite",
            }} />
          </div>

          <div style={{ height: 20, display: "flex", alignItems: "center" }}>
            <p key={phraseIdx} style={{
              margin: 0, fontSize: 13, color: C.creamMid,
              animation: "phraseSwap 0.35s ease-out", letterSpacing: "0.02em", fontStyle: "italic",
            }}>{phrases[phraseIdx]}</p>
          </div>

          <FilmProgressBar progress={progress} />

          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: "50%", background: C.gold,
                animation: "dotBounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Pre-curtain overlay */}
      {!curtainsOpen && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 15, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(12,9,8,0.7)", pointerEvents: "none",
        }}>
          <div style={{
            animation: "slideUp 0.5s ease-out",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <Clapperboard snap={clapSnap} scale={0.85} />
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 15,
              color: C.cream, opacity: 0.7, letterSpacing: "0.05em",
            }}>Showtime</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Preview wrapper: Desktop + Mobile side by side ──
export default function TonightsPickLoadingPreview() {
  const [key, setKey] = useState(0);

  return (
    <div style={{
      minHeight: "100vh", background: "#080706", padding: "40px 24px",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1) rotate(180deg); }
        }
        @keyframes scrollRight { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes scrollLeft { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes curtainWave { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.08; } }
        @keyframes phraseSwap { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gentlePulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes floatUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes frameFillIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes projectorFlicker { 0%,100%{opacity:.03} 10%{opacity:.05} 20%{opacity:.02} 30%{opacity:.06} 50%{opacity:.03} 70%{opacity:.04} 90%{opacity:.02} }
        @keyframes beamSweep { 0%,100%{opacity:.4;transform:translateX(-50%) scaleX(1)} 50%{opacity:.7;transform:translateX(-50%) scaleX(1.05)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-6px);opacity:1} }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700,
          color: "#e8dcc6", margin: "0 0 8px",
        }}>Loading State Preview</h1>
        <p style={{ fontSize: 14, color: "#8a7e6e", margin: "0 0 16px" }}>
          Desktop and mobile rendering side by side
        </p>
        <button
          onClick={() => setKey(k => k + 1)}
          style={{
            background: "none", border: `1px solid #d4a05044`, color: "#d4a050",
            padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.target.style.background = "#d4a05015"; e.target.style.borderColor = "#d4a05088"; }}
          onMouseLeave={e => { e.target.style.background = "none"; e.target.style.borderColor = "#d4a05044"; }}
        >
          Replay Animation
        </button>
      </div>

      {/* Side by side */}
      <div key={key} style={{
        display: "flex", gap: 40, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {/* Desktop */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: "#8a7e6e", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Desktop — 600px wide</span>
          <div style={{
            width: 600, borderRadius: 16, overflow: "hidden",
            border: "1px solid #2a252022",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}>
            <TonightsPickLoadingInner />
          </div>
        </div>

        {/* Mobile */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: "#8a7e6e", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Mobile — 375px wide</span>
          {/* Phone frame */}
          <div style={{
            width: 375, background: "#1a1a1a", borderRadius: 40, padding: "12px 8px",
            border: "3px solid #333", position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 1px #444",
          }}>
            {/* Notch */}
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              width: 120, height: 28, background: "#1a1a1a", borderRadius: 14, zIndex: 30,
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#333", border: "1px solid #444" }} />
            </div>

            {/* Screen */}
            <div style={{
              borderRadius: 32, overflow: "hidden",
              background: C.bg,
            }}>
              {/* Status bar area */}
              <div style={{ height: 44, background: C.bg }} />
              <TonightsPickLoadingInner />
              {/* Home indicator */}
              <div style={{
                height: 34, background: C.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 120, height: 4, borderRadius: 2, background: "#333",
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
