import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#0f0d0b",
  bgCard: "#1a1714",
  bgCardHover: "#211e19",
  bgElevated: "#252119",
  blue: "#3d5a96",
  blueMuted: "#2e4470",
  blueGlow: "rgba(61,90,150,0.18)",
  blueLight: "#5a7cb8",
  orange: "#ff6b2d",
  orangeMuted: "#cc5624",
  orangeGlow: "rgba(255,107,45,0.14)",
  orangeLight: "#ff8f5e",
  cream: "#e8e2d6",
  creamMuted: "#a69e90",
  creamFaint: "#6b6358",
  creamSoft: "#8a8279",   // ← new lighter "faint" for readable secondary text
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
  green: "#4ade80",
  yellow: "#facc15",
  red: "#ef4444",
  purple: "#a78bfa",
};

const FONT = {
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
};

const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

const ANIM_CSS = `
  @keyframes popIn {
    0% { transform: scale(0.92); opacity: 0.6; }
    50% { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes glowPulse {
    0% { box-shadow: 0 0 0 0 rgba(61,90,150,0.3); }
    70% { box-shadow: 0 0 0 8px rgba(61,90,150,0); }
    100% { box-shadow: 0 0 0 0 rgba(61,90,150,0); }
  }
  @keyframes moodPop {
    0% { transform: scale(0.93); }
    40% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  @keyframes checkBounce {
    0% { transform: scale(0); }
    60% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes slideUp {
    0% { transform: translateY(6px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  .pill-active { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .mood-active { animation: moodPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .check-badge { animation: checkBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .glow-pulse { animation: glowPulse 0.6s ease-out; }
`;

