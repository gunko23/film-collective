import { useState, useEffect } from "react";

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
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
};

const FONT = {
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
};

const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

// ── Icons ──
const Icon = ({ name, size = 18, color = C.creamMuted }) => {
  const paths = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />,
    discover: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
    collectives: <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" /><path d="M17 14c2.5 0 4.5 1.8 4.5 4.5" /></>,
    films: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20M2 16h20M8 4v16M16 4v16" /></>,
    about: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.55.68.94 1.27 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    chevron: <path d="M9 18l6-6-6-6" />,
    play: <path d="M6 3l15 9-15 9V3z" />,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const Stars = ({ rating, size = 13 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        fill={i <= rating ? C.orange : "none"}
        stroke={i <= rating ? C.orange : C.creamFaint + "35"} strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const LightLeak = ({ color, style }) => (
  <div style={{
    position: "fixed", width: 350, height: 350, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    filter: "blur(80px)", pointerEvents: "none", ...style,
  }} />
);

const CollectiveBadge = ({ colors, initials, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT.heading, fontWeight: 700, fontSize: size * 0.34,
    color: C.bg, letterSpacing: "-0.02em",
    boxShadow: `0 2px 10px ${colors[0]}28`,
    flexShrink: 0,
  }}>
    {initials}
  </div>
);

// ═══════════════════════════════════════
// MAIN DESKTOP LAYOUT
// ═══════════════════════════════════════
export default function DesktopDashboard() {
  const [loaded, setLoaded] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [hoveredNav, setHoveredNav] = useState(null);
  const [hoveredCollective, setHoveredCollective] = useState(null);
  const [tonightsPickHover, setTonightsPickHover] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  const s = (i) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(10px)",
    transition: `all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s`,
  });

  const collectives = [
    { name: "Misha + Milya", members: 2, colors: [C.orange, C.orangeLight], initials: "MM" },
    { name: "Tiger Pride", members: 6, colors: [C.blue, C.blueLight], initials: "TP" },
    { name: "Family Bros", members: 3, colors: [C.teal, "#6bc4b4"], initials: "FB" },
    { name: "Gunko Bros", members: 6, colors: [C.rose, "#d88088"], initials: "GB" },
  ];

  const activity = [
    { name: "Emilia Gunko", initial: "E", film: "Marty Supreme", rating: 4, collective: "Misha + Milya", time: "1 day ago", color: C.orange },
    { name: "Dan Gunko", initial: "D", film: "Spider-Man: Across the Spider-Verse", rating: 5, collective: "Tiger Pride", time: "2 days ago", color: C.rose },
    { name: "Dan Gunko", initial: "D", film: "Spider-Man: Across the Spider-Verse", rating: 5, collective: "Gunko Bros", time: "2 days ago", color: C.rose },
    { name: "Dan Gunko", initial: "D", film: "The Musical", rating: 3, collective: "Gunko Bros", time: "5 days ago", color: C.teal },
  ];

  const topFilms = [
    { title: "The Godfather", year: "1972", color: C.orange },
    { title: "There Will Be Blood", year: "2007", color: C.blue },
    { title: "The Dark Knight", year: "2008", color: C.teal },
  ];

  const navItems = [
    { label: "Dashboard", icon: "home" },
    { label: "Discover", icon: "discover" },
    { label: "Collectives", icon: "collectives" },
    { label: "My Films", icon: "films" },
    { label: "About", icon: "about" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.warmBlack}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.creamFaint}20; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.creamFaint}35; }
      `}</style>

      <div style={{
        background: C.bg, color: C.cream, minHeight: "100vh",
        fontFamily: FONT.body, position: "relative",
      }}>
        {/* Grain */}
        <div style={{
          position: "fixed", inset: 0, backgroundImage: grainSVG, backgroundRepeat: "repeat",
          pointerEvents: "none", zIndex: 9998, opacity: 0.35, mixBlendMode: "overlay",
        }} />

        {/* Ambient light */}
        <LightLeak color={C.orangeGlow} style={{ top: -100, right: 200 }} />
        <LightLeak color={C.blueGlow} style={{ top: 400, left: -100 }} />
        <LightLeak color="rgba(74,158,142,0.08)" style={{ bottom: -100, right: -50 }} />

        {/* ════════════════════════════════ */}
        {/* TOP NAV BAR */}
        {/* ════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          height: 64,
          background: `${C.bg}e8`,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.creamFaint}0c`,
          display: "flex", alignItems: "center",
          padding: "0 32px",
          ...s(0),
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 48 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.orange}25, ${C.blue}20)`,
              border: `1px solid ${C.orange}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="films" size={16} color={C.orange} />
            </div>
            <div>
              <div style={{
                fontFamily: FONT.heading, fontSize: 15, fontWeight: 700,
                color: C.cream, letterSpacing: "-0.02em", lineHeight: 1.2,
              }}>Film Collective</div>
              <div style={{
                fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                color: C.orange, fontWeight: 600,
              }}>Beta</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map((item) => {
              const active = activeNav === item.label;
              const hovered = hoveredNav === item.label;
              return (
                <div key={item.label}
                  onClick={() => setActiveNav(item.label)}
                  onMouseEnter={() => setHoveredNav(item.label)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                    fontSize: 13.5, fontWeight: active ? 500 : 400,
                    color: active ? C.cream : hovered ? C.creamMuted : C.creamFaint,
                    background: active ? `${C.cream}08` : hovered ? `${C.cream}04` : "transparent",
                    transition: "all 0.25s ease",
                    display: "flex", alignItems: "center", gap: 7,
                    letterSpacing: "0.01em",
                  }}>
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Theme toggle placeholder */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${C.cream}06`, border: `1px solid ${C.creamFaint}10`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.25s ease",
            }}>
              <Icon name="settings" size={16} color={C.creamFaint} />
            </div>
            {/* Notifications */}
            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${C.cream}06`, border: `1px solid ${C.creamFaint}10`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="bell" size={16} color={C.creamFaint} />
              </div>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: C.orange,
                position: "absolute", top: 6, right: 6,
              }} />
            </div>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              boxShadow: `0 2px 10px ${C.blue}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontFamily: FONT.heading, fontWeight: 700,
              color: C.bg, cursor: "pointer",
            }}>MG</div>
          </div>
        </nav>

        {/* ════════════════════════════════ */}
        {/* THREE-COLUMN LAYOUT */}
        {/* ════════════════════════════════ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr 300px",
          gap: 0,
          maxWidth: 1320,
          margin: "0 auto",
          paddingTop: 64,
          minHeight: "100vh",
        }}>

          {/* ──────────────────────────── */}
          {/* LEFT SIDEBAR */}
          {/* ──────────────────────────── */}
          <aside style={{
            padding: "28px 24px",
            borderRight: `1px solid ${C.creamFaint}08`,
            position: "sticky", top: 64, height: "calc(100vh - 64px)",
            overflowY: "auto",
            display: "flex", flexDirection: "column",
            ...s(1),
          }}>
            {/* User card */}
            <div style={{
              padding: "20px 16px", borderRadius: 14,
              background: C.bgCard, border: `1px solid ${C.creamFaint}0a`,
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
                  boxShadow: `0 3px 14px ${C.blue}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
                }}>MG</div>
                <div>
                  <div style={{
                    fontSize: 11, color: C.creamFaint, letterSpacing: "0.1em",
                    textTransform: "uppercase", marginBottom: 2,
                  }}>Welcome back</div>
                  <div style={{
                    fontFamily: FONT.heading, fontSize: 16, fontWeight: 700,
                    color: C.cream, letterSpacing: "-0.02em",
                  }}>Mike Gunko</div>
                </div>
              </div>

              {/* Mini stats */}
              <div style={{
                display: "flex", gap: 0, marginTop: 18,
                borderTop: `1px solid ${C.creamFaint}0c`, paddingTop: 14,
              }}>
                {[
                  { num: "324", label: "Movies" },
                  { num: "3.8", label: "Avg Rating" },
                ].map((stat, i) => (
                  <div key={i} style={{
                    flex: 1, textAlign: "center",
                    borderRight: i === 0 ? `1px solid ${C.creamFaint}0c` : "none",
                  }}>
                    <div style={{
                      fontFamily: FONT.heading, fontSize: 22, fontWeight: 700,
                      color: C.cream, letterSpacing: "-0.03em",
                    }}>{stat.num}</div>
                    <div style={{
                      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: C.creamFaint, marginTop: 3,
                    }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collectives */}
            <div style={{ marginBottom: 6 }}>
              <div style={{
                fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                color: C.creamFaint, fontWeight: 600, marginBottom: 12, padding: "0 4px",
              }}>Your Collectives</div>

              {collectives.map((coll, i) => (
                <div key={i}
                  onMouseEnter={() => setHoveredCollective(i)}
                  onMouseLeave={() => setHoveredCollective(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    cursor: "pointer",
                    background: hoveredCollective === i ? `${C.cream}05` : "transparent",
                    transition: "all 0.25s ease",
                    marginBottom: 2,
                  }}>
                  <CollectiveBadge colors={coll.colors} initials={coll.initials} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13.5, fontWeight: 500, color: C.cream,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{coll.name}</div>
                    <div style={{ fontSize: 12, color: C.creamFaint, lineHeight: 1.5 }}>
                      {coll.members} members
                    </div>
                  </div>
                  <div style={{
                    fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: coll.colors[0], fontWeight: 600,
                  }}>Owner</div>
                </div>
              ))}

              {/* Create collective */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                border: `1px dashed ${C.creamFaint}18`,
                marginTop: 8,
                transition: "all 0.25s ease",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  border: `1.5px dashed ${C.creamFaint}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="plus" size={14} color={C.creamFaint} />
                </div>
                <div style={{ fontSize: 13, color: C.creamFaint }}>Create collective</div>
              </div>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Settings */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, cursor: "pointer",
              transition: "all 0.25s ease",
            }}>
              <Icon name="settings" size={16} color={C.creamFaint} />
              <span style={{ fontSize: 13, color: C.creamFaint }}>Settings</span>
            </div>
          </aside>

          {/* ──────────────────────────── */}
          {/* CENTER — MAIN FEED */}
          {/* ──────────────────────────── */}
          <main style={{
            padding: "28px 36px",
            minHeight: "100vh",
          }}>
            {/* Page title */}
            <div style={{ marginBottom: 28, ...s(2) }}>
              <div style={{
                fontFamily: FONT.heading, fontSize: 30, fontWeight: 700,
                color: C.cream, letterSpacing: "-0.03em",
              }}>Dashboard</div>
              <div style={{
                fontSize: 14, color: C.creamMuted, marginTop: 4, lineHeight: 1.5,
              }}>Here's what's happening across your collectives</div>
            </div>

            {/* Tonight's Pick — wide hero */}
            <div style={{ ...s(3) }}>
              <div
                onMouseEnter={() => setTonightsPickHover(true)}
                onMouseLeave={() => setTonightsPickHover(false)}
                style={{
                  borderRadius: 16, cursor: "pointer",
                  background: `linear-gradient(155deg, ${C.blue}16, ${C.bgCard} 45%, ${C.orange}06)`,
                  border: `1px solid ${tonightsPickHover ? C.blue + "30" : C.blue + "15"}`,
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: tonightsPickHover ? "translateY(-2px)" : "none",
                  boxShadow: tonightsPickHover
                    ? `0 8px 32px ${C.blue}12`
                    : `0 2px 8px ${C.blue}04`,
                  display: "flex", alignItems: "stretch",
                  overflow: "hidden", marginBottom: 28,
                }}>
                <div style={{ flex: 1, padding: "24px 24px" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(to right, ${C.blue}50, ${C.orange}25, transparent)`,
                  }} />
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${C.blue}18`, border: `1px solid ${C.blue}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name="discover" size={13} color={C.blue} />
                    </div>
                    <div style={{
                      fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                      color: C.blue, fontWeight: 600,
                    }}>Tonight's Pick</div>
                  </div>
                  <div style={{
                    fontFamily: FONT.heading, fontSize: 21, fontWeight: 600,
                    color: C.cream, lineHeight: 1.3, letterSpacing: "-0.02em",
                    marginBottom: 6,
                  }}>Not sure what to watch?</div>
                  <div style={{
                    fontSize: 13.5, color: C.creamMuted, lineHeight: 1.5, marginBottom: 16,
                  }}>Get a recommendation based on your mood and taste.</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 22,
                    background: `${C.blue}18`, border: `1px solid ${C.blue}28`,
                    fontSize: 13, fontWeight: 500, color: C.blueLight,
                    transition: "all 0.3s ease",
                  }}>
                    Find a film <Icon name="arrow" size={14} color={C.blueLight} />
                  </div>
                </div>
                {/* Visual — stacked posters */}
                <div style={{
                  width: 140, position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {[2, 1, 0].map((i) => (
                    <div key={i} style={{
                      position: "absolute",
                      width: 68, height: 96, borderRadius: 8,
                      background: `linear-gradient(145deg, ${[C.bgElevated, C.bgCardHover, C.bgCard][i]}, ${C.bgCard})`,
                      border: `1px solid ${C.creamFaint}${["0a", "0e", "14"][i]}`,
                      transform: `rotate(${[-8, -3, 4][i]}deg) translateX(${[-8, 0, 8][i]}px)`,
                      boxShadow: `0 2px 10px ${C.warmBlack}50`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: i,
                    }}>
                      {i === 2 && (
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: `${C.blue}18`, border: `1px solid ${C.blue}22`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name="play" size={12} color={C.blue} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity header + filters */}
            <div style={{ ...s(4) }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: C.creamFaint, fontWeight: 600,
                }}>Collective Activity</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["All", "Ratings", "Discussions"].map((filter, i) => (
                    <div key={filter} style={{
                      padding: "5px 14px", borderRadius: 18, fontSize: 12,
                      cursor: "pointer",
                      background: i === 0 ? `${C.blue}18` : "transparent",
                      color: i === 0 ? C.blueLight : C.creamFaint,
                      border: `1px solid ${i === 0 ? C.blue + "28" : "transparent"}`,
                      transition: "all 0.25s ease",
                    }}>{filter}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity items */}
            {activity.map((item, i) => (
              <div key={i} style={{
                padding: "18px 20px", borderRadius: 14,
                background: C.bgCard, border: `1px solid ${C.creamFaint}08`,
                marginBottom: 10, cursor: "pointer",
                display: "flex", gap: 14, alignItems: "flex-start",
                transition: "all 0.3s ease",
                ...s(5 + i * 0.5),
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}80)`,
                  boxShadow: `0 2px 10px ${item.color}22`,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
                }}>{item.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: C.cream, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>{" "}
                    <span style={{ color: C.creamMuted }}>rated</span>{" "}
                    <span style={{ fontWeight: 600 }}>{item.film}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <Stars rating={item.rating} />
                    <span style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>{item.rating}.0</span>
                  </div>
                  <div style={{
                    fontSize: 12, color: C.creamFaint, marginTop: 6,
                    display: "flex", alignItems: "center", gap: 8, lineHeight: 1.5,
                  }}>
                    <span style={{ color: item.color, opacity: 0.8 }}>{item.collective}</span>
                    <span style={{ color: C.creamFaint + "40" }}>·</span>
                    <span>{item.time}</span>
                  </div>
                </div>
                {/* Poster */}
                <div style={{
                  width: 52, height: 74, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(145deg, ${C.bgElevated}, ${C.bgCard})`,
                  border: `1px solid ${C.creamFaint}0c`,
                  display: "flex", alignItems: "flex-end", justifyContent: "center",
                  padding: 7,
                }}>
                  <div style={{
                    fontSize: 8.5, color: C.creamFaint + "50", textAlign: "center",
                    fontWeight: 600, lineHeight: 1.3,
                  }}>{item.film.length > 16 ? item.film.slice(0, 14) + "…" : item.film}</div>
                </div>
              </div>
            ))}
          </main>

          {/* ──────────────────────────── */}
          {/* RIGHT SIDEBAR */}
          {/* ──────────────────────────── */}
          <aside style={{
            padding: "28px 24px",
            borderLeft: `1px solid ${C.creamFaint}08`,
            position: "sticky", top: 64, height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}>
            {/* Top 3 Films */}
            <div style={{ ...s(3) }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: C.creamFaint, fontWeight: 600,
                }}>Your Top 3 Films</div>
                <div style={{
                  fontSize: 12, color: C.orange, cursor: "pointer", fontWeight: 500,
                }}>Edit</div>
              </div>

              <div style={{
                borderRadius: 14, background: C.bgCard,
                border: `1px solid ${C.creamFaint}08`,
                overflow: "hidden",
              }}>
                {topFilms.map((film, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    borderBottom: i < 2 ? `1px solid ${C.creamFaint}08` : "none",
                    cursor: "pointer",
                    transition: "background 0.25s ease",
                  }}>
                    {/* Rank */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${film.color}18`,
                      border: `1px solid ${film.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: film.color,
                      flexShrink: 0,
                    }}>{i + 1}</div>
                    {/* Poster placeholder */}
                    <div style={{
                      width: 38, height: 54, borderRadius: 6, flexShrink: 0,
                      background: `linear-gradient(145deg, ${film.color}10, ${C.bgElevated})`,
                      border: `1px solid ${C.creamFaint}0c`,
                    }} />
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: C.cream,
                        letterSpacing: "-0.01em", lineHeight: 1.3,
                      }}>{film.title}</div>
                      <div style={{ fontSize: 12, color: C.creamFaint, marginTop: 2 }}>
                        {film.year}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Stats */}
            <div style={{ marginTop: 24, ...s(4) }}>
              <div style={{
                fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                color: C.creamFaint, fontWeight: 600, marginBottom: 14,
              }}>Your Stats</div>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
              }}>
                {[
                  { num: "324", label: "Movies", color: C.orange },
                  { num: "2", label: "Shows", color: C.blue },
                  { num: "4", label: "Collectives", color: C.teal },
                  { num: "3.8", label: "Avg Rating", color: C.rose },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: "16px 14px", borderRadius: 12,
                    background: C.bgCard, border: `1px solid ${C.creamFaint}08`,
                    textAlign: "center", position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 2,
                      borderRadius: "12px 12px 0 0",
                      background: `linear-gradient(to right, ${stat.color}35, transparent)`,
                    }} />
                    <div style={{
                      fontFamily: FONT.heading, fontSize: 24, fontWeight: 700,
                      color: C.cream, letterSpacing: "-0.03em",
                    }}>{stat.num}</div>
                    <div style={{
                      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: C.creamFaint, marginTop: 4,
                    }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Ratings teaser */}
            <div style={{ marginTop: 24, ...s(5) }}>
              <div style={{
                fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                color: C.creamFaint, fontWeight: 600, marginBottom: 14,
              }}>Your Recent Ratings</div>

              <div style={{
                borderRadius: 14, background: C.bgCard,
                border: `1px solid ${C.creamFaint}08`,
                overflow: "hidden",
              }}>
                {[
                  { title: "Anora", rating: 4, time: "2 days ago" },
                  { title: "The Brutalist", rating: 5, time: "1 week ago" },
                  { title: "Nosferatu", rating: 3, time: "2 weeks ago" },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: i < 2 ? `1px solid ${C.creamFaint}08` : "none",
                    cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: C.cream }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: C.creamFaint, marginTop: 2 }}>{r.time}</div>
                    </div>
                    <Stars rating={r.rating} size={11} />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ── FAB — Log Film ── */}
        <div style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 1001,
        }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
              boxShadow: `0 4px 20px ${C.orange}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = `0 6px 28px ${C.orange}50, 0 0 0 8px ${C.orange}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${C.orange}40`;
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.warmBlack} strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
