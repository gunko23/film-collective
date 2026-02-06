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

const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

const FONT = {
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
};

const Icon = ({ name, size = 18, color = C.creamMuted }) => {
  const paths = {
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
    collectives: <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" /><path d="M17 14c2.5 0 4.5 1.8 4.5 4.5" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" /></>,
    chevron: <path d="M9 18l6-6-6-6" />,
    sparkle: <><path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4l1.4-1.4M17 7l1.4-1.4" /></>,
    play: <path d="M6 3l15 9-15 9V3z" />,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const Stars = ({ rating, size = 13 }) => (
  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
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
    position: "absolute", width: 240, height: 240, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    filter: "blur(65px)", pointerEvents: "none", ...style,
  }} />
);

const CollectiveBadge = ({ colors, initials, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT.heading, fontWeight: 700, fontSize: size * 0.34,
    color: C.bg, letterSpacing: "-0.02em",
    boxShadow: `0 3px 14px ${colors[0]}30`,
    flexShrink: 0,
  }}>
    {initials}
  </div>
);

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [tonightsPickHover, setTonightsPickHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  useEffect(() => {
    const container = document.getElementById("mobile-scroll-container");
    if (!container) return;
    const handleScroll = () => setScrolled(container.scrollTop > 40);
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const s = (i) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(12px)",
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s`,
  });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.warmBlack}; }
        ::-webkit-scrollbar { display: none; }
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div
        id="mobile-scroll-container"
        style={{
          background: C.bg, color: C.cream, minHeight: "100vh",
          fontFamily: FONT.body, position: "relative",
          maxWidth: 430, margin: "0 auto",
          height: "100vh", overflowY: "auto", overflowX: "hidden",
        }}>
        {/* Grain */}
        <div style={{
          position: "fixed", inset: 0, backgroundImage: grainSVG, backgroundRepeat: "repeat",
          pointerEvents: "none", zIndex: 9998, opacity: 0.4, mixBlendMode: "overlay",
        }} />

        <LightLeak color={C.orangeGlow} style={{ top: -80, right: -60 }} />
        <LightLeak color={C.blueGlow} style={{ top: 380, left: -100 }} />

        {/* ── Sticky Top Navbar ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 500,
          background: scrolled ? `${C.bg}e8` : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.creamFaint}0c` : `1px solid transparent`,
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          padding: scrolled ? "10px 24px" : "14px 24px 10px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {/* Left: Logo / Brand */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.35s ease",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `linear-gradient(135deg, ${C.orange}22, ${C.blue}18)`,
                border: `1px solid ${C.orange}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.35s ease",
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  stroke={C.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8h20M2 16h20M8 4v16M16 4v16" />
                </svg>
              </div>
              {/* Brand text — fades in when scrolled to replace the header below */}
              <div style={{
                overflow: "hidden",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                maxWidth: scrolled ? 200 : 0,
                opacity: scrolled ? 1 : 0,
              }}>
                <div style={{
                  fontFamily: FONT.heading, fontSize: 15, fontWeight: 700,
                  color: C.cream, letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                }}>Film Collective</div>
              </div>
            </div>

            {/* Right: Bell + Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", cursor: "pointer", padding: 4 }}>
                <Icon name="bell" size={20} color={C.creamMuted} />
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", background: C.orange,
                  position: "absolute", top: 2, right: 2,
                }} />
              </div>
              <div style={{
                width: scrolled ? 34 : 44, height: scrolled ? 34 : 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
                boxShadow: `0 3px 14px ${C.blue}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: scrolled ? 13 : 17, fontFamily: FONT.heading, fontWeight: 700,
                color: C.bg, cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>M</div>
            </div>
          </div>
        </div>

        {/* ── Header (below sticky nav) ── */}
        <div style={{ padding: "12px 24px 0", position: "relative", ...s(0) }}>
          <div style={{
            fontFamily: FONT.body, fontSize: 12, letterSpacing: "0.13em",
            textTransform: "uppercase", color: C.creamFaint, marginBottom: 4,
          }}>Welcome back</div>
          <div style={{
            fontFamily: FONT.heading, fontSize: 38, fontWeight: 700,
            lineHeight: 1.05, color: C.cream, letterSpacing: "-0.03em",
          }}>Mike</div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 2, padding: "28px 24px 0", ...s(1) }}>
          {[
            { num: "324", label: "Films" },
            { num: "2", label: "Shows" },
            { num: "4", label: "Collectives" },
            { num: "3.8", label: "Avg" },
          ].map((stat, i) => (
            <div key={i} style={{ display: "flex", flex: 1, alignItems: "center" }}>
              <div style={{ flex: 1, textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  fontFamily: FONT.heading, fontSize: 26, fontWeight: 700,
                  color: C.cream, lineHeight: 1, letterSpacing: "-0.03em",
                }}>{stat.num}</div>
                <div style={{
                  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: C.creamFaint, marginTop: 6, lineHeight: 1.5,
                }}>{stat.label}</div>
              </div>
              {i < 3 && <div style={{
                width: 1, margin: "8px 0", alignSelf: "stretch",
                background: `linear-gradient(to bottom, transparent, ${C.creamFaint}25, transparent)`,
              }} />}
            </div>
          ))}
        </div>

        {/* ── Tonight's Pick — hero card ── */}
        <div style={{ padding: "28px 24px 0", ...s(2) }}>
          <div
            onMouseEnter={() => setTonightsPickHover(true)}
            onMouseLeave={() => setTonightsPickHover(false)}
            style={{
              borderRadius: 16, cursor: "pointer",
              background: `linear-gradient(155deg, ${C.blue}18, ${C.bgCard} 40%, ${C.orange}08)`,
              border: `1px solid ${tonightsPickHover ? C.blue + "35" : C.blue + "18"}`,
              position: "relative",
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: tonightsPickHover ? "translateY(-2px)" : "none",
              boxShadow: tonightsPickHover
                ? `0 8px 32px ${C.blue}15`
                : `0 2px 12px ${C.blue}06`,
              display: "flex", alignItems: "stretch",
              overflow: "hidden",
            }}>
            {/* Left content */}
            <div style={{ flex: 1, padding: "22px 20px" }}>
              {/* Accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(to right, ${C.blue}60, ${C.orange}30, transparent)`,
              }} />
              <div style={{
                fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                color: C.blue, marginBottom: 10, fontWeight: 600,
              }}>Tonight's Pick</div>
              <div style={{
                fontFamily: FONT.heading, fontSize: 20, fontWeight: 600,
                color: C.cream, lineHeight: 1.25, letterSpacing: "-0.02em",
              }}>
                Not sure what to watch?
              </div>
              <div style={{
                fontSize: 13, color: C.creamMuted, marginTop: 6, lineHeight: 1.5,
              }}>
                Get a recommendation based on your mood and taste.
              </div>
              {/* CTA pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 14, padding: "8px 16px", borderRadius: 20,
                background: `${C.blue}18`,
                border: `1px solid ${C.blue}25`,
                fontSize: 12, fontWeight: 500, color: C.blueLight,
                transition: "all 0.3s ease",
              }}>
                Find a film
                <Icon name="arrow" size={13} color={C.blueLight} />
              </div>
            </div>
            {/* Right visual — stacked film strip */}
            <div style={{
              width: 100, position: "relative", marginRight: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Stacked poster cards suggesting discovery */}
              {[2, 1, 0].map((i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: 58, height: 82, borderRadius: 8,
                  background: `linear-gradient(145deg, ${[C.bgElevated, C.bgCardHover, C.bgCard][i]}, ${C.bgCard})`,
                  border: `1px solid ${C.creamFaint}${["0c", "10", "15"][i]}`,
                  transform: `rotate(${[-8, -3, 4][i]}deg) translateX(${[-6, 0, 6][i]}px)`,
                  boxShadow: `0 2px 8px ${C.warmBlack}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: i,
                }}>
                  {i === 2 && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${C.blue}18`, border: `1px solid ${C.blue}25`,
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

        {/* ── Your Collectives ── */}
        <div style={s(3)}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "34px 24px 14px",
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: C.creamFaint, fontWeight: 600,
            }}>Your Collectives</div>
            <div style={{
              fontSize: 12, color: C.creamMuted, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              View all <Icon name="chevron" size={12} color={C.creamMuted} />
            </div>
          </div>
          <div style={{
            display: "flex", gap: 14, padding: "0 24px",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {[
              { name: "Misha + Milya", members: 2, colors: [C.orange, C.orangeLight], initials: "MM" },
              { name: "Tiger Pride", members: 6, colors: [C.blue, C.blueLight], initials: "TP" },
              { name: "Family Films", members: 3, colors: [C.teal, "#6bc4b4"], initials: "FF" },
            ].map((coll, i) => (
              <div key={i} style={{
                minWidth: 155, padding: "18px 16px", borderRadius: 14,
                background: C.bgCard, border: `1px solid ${C.creamFaint}0c`,
                cursor: "pointer", position: "relative",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(to right, ${coll.colors[0]}, ${coll.colors[1]}60, transparent)`,
                }} />
                <CollectiveBadge colors={coll.colors} initials={coll.initials} size={40} />
                <div style={{
                  fontFamily: FONT.heading, fontSize: 15, fontWeight: 600,
                  color: C.cream, marginTop: 12, marginBottom: 4, lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                }}>{coll.name}</div>
                <div style={{ fontSize: 12, color: C.creamMuted, lineHeight: 1.5 }}>
                  {coll.members} members
                </div>
                <div style={{
                  display: "inline-block", fontSize: 9, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: coll.colors[0],
                  border: `1px solid ${coll.colors[0]}30`,
                  borderRadius: 4, padding: "3px 7px", marginTop: 10,
                }}>owner</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top 3 Films ── */}
        <div style={s(4)}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "34px 24px 14px",
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: C.creamFaint, fontWeight: 600,
            }}>Your Top 3</div>
            <div style={{ fontSize: 12, color: C.orange, cursor: "pointer" }}>Edit</div>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "0 24px", alignItems: "flex-end" }}>
            {[
              { title: "The Godfather", year: "'72", color: C.orange },
              { title: "There Will Be Blood", year: "'07", color: C.blue },
              { title: "The Dark Knight", year: "'08", color: C.teal },
            ].map((f, i) => (
              <div key={i} style={{
                flex: i === 0 ? 1.1 : 1, aspectRatio: "2/3", borderRadius: 10,
                position: "relative", cursor: "pointer",
                transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              }}>
                <div style={{
                  width: "100%", height: "100%", borderRadius: 10,
                  background: `linear-gradient(155deg, ${f.color}10, ${C.bgCard}, ${C.bgElevated})`,
                  border: `1px solid ${C.creamFaint}0c`,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  padding: 12, position: "relative", overflow: "hidden",
                }}>
                  {/* Top color accent */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(to right, ${f.color}, ${f.color}30, transparent)`,
                  }} />
                  {/* Rank watermark */}
                  <div style={{
                    fontFamily: FONT.heading, fontSize: 56, fontWeight: 800,
                    lineHeight: 1, color: C.cream, opacity: 0.05,
                    position: "absolute", top: 6, left: 10,
                  }}>{i + 1}</div>
                  {/* Bottom gradient */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "65%",
                    background: `linear-gradient(to top, ${C.warmBlack}cc, transparent)`,
                  }} />
                  <div style={{
                    fontFamily: FONT.heading, fontSize: 13.5, fontWeight: 600,
                    color: C.cream, lineHeight: 1.2, position: "relative", zIndex: 1,
                    letterSpacing: "-0.01em",
                  }}>{f.title}</div>
                  <div style={{
                    fontSize: 11, color: C.creamFaint, marginTop: 2,
                    position: "relative", zIndex: 1,
                  }}>{f.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Collective Activity ── */}
        <div style={s(5)}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "34px 24px 14px",
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: C.creamFaint, fontWeight: 600,
            }}>Collective Activity</div>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, padding: "0 24px 12px" }}>
            {["All", "Ratings", "Discussions"].map((filter, i) => (
              <div key={filter} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12,
                cursor: "pointer",
                background: i === 0 ? `${C.blue}18` : "transparent",
                color: i === 0 ? C.blueLight : C.creamFaint,
                border: `1px solid ${i === 0 ? C.blue + "30" : "transparent"}`,
                transition: "all 0.3s ease",
              }}>{filter}</div>
            ))}
          </div>

          {/* Feed */}
          {[
            { name: "Emilia", initial: "E", film: "Marty Supreme", rating: 4, collective: "Misha + Milya", time: "1d", color: C.orange },
            { name: "Dan", initial: "D", film: "Spider-Man: Across the Spider-Verse", rating: 5, collective: "Tiger Pride", time: "2d", color: C.rose },
            { name: "Dan", initial: "D", film: "The Musical", rating: 3, collective: "Gunko Bros", time: "5d", color: C.teal },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "16px 24px", display: "flex", gap: 14, alignItems: "flex-start",
              borderBottom: `1px solid ${C.creamFaint}08`, cursor: "pointer",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: `linear-gradient(135deg, ${item.color}, ${item.color}80)`,
                boxShadow: `0 2px 12px ${item.color}25`,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontFamily: FONT.heading, fontWeight: 700,
                color: C.bg,
              }}>{item.initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: C.cream, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>{" "}
                  <span style={{ color: C.creamMuted }}>rated</span>{" "}
                  <span style={{ fontWeight: 500 }}>{item.film}</span>
                </div>
                <Stars rating={item.rating} />
                <div style={{
                  fontSize: 12, color: C.creamFaint, marginTop: 4,
                  display: "flex", alignItems: "center", gap: 8, lineHeight: 1.5,
                }}>
                  <span style={{ color: item.color, opacity: 0.8 }}>{item.collective}</span>
                  <span style={{ color: C.creamFaint + "40" }}>·</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <div style={{
                width: 44, height: 64, borderRadius: 7, flexShrink: 0,
                background: `linear-gradient(145deg, ${C.bgElevated}, ${C.bgCard})`,
                border: `1px solid ${C.creamFaint}0c`,
              }} />
            </div>
          ))}
        </div>

        {/* Spacer for FAB / nav overlap */}
        <div style={{ height: 100 }} />

        {/* ── FAB — Log Film ── */}
        <div style={{
          position: "fixed", bottom: 90,
          left: "50%", transform: "translateX(calc(-50% + 160px))",
          zIndex: 200,
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

        {/* ── Bottom Nav ── */}
        <div style={{
          position: "sticky", bottom: 0, display: "flex", justifyContent: "space-around",
          padding: "14px 0 22px",
          background: `linear-gradient(to top, ${C.bg}, ${C.bg}ee, transparent)`,
          backdropFilter: "blur(14px)", zIndex: 100,
        }}>
          {[
            { icon: "home", label: "Home", key: "home" },
            { icon: "search", label: "Search", key: "search" },
            { icon: "collectives", label: "Collectives", key: "collectives" },
            { icon: "bell", label: "Alerts", key: "alerts" },
            { icon: "profile", label: "Profile", key: "profile" },
          ].map((item) => (
            <div key={item.key}
              onClick={() => setActiveNav(item.key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                cursor: "pointer", transition: "all 0.3s ease",
                opacity: activeNav === item.key ? 1 : 0.4,
                position: "relative",
              }}>
              <Icon name={item.icon} size={20}
                color={activeNav === item.key ? C.cream : C.creamMuted} />
              <span style={{
                fontSize: 10, letterSpacing: "0.06em",
                color: activeNav === item.key ? C.cream : C.creamMuted,
              }}>{item.label}</span>
              {activeNav === item.key && (
                <div style={{
                  position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                  width: 16, height: 2, borderRadius: 1,
                  background: `linear-gradient(to right, ${C.blue}, ${C.orange})`,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