const Icon = ({ name, size = 18, color = C.creamMuted }) => {
  const paths = {
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    check: <path d="M20 6L9 17l-5-5" />,
    chevron: <path d="M9 18l6-6-6-6" />,
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    sparkle: <><path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" /></>,
    refresh: <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    coffee: <><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
    award: <><circle cx="12" cy="8" r="7" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" /></>,
    film: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20M2 16h20M8 4v16M16 4v16" /></>,
    link: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    play: <path d="M5 3l14 9-14 9V3z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const LightLeak = ({ color, style }) => (
  <div style={{
    position: "absolute", width: 240, height: 240, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    filter: "blur(65px)", pointerEvents: "none", ...style,
  }} />
);

// Sticky bottom bar wrapper used by all steps
const StickyBottom = ({ children }) => (
  <div style={{
    position: "sticky", bottom: 0, zIndex: 100, flexShrink: 0,
    padding: "16px 24px 24px",
    background: `linear-gradient(to top, ${C.bg} 60%, ${C.bg}ee 80%, transparent)`,
    backdropFilter: "blur(10px)",
  }}>
    {children}
  </div>
);

// ═══════════════════════════════════
// PROGRESS STEPPER
// ═══════════════════════════════════
const Stepper = ({ step }) => {
  const steps = [
    { num: 1, label: "Who" },
    { num: 2, label: "Mood" },
    { num: 3, label: "Results" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
      padding: "0 24px",
    }}>
      {steps.map((s, i) => {
        const isActive = s.num === step;
        const isComplete = s.num < step;
        const isLast = i === steps.length - 1;
        return (
          <div key={s.num} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: isComplete
                  ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                  : isActive
                    ? `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`
                    : `${C.creamSoft}15`,
                border: isActive ? `1px solid ${C.blue}40` : isComplete ? "none" : `1px solid ${C.creamSoft}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: FONT.heading,
                color: isComplete || isActive ? C.warmBlack : C.creamSoft,
                transition: "all 0.35s ease",
              }}>
                {isComplete ? (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.warmBlack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : s.num}
              </div>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? C.cream : isComplete ? C.creamMuted : C.creamSoft,
                letterSpacing: "-0.01em",
              }}>{s.label}</span>
            </div>
            {!isLast && (
              <div style={{
                width: 32, height: 1, margin: "0 10px",
                background: isComplete
                  ? `linear-gradient(to right, ${C.orange}50, ${C.orange}20)`
                  : `${C.creamSoft}18`,
                transition: "all 0.35s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════
// STEP 1: WHO
// ═══════════════════════════════════
const StepWho = ({ onNext }) => {
  const [selected, setSelected] = useState(["Mike Gunko"]);
  const [lastToggled, setLastToggled] = useState(null);

  const members = [
    { name: "Emilia Gunko", initial: "E", color: C.orange },
    { name: "Mike Gunko", initial: "M", color: C.blue },
  ];

  const toggle = (name) => {
    setLastToggled(name);
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    if (selected.length === members.length) setSelected([]);
    else setSelected(members.map(m => m.name));
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: FONT.heading, fontSize: 18, fontWeight: 600,
            color: C.cream, letterSpacing: "-0.02em",
          }}>Who's watching tonight?</div>
          <div onClick={selectAll} style={{
            fontSize: 13, color: C.blue, cursor: "pointer", fontWeight: 500,
          }}>{selected.length === members.length ? "Deselect All" : "Select All"}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m, i) => {
            const isSelected = selected.includes(m.name);
            return (
              <div key={i} onClick={() => toggle(m.name)}
                className={isSelected && lastToggled === m.name ? "glow-pulse" : ""}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", borderRadius: 14,
                  background: isSelected
                    ? `linear-gradient(135deg, ${m.color}12, ${C.bgCard})`
                    : C.bgCard,
                  border: `1px solid ${isSelected ? m.color + "30" : C.creamSoft + "12"}`,
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  transform: isSelected && lastToggled === m.name ? "scale(1)" : "scale(1)",
                }}>
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    borderRadius: "14px 14px 0 0",
                    background: `linear-gradient(to right, ${m.color}40, transparent)`,
                  }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${m.color}, ${m.color}70)`,
                  boxShadow: isSelected ? `0 3px 14px ${m.color}25` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
                  flexShrink: 0, position: "relative",
                  transition: "box-shadow 0.35s ease",
                }}>
                  {m.initial}
                  {isSelected && (
                    <div className="check-badge" style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 18, height: 18, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
                      border: `2px solid ${C.bg}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={C.warmBlack} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: C.cream }}>{m.name}</div>
                  {isSelected && (
                    <div style={{ fontSize: 12, color: C.orange, marginTop: 2, fontWeight: 500 }}>Selected</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          textAlign: "center", marginTop: 16,
          fontSize: 13, color: C.creamSoft,
        }}>
          {selected.length} of {members.length} selected
        </div>
      </div>

      <StickyBottom>
        <div onClick={selected.length > 0 ? onNext : undefined} style={{
          padding: "16px 32px", borderRadius: 14,
          background: selected.length === 0
            ? `${C.creamSoft}15`
            : `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
          boxShadow: selected.length === 0 ? "none" : `0 4px 20px ${C.orange}30`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: selected.length === 0 ? "default" : "pointer",
          opacity: selected.length === 0 ? 0.5 : 1,
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <span style={{
            fontSize: 15, fontWeight: 600, fontFamily: FONT.heading,
            color: selected.length === 0 ? C.creamSoft : C.warmBlack,
          }}>Continue</span>
          <Icon name="chevron" size={18} color={selected.length === 0 ? C.creamSoft : C.warmBlack} />
        </div>
      </StickyBottom>
    </>
  );
};

// ═══════════════════════════════════
// STEP 2: MOOD
// ═══════════════════════════════════
const StepMood = ({ onNext, onBack }) => {
  const [selectedMood, setSelectedMood] = useState("Any Mood");
  const [runtime, setRuntime] = useState("Any");
  const [contentRating, setContentRating] = useState("Any");
  const [era, setEra] = useState("Any");
  const [releasedAfter, setReleasedAfter] = useState("Any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Track which items just animated
  const [animKey, setAnimKey] = useState(0);

  const moods = [
    { name: "Any Mood", sub: "Show me everything", icon: "sparkle", color: C.orange },
    { name: "Fun", sub: "Light & entertaining", icon: "coffee", color: C.teal },
    { name: "Intense", sub: "Edge of your seat", icon: "zap", color: C.rose },
    { name: "Emotional", sub: "Feel all the feels", icon: "heart", color: C.blue },
    { name: "Mindless", sub: "Turn brain off", icon: "coffee", color: C.purple },
    { name: "Acclaimed", sub: "Critics' favorites", icon: "award", color: C.orange },
  ];

  const selectMood = (name) => {
    setSelectedMood(name);
    setAnimKey(k => k + 1);
  };

  const PillGroup = ({ options, selected, onSelect, color = C.blue }) => {
    const [justSelected, setJustSelected] = useState(null);
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(opt => {
          const isActive = selected === opt;
          const justPopped = justSelected === opt;
          return (
            <div key={opt}
              className={justPopped ? "pill-active" : ""}
              onClick={() => {
                setJustSelected(opt);
                onSelect(opt);
                setTimeout(() => setJustSelected(null), 350);
              }}
              style={{
                padding: "8px 16px", borderRadius: 20,
                background: isActive ? `${color}18` : "transparent",
                border: `1.5px solid ${isActive ? color + "50" : C.creamSoft + "20"}`,
                color: isActive ? (color === C.blue ? C.blueLight : color) : C.creamSoft,
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: isActive ? `0 0 12px ${color}15` : "none",
              }}>{opt}</div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px" }}>
        <div style={{
          fontFamily: FONT.heading, fontSize: 18, fontWeight: 600,
          color: C.cream, letterSpacing: "-0.02em", marginBottom: 16,
        }}>What are you in the mood for?</div>

        {/* Mood grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          marginBottom: 28,
        }}>
          {moods.map((mood, i) => {
            const isActive = selectedMood === mood.name;
            return (
              <div key={i}
                className={isActive ? "mood-active" : ""}
                onClick={() => selectMood(mood.name)}
                style={{
                  padding: "20px 16px", borderRadius: 14,
                  background: isActive
                    ? `linear-gradient(155deg, ${mood.color}14, ${C.bgCard})`
                    : C.bgCard,
                  border: `1.5px solid ${isActive ? mood.color + "40" : C.creamSoft + "0c"}`,
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative", textAlign: "center",
                  boxShadow: isActive ? `0 4px 24px ${mood.color}12` : "none",
                }}>
                {isActive && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    borderRadius: "14px 14px 0 0",
                    background: `linear-gradient(to right, ${mood.color}60, ${mood.color}10, transparent)`,
                  }} />
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: isActive ? `${mood.color}22` : `${C.creamSoft}12`,
                  border: `1px solid ${isActive ? mood.color + "30" : C.creamSoft + "12"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 10px",
                  transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: isActive ? "scale(1.08)" : "scale(1)",
                }}>
                  <Icon name={mood.icon} size={16} color={isActive ? mood.color : C.creamSoft} />
                </div>
                <div style={{
                  fontSize: 14, fontWeight: isActive ? 600 : 500, color: C.cream,
                  marginBottom: 3,
                }}>{mood.name}</div>
                <div style={{
                  fontSize: 11.5, color: C.creamMuted, lineHeight: 1.5,
                }}>{mood.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── Filter Sections ── */}

        {/* Runtime */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: C.bgCard, border: `1px solid ${C.creamSoft}0c`,
          marginBottom: 14, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(to right, ${C.blue}30, transparent)`,
          }} />
          <div style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.blueLight, fontWeight: 600, marginBottom: 12,
          }}>Maximum Runtime</div>
          <PillGroup options={["Any", "90m", "120m", "150m"]} selected={runtime} onSelect={setRuntime} />
        </div>

        {/* Content Rating */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: C.bgCard, border: `1px solid ${C.creamSoft}0c`,
          marginBottom: 14, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(to right, ${C.blue}25, ${C.teal}10, transparent)`,
          }} />
          <div style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.blueLight, fontWeight: 600, marginBottom: 12,
          }}>Content Rating</div>
          <PillGroup options={["Any", "G", "PG", "PG-13", "R"]} selected={contentRating} onSelect={setContentRating} />
          <div style={{
            fontSize: 11, color: C.creamSoft, marginTop: 10, lineHeight: 1.5,
          }}>Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)</div>
        </div>

        {/* Era + Released After */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: C.bgCard, border: `1px solid ${C.creamSoft}0c`,
          marginBottom: 14, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(to right, ${C.teal}25, transparent)`,
          }} />
          <div style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.teal, fontWeight: 600, marginBottom: 12,
          }}>Era</div>
          <PillGroup options={["Any", "60s", "70s", "80s", "90s", "00s", "10s", "20s"]} selected={era} onSelect={setEra} color={C.teal} />

          <div style={{
            height: 1, margin: "18px 0",
            background: `linear-gradient(to right, ${C.creamSoft}0c, transparent)`,
          }} />

          <div style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.teal, fontWeight: 600, marginBottom: 12,
          }}>Released After</div>
          <PillGroup options={["Any", "1970+", "1980+", "1990+", "2000+", "2010+", "2020+", "2024+"]} selected={releasedAfter} onSelect={setReleasedAfter} color={C.teal} />
        </div>

        {/* Streaming Services */}
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          background: C.bgCard, border: `1px solid ${C.creamSoft}0c`,
          marginBottom: 14, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(to right, ${C.blueMuted}30, transparent)`,
          }} />
          <div style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: C.blueLight, fontWeight: 600, marginBottom: 12,
          }}>Streaming Services</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Netflix", "Disney+", "Max", "Prime", "Apple TV+", "Hulu", "Peacock", "Paramount+", "Crunchyroll"].map(svc => (
              <div key={svc} style={{
                padding: "8px 14px", borderRadius: 20,
                background: "transparent",
                border: `1px solid ${C.creamSoft}20`,
                color: C.creamSoft, fontSize: 12, fontWeight: 400,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.25s ease",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: `${C.blue}15`,
                }} />
                {svc}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.creamSoft, marginTop: 10 }}>
            Streaming data by <span style={{ color: C.orange, fontWeight: 500 }}>JustWatch</span>
          </div>
        </div>

        {/* Content Filters */}
        <div style={{
          borderRadius: 14, background: C.bgCard,
          border: `1px solid ${C.creamSoft}0c`,
          marginBottom: 16, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            borderRadius: "14px 14px 0 0",
            background: `linear-gradient(to right, ${C.blue}25, ${C.rose}10, transparent)`,
          }} />
          <div onClick={() => setFiltersOpen(!filtersOpen)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px", cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="shield" size={16} color={C.blueLight} />
              <span style={{ fontSize: 15, fontWeight: 600, color: C.cream }}>Content Filters</span>
            </div>
            <div style={{
              transform: filtersOpen ? "rotate(90deg)" : "rotate(0)",
              transition: "transform 0.25s ease",
            }}>
              <Icon name="chevron" size={16} color={C.creamSoft} />
            </div>
          </div>

          {filtersOpen && (
            <div style={{ padding: "0 18px 18px" }}>
              <div style={{
                fontSize: 12, color: C.creamMuted, lineHeight: 1.5, marginBottom: 14,
              }}>Set maximum levels for each category. Movies exceeding these levels will be filtered out.</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <div style={{
                  padding: "6px 14px", borderRadius: 16,
                  border: `1px solid ${C.creamSoft}20`,
                  fontSize: 12, color: C.creamSoft, cursor: "pointer",
                }}>Clear All</div>
                <div style={{
                  padding: "6px 14px", borderRadius: 16,
                  background: `${C.green}15`, border: `1px solid ${C.green}30`,
                  fontSize: 12, color: C.green, cursor: "pointer",
                }}>Kid-Friendly</div>
                <div style={{
                  padding: "6px 14px", borderRadius: 16,
                  background: `${C.blue}15`, border: `1px solid ${C.blue}30`,
                  fontSize: 12, color: C.blueLight, cursor: "pointer",
                }}>Family Night</div>
              </div>

              {[
                { name: "Violence", color: C.red },
                { name: "Sex/Nudity", color: C.rose },
                { name: "Language", color: C.yellow },
                { name: "Substances", color: C.purple },
                { name: "Frightening Scenes", color: C.orange },
              ].map((cat, ci) => {
                const FilterRow = () => {
                  const [activeLevel, setActiveLevel] = useState("Any");
                  const [justClicked, setJustClicked] = useState(null);
                  return (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{
                        fontSize: 12.5, fontWeight: 500, color: C.cream,
                        marginBottom: 8, letterSpacing: "0.01em",
                      }}>{cat.name}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["Any", "None", "Mild", "Mod", "Severe"].map(level => {
                          const isActive = activeLevel === level;
                          const justPopped = justClicked === level;
                          return (
                            <div key={level}
                              className={justPopped ? "pill-active" : ""}
                              onClick={() => {
                                setActiveLevel(level);
                                setJustClicked(level);
                                setTimeout(() => setJustClicked(null), 350);
                              }}
                              style={{
                                padding: "7px 0", borderRadius: 16, flex: 1,
                                textAlign: "center",
                                background: isActive ? `${cat.color}18` : "transparent",
                                border: `1.5px solid ${isActive ? cat.color + "45" : C.creamSoft + "20"}`,
                                fontSize: 11.5, fontWeight: isActive ? 500 : 400,
                                color: isActive ? cat.color : C.creamSoft,
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                boxShadow: isActive ? `0 0 10px ${cat.color}12` : "none",
                              }}>{level}</div>
                          );
                        })}
                      </div>
                    </div>
                  );
                };
                return <FilterRow key={ci} />;
              })}

              <div style={{
                fontSize: 11, color: C.creamSoft, lineHeight: 1.5, marginTop: 4,
              }}>Note: Movies without parental guide data in our database will still be shown.</div>
            </div>
          )}
        </div>

        <div style={{ height: 16 }} />
      </div>

      <StickyBottom>
        <div onClick={onNext} style={{
          padding: "16px 32px", borderRadius: 14,
          background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
          boxShadow: `0 4px 20px ${C.orange}30`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer",
        }}>
          <Icon name="sparkle" size={18} color={C.warmBlack} />
          <span style={{
            fontSize: 15, fontWeight: 600, fontFamily: FONT.heading,
            color: C.warmBlack, letterSpacing: "-0.01em",
          }}>Get Recommendations</span>
        </div>
        <div onClick={onBack} style={{
          textAlign: "center", marginTop: 10,
          fontSize: 13, color: C.creamSoft, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Icon name="back" size={14} color={C.creamSoft} />
          Back
        </div>
      </StickyBottom>
    </>
  );
};

// ═══════════════════════════════════
// RESULT CARD (with collapsible parental guide)
// ═══════════════════════════════════
const ResultCard = ({ film }) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div style={{
      borderRadius: 16, background: C.bgCard,
      border: `1px solid ${C.creamSoft}0c`,
      marginBottom: 16, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(to right, ${film.color}50, ${film.color}10, transparent)`,
      }} />

      {/* Film header */}
      <div style={{
        display: "flex", gap: 14, padding: "18px 18px 14px", alignItems: "flex-start",
      }}>
        <div style={{
          width: 70, height: 100, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(155deg, ${film.color}12, ${C.bgElevated})`,
          border: `1px solid ${C.creamSoft}0c`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="film" size={20} color={C.creamSoft + "60"} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONT.heading, fontSize: 18, fontWeight: 700,
            color: C.cream, letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>{film.title}</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 6,
          }}>
            <span style={{ fontSize: 13, color: C.creamMuted }}>{film.year}</span>
            <span style={{ color: C.creamSoft + "40" }}>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill={C.orange} stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>{film.rating}</span>
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: "50%",
            border: `2px solid ${film.ratingColor}50`,
            background: `${film.ratingColor}10`,
            fontSize: 11, fontWeight: 700, color: film.ratingColor,
            marginTop: 8,
          }}>71</div>
        </div>
      </div>

      {/* Why we picked this */}
      <div style={{ padding: "0 18px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
        }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span style={{
            fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
            color: C.orange, fontWeight: 600,
          }}>Why We Picked This</span>
        </div>
        <div style={{
          fontSize: 13.5, color: C.creamMuted, lineHeight: 1.65,
        }}>{film.reason}</div>
      </div>

      {/* Parental guide — collapsed toggle */}
      {film.parentalWarnings && (
        <div style={{ padding: "0 18px 14px" }}>
          <div
            onClick={() => setShowGuide(!showGuide)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10,
              background: showGuide ? `${C.red}0a` : "transparent",
              border: `1px solid ${showGuide ? C.red + "20" : C.creamSoft + "18"}`,
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}>
            <Icon name="shield" size={12} color={showGuide ? C.red : C.creamSoft} />
            <span style={{
              fontSize: 11.5, fontWeight: 500,
              color: showGuide ? C.red : C.creamSoft,
              transition: "color 0.25s ease",
            }}>Parental Guide</span>
            <div style={{
              transform: showGuide ? "rotate(90deg)" : "rotate(0)",
              transition: "transform 0.25s ease",
              display: "flex",
            }}>
              <Icon name="chevron" size={12} color={showGuide ? C.red : C.creamSoft} />
            </div>
          </div>

          {/* Expandable content */}
          <div style={{
            maxHeight: showGuide ? 120 : 0,
            opacity: showGuide ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              paddingTop: 12, paddingBottom: 8,
            }}>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 10,
                background: `${C.red}12`, border: `1px solid ${C.red}25`,
                color: C.red, fontWeight: 500,
              }}>Up to Severe</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {film.parentalWarnings.map((w, wi) => (
                <span key={wi} style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 10,
                  border: `1px solid ${C.red}25`, color: C.red,
                }}>{w}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Details */}
      <div style={{
        padding: "0 18px 16px", display: "flex", justifyContent: "flex-end",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 10,
          border: `1px solid ${C.creamSoft}20`,
          fontSize: 12, color: C.cream, fontWeight: 500, cursor: "pointer",
        }}>
          <Icon name="link" size={13} color={C.cream} />
          View Details
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// STEP 3: RESULTS
// ═══════════════════════════════════
const StepResults = ({ onBack }) => {
  const results = [
    {
      title: "Sicario", year: "2015", rating: "7.6",
      ratingColor: C.teal, color: C.teal,
      reason: "The deep-cover undercover narrative mirrors the immersive world-building you loved in Dune and Inception—infiltrating a criminal underworld with the same sense of navigating a hostile, intricate system where one wrong move costs everything.",
    },
    {
      title: "Lone Survivor", year: "2013", rating: "7.4",
      ratingColor: C.orange, color: C.orange,
      reason: "The impossible moral choice in the Afghan mountains delivers the survival-under-impossible-odds intensity of 1917 and Alien combined—four soldiers facing an enemy ambush that forces decisions that haunt far longer than the bullets fly.",
      parentalWarnings: ["Violence: Severe", "Language: Severe", "Intense: Severe"],
    },
  ];

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px" }}>
        <div style={{
          fontFamily: FONT.heading, fontSize: 18, fontWeight: 600,
          color: C.cream, letterSpacing: "-0.02em", marginBottom: 6,
        }}>Your Picks for Tonight</div>
        <div style={{
          fontSize: 13, color: C.creamMuted, marginBottom: 20, lineHeight: 1.5,
        }}>Based on your collective's taste and mood</div>

        {results.map((film, i) => (
          <ResultCard key={i} film={film} />
        ))}

        <div style={{ height: 16 }} />
      </div>

      <StickyBottom>
        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={onBack} style={{
            flex: 1, padding: "16px", borderRadius: 14,
            background: C.bgCard, border: `1px solid ${C.creamSoft}18`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 14, fontWeight: 500, color: C.cream, cursor: "pointer",
          }}>
            <Icon name="back" size={16} color={C.cream} />
            Back
          </div>
          <div style={{
            flex: 1.4, padding: "16px", borderRadius: 14,
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
            boxShadow: `0 4px 20px ${C.orange}30`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 14, fontWeight: 600, fontFamily: FONT.heading,
            color: C.warmBlack, cursor: "pointer",
          }}>
            <Icon name="refresh" size={16} color={C.warmBlack} />
            Shuffle
          </div>
        </div>
      </StickyBottom>
    </>
  );
};

// ═══════════════════════════════════
// MAIN
// ═══════════════════════════════════
export default function TonightsPick() {
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.warmBlack}; }
        ::-webkit-scrollbar { display: none; }
        ${ANIM_CSS}
      `}</style>

      <div style={{
        background: C.bg, color: C.cream, fontFamily: FONT.body,
        position: "relative", maxWidth: 430, margin: "0 auto",
        height: "100vh", display: "flex", flexDirection: "column",
        overflowX: "hidden",
        opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        {/* Grain */}
        <div style={{
          position: "fixed", inset: 0, backgroundImage: grainSVG, backgroundRepeat: "repeat",
          pointerEvents: "none", zIndex: 9998, opacity: 0.4, mixBlendMode: "overlay",
        }} />

        <LightLeak color={C.blueGlow} style={{ top: -80, left: -90 }} />
        <LightLeak color={C.orangeGlow} style={{ bottom: -60, right: -80, opacity: 0.4 }} />

        {/* Top Nav */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center",
          padding: "14px 24px 10px", gap: 12,
        }}>
          <div
            onClick={() => step > 1 ? setStep(step - 1) : null}
            style={{ cursor: "pointer", padding: 4 }}>
            <Icon name="back" size={18} color={C.creamMuted} />
          </div>
          <span style={{ fontSize: 13, color: C.creamMuted }}>
            {step === 1 ? "Back to Feed" : step === 2 ? "Back to Who" : "Back to Mood"}
          </span>
        </div>

        {/* Stepper */}
        <div style={{ flexShrink: 0, padding: "8px 0 24px" }}>
          <Stepper step={step} />
        </div>

        {/* Step Content */}
        {step === 1 && <StepWho onNext={() => setStep(2)} />}
        {step === 2 && <StepMood onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepResults onBack={() => setStep(2)} />}
      </div>
    </>
  );
}
