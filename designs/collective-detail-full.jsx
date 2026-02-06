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
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
};

const FONT = {
  heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
};

const grainSVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

const Icon = ({ name, size = 18, color = C.creamMuted }) => {
  const paths = {
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.55.68.94 1.27 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
    collectives: <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" /><path d="M17 14c2.5 0 4.5 1.8 4.5 4.5" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" /></>,
    feed: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />,
    chat: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
    film: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20M2 16h20M8 4v16M16 4v16" /></>,
    insights: <><path d="M18 20V10M12 20V4M6 20v-6" /></>,
    chevron: <path d="M9 18l6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
    smile: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></>,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const Stars = ({ rating, size = 12 }) => (
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
    position: "absolute", width: 240, height: 240, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    filter: "blur(65px)", pointerEvents: "none", ...style,
  }} />
);

const CollectiveBadge = ({ colors, initials, size = 48 }) => (
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

const OnlineDot = () => (
  <div style={{
    width: 9, height: 9, borderRadius: "50%",
    background: "#4ade80", border: `2px solid ${C.bg}`,
    position: "absolute", bottom: 0, right: 0,
  }} />
);

// ═══════════════════════════════════
// FEED TAB
// ═══════════════════════════════════
const FeedTab = ({ s }) => {
  const [hoveredAction, setHoveredAction] = useState(null);

  return (
    <>
      {/* Quick Actions */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        padding: "20px 24px 0", ...s(3),
      }}>
        {[
          { title: "Tonight's Pick", sub: "AI-powered suggestion", color: C.blue, colorLight: C.blueLight, icon: "search" },
          { title: "Start Discussion", sub: "Share your thoughts", color: C.orange, colorLight: C.orangeLight, icon: "chat" },
        ].map((action, i) => (
          <div key={i}
            onMouseEnter={() => setHoveredAction(i)}
            onMouseLeave={() => setHoveredAction(null)}
            style={{
              padding: "20px 18px", borderRadius: 14, cursor: "pointer",
              background: `linear-gradient(155deg, ${action.color}14, ${C.bgCard})`,
              border: `1px solid ${hoveredAction === i ? action.color + "35" : action.color + "18"}`,
              position: "relative",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hoveredAction === i ? "translateY(-2px)" : "none",
              boxShadow: hoveredAction === i ? `0 8px 24px ${action.color}14` : "none",
            }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              borderRadius: "14px 14px 0 0",
              background: `linear-gradient(to right, ${action.color}, ${action.colorLight}50, transparent)`,
            }} />
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `${action.color}15`, border: `1px solid ${action.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              <Icon name={action.icon} size={14} color={action.color} />
            </div>
            <div style={{
              fontFamily: FONT.heading, fontSize: 16, color: C.cream,
              fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em",
            }}>{action.title}</div>
            <div style={{ fontSize: 12, color: C.creamMuted, marginTop: 4, lineHeight: 1.5 }}>
              {action.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={s(4)}>
        <div style={{
          padding: "30px 24px 12px",
          fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          color: C.creamFaint, fontWeight: 600,
        }}>Recent Activity</div>

        {[
          { name: "Kurtis Foster", initial: "K", action: "commented on", target: "Kurtis Foster's review", film: "The Proposition", time: "about 2 months ago", color: C.teal, poster: "https://image.tmdb.org/t/p/w92/jVtYOkEiqXBJJBVduVXBSMHMlEO.jpg" },
          { name: "Dan Gunko", initial: "D", action: "rated", target: null, film: "Spider-Man: Across the Spider-Verse", rating: 5, time: "2 days ago", color: C.rose, poster: "https://image.tmdb.org/t/p/w92/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" },
          { name: "Sarah Kim", initial: "S", action: "rated", target: null, film: "Past Lives", rating: 4, time: "4 days ago", color: C.orange, poster: "https://image.tmdb.org/t/p/w92/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "14px 24px", display: "flex", gap: 14, alignItems: "flex-start",
            borderBottom: `1px solid ${C.creamFaint}08`, cursor: "pointer",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${item.color}, ${item.color}80)`,
              boxShadow: `0 2px 10px ${item.color}22`,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
            }}>{item.initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: C.cream, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>{" "}
                <span style={{ color: C.creamMuted }}>{item.action}</span>{" "}
                {item.target && <span style={{ fontWeight: 500 }}>{item.target}</span>}
              </div>
              {item.rating && <div style={{ marginTop: 3 }}><Stars rating={item.rating} /></div>}
              <div style={{
                fontSize: 12, color: C.creamFaint, marginTop: 4,
                display: "flex", alignItems: "center", gap: 8, lineHeight: 1.5,
              }}>
                <span style={{ fontWeight: 500, color: C.creamMuted }}>{item.film}</span>
                <span style={{ color: C.creamFaint + "40" }}>·</span>
                <span>{item.time}</span>
              </div>
            </div>
            {/* Movie poster thumbnail */}
            <div style={{
              width: 44, height: 64, borderRadius: 7, flexShrink: 0,
              overflow: "hidden", position: "relative",
              background: `linear-gradient(145deg, ${C.bgElevated}, ${C.bgCard})`,
              border: `1px solid ${C.creamFaint}0c`,
            }}>
              <img
                src={item.poster}
                alt={item.film}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div style={s(5)}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          padding: "28px 24px 12px",
        }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.creamFaint, fontWeight: 600 }}>Members</div>
          <div style={{ fontSize: 12, color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            View all <Icon name="chevron" size={12} color={C.blue} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, padding: "0 24px 24px", overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { initial: "M", name: "Mike", online: true, colors: [C.blue, C.blueLight] },
            { initial: "S", name: "Sarah", online: false, colors: [C.orange, C.orangeLight] },
            { initial: "M", name: "Maria", online: false, colors: [C.teal, "#6bc4b4"] },
            { initial: "J", name: "James", online: false, colors: [C.blueMuted, C.blueLight] },
            { initial: "D", name: "Dan", online: true, colors: [C.rose, "#d88088"] },
            { initial: "A", name: "Alex", online: false, colors: [C.orange, C.orangeLight] },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 52 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", position: "relative",
                background: `linear-gradient(135deg, ${m.colors[0]}, ${m.colors[1]})`,
                boxShadow: `0 3px 12px ${m.colors[0]}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
              }}>
                {m.initial}
                {m.online && <OnlineDot />}
              </div>
              <div style={{ fontSize: 11, color: C.creamMuted }}>{m.name}</div>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 52, cursor: "pointer" }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              border: `1.5px dashed ${C.creamFaint}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="plus" size={16} color={C.creamFaint} />
            </div>
            <div style={{ fontSize: 11, color: C.creamFaint }}>Invite</div>
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════
// CHAT TAB
// ═══════════════════════════════════
const ChatTab = ({ s }) => {
  const [message, setMessage] = useState("");

  const msgs = [
    { id: 1, sender: "Mike", initial: "M", color: C.blue, text: "Test message", time: "2:14 PM", own: true },
    { id: 2, sender: "Mike", initial: "M", color: C.blue, text: "Another test message", time: "2:15 PM", own: true },
    { id: 3, sender: "Mike", initial: "M", color: C.blue, text: "Test", time: "2:16 PM", own: true },
    { id: 4, sender: "Dan", initial: "D", color: C.rose, text: "Hey everyone, has anyone seen Anora yet?", time: "3:02 PM", own: false },
    { id: 5, sender: "Sarah", initial: "S", color: C.orange, text: "Not yet! Is it good?", time: "3:10 PM", own: false },
    { id: 6, sender: "Dan", initial: "D", color: C.rose, text: "It's incredible. Sean Baker's best work imo", time: "3:12 PM", own: false },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 280px)",
      ...s(3),
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", scrollbarWidth: "none" }}>
        {/* Date separator */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 18px" }}>
          <div style={{ flex: 1, height: 1, background: `${C.creamFaint}12` }} />
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.creamFaint, fontWeight: 500, whiteSpace: "nowrap" }}>Wed, Feb 4</div>
          <div style={{ flex: 1, height: 1, background: `${C.creamFaint}12` }} />
        </div>

        {msgs.map((msg, i) => {
          const prev = msgs[i - 1];
          const next = msgs[i + 1];
          const isGroupStart = !prev || prev.sender !== msg.sender;
          const isGroupEnd = !next || next.sender !== msg.sender;

          return (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: msg.own ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 8,
              marginTop: isGroupStart ? 14 : 3,
            }}>
              {/* Avatar placeholder for alignment */}
              {!msg.own && (
                <div style={{ width: 28, flexShrink: 0 }}>
                  {isGroupStart && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${msg.color}, ${msg.color}80)`,
                      boxShadow: `0 2px 8px ${msg.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontFamily: FONT.heading, fontWeight: 700, color: C.bg,
                    }}>{msg.initial}</div>
                  )}
                </div>
              )}

              <div style={{ maxWidth: "75%" }}>
                {/* Name */}
                {isGroupStart && !msg.own && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: msg.color, marginBottom: 3, paddingLeft: 2 }}>{msg.sender}</div>
                )}

                {/* Bubble */}
                <div style={{
                  padding: "10px 16px",
                  borderRadius: msg.own
                    ? (!isGroupEnd ? "18px 6px 6px 18px" : isGroupStart ? "18px 18px 6px 18px" : "18px 6px 18px 18px")
                    : (!isGroupEnd ? "6px 18px 18px 6px" : isGroupStart ? "18px 18px 18px 6px" : "6px 18px 18px 18px"),
                  background: msg.own
                    ? `linear-gradient(135deg, ${C.blue}35, ${C.blue}20)`
                    : C.bgCard,
                  border: `1px solid ${msg.own ? C.blue + "20" : C.creamFaint + "0c"}`,
                  fontSize: 14, color: C.cream, lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>

                {/* Time — only on last in group */}
                {isGroupEnd && (
                  <div style={{
                    fontSize: 10, color: C.creamFaint, marginTop: 3,
                    textAlign: msg.own ? "right" : "left",
                    padding: "0 2px",
                  }}>{msg.time}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 24px 16px",
        borderTop: `1px solid ${C.creamFaint}0a`,
        background: `${C.bg}e0`,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px",
          borderRadius: 24,
          background: C.bgCard,
          border: `1px solid ${C.creamFaint}10`,
        }}>
          <div style={{ cursor: "pointer", flexShrink: 0 }}>
            <Icon name="smile" size={20} color={C.creamFaint} />
          </div>
          <input
            type="text" placeholder="Message" value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 14, color: C.cream, fontFamily: FONT.body,
            }}
          />
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: message.trim() ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})` : `${C.creamFaint}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: message.trim() ? "pointer" : "default",
            transition: "all 0.3s ease", flexShrink: 0,
          }}>
            <Icon name="send" size={15} color={message.trim() ? C.warmBlack : C.creamFaint + "50"} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// FILMS TAB
// ═══════════════════════════════════
const FilmsTab = ({ s }) => {
  const [hoveredFilm, setHoveredFilm] = useState(null);

  const films = [
    { title: "Oppenheimer", year: "2023", rating: 4.5, color: C.orange },
    { title: "Dune: Part Two", year: "2024", rating: 4.7, color: C.orangeLight },
    { title: "Inception", year: "2010", rating: 4.8, color: C.blue },
    { title: "Up", year: "2009", rating: 4.2, color: C.teal },
    { title: "Lives of Others", year: "2006", rating: 4.4, color: C.blueMuted },
    { title: "La La Land", year: "2016", rating: 4.0, color: C.rose },
    { title: "The Godfather", year: "1972", rating: 4.9, color: C.orange },
    { title: "Whiplash", year: "2014", rating: 4.6, color: C.orangeMuted },
    { title: "Nosferatu", year: "2024", rating: 3.8, color: C.creamFaint },
  ];

  return (
    <div style={{ ...s(3) }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: "20px 24px 14px",
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.creamFaint, fontWeight: 600 }}>Films in this Collective</div>
        <div style={{ fontSize: 12, color: C.creamMuted }}>{films.length} films</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 24px 24px" }}>
        {films.map((film, i) => (
          <div key={i}
            onMouseEnter={() => setHoveredFilm(i)}
            onMouseLeave={() => setHoveredFilm(null)}
            style={{
              cursor: "pointer",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hoveredFilm === i ? "scale(1.03)" : "scale(1)",
            }}>
            <div style={{
              width: "100%", aspectRatio: "2/3", borderRadius: 10,
              background: `linear-gradient(155deg, ${film.color}15, ${C.bgCard} 40%, ${C.bgElevated})`,
              border: `1px solid ${hoveredFilm === i ? C.creamFaint + "20" : C.creamFaint + "0a"}`,
              position: "relative",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: 10, transition: "border-color 0.3s ease",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                borderRadius: "10px 10px 0 0",
                background: `linear-gradient(to right, ${film.color}50, transparent)`,
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "70%",
                background: `linear-gradient(to top, ${C.warmBlack}cc, transparent)`,
                borderRadius: "0 0 10px 10px",
              }} />
              <div style={{
                position: "relative", zIndex: 1,
                fontFamily: FONT.heading, fontWeight: 600,
                fontSize: 12, color: C.cream, lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}>{film.title}</div>
              <div style={{
                position: "relative", zIndex: 1,
                fontSize: 10, color: C.creamFaint, marginTop: 2,
              }}>{film.year}</div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              marginTop: 6, paddingLeft: 2,
            }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill={C.orange} stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span style={{ fontSize: 11, color: C.creamMuted, fontWeight: 600 }}>{film.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════
// MAIN
// ═══════════════════════════════════
export default function CollectiveDetail() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("Feed");
  const [activeNav, setActiveNav] = useState("collectives");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  useEffect(() => {
    const el = document.getElementById("coll-scroll");
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", fn, { passive: true });
    return () => el.removeEventListener("scroll", fn);
  }, []);

  const s = (i) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "translateY(0)" : "translateY(12px)",
    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s`,
  });

  const tabs = [
    { name: "Feed", icon: "feed" },
    { name: "Chat", icon: "chat" },
    { name: "Films", icon: "film" },
    { name: "Insights", icon: "insights" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.warmBlack}; }
        ::-webkit-scrollbar { display: none; }
        input::placeholder { color: ${C.creamFaint}; }
      `}</style>

      <div id="coll-scroll" style={{
        background: C.bg, color: C.cream, fontFamily: FONT.body,
        position: "relative", maxWidth: 430, margin: "0 auto",
        height: "100vh", overflowY: "auto", overflowX: "hidden",
      }}>
        {/* Grain */}
        <div style={{
          position: "fixed", inset: 0, backgroundImage: grainSVG, backgroundRepeat: "repeat",
          pointerEvents: "none", zIndex: 9998, opacity: 0.4, mixBlendMode: "overlay",
        }} />
        <LightLeak color={C.blueGlow} style={{ top: -70, left: -90 }} />
        <LightLeak color={C.orangeGlow} style={{ top: 500, right: -100, opacity: 0.5 }} />

        {/* ── Sticky Top Nav ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 500,
          background: scrolled ? `${C.bg}e8` : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.creamFaint}0c` : `1px solid transparent`,
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          padding: scrolled ? "10px 24px" : "14px 24px 10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ cursor: "pointer", padding: 4 }}>
                <Icon name="back" size={20} color={C.creamMuted} />
              </div>
              <div style={{
                overflow: "hidden",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                maxWidth: scrolled ? 250 : 0,
                opacity: scrolled ? 1 : 0,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <CollectiveBadge colors={[C.blue, C.blueLight]} initials="TP" size={28} />
                <span style={{
                  fontFamily: FONT.heading, fontSize: 15, fontWeight: 700,
                  color: C.cream, letterSpacing: "-0.02em", whiteSpace: "nowrap",
                }}>Tiger Pride</span>
              </div>
            </div>
            <div style={{ cursor: "pointer", padding: 4 }}>
              <Icon name="settings" size={20} color={C.creamFaint} />
            </div>
          </div>
        </div>

        {/* ── Collective Header ── */}
        <div style={{ padding: "14px 24px 0", ...s(1) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <CollectiveBadge colors={[C.blue, C.blueLight]} initials="TP" size={52} />
            <div>
              <div style={{
                fontFamily: FONT.heading, fontSize: 26, fontWeight: 700,
                color: C.cream, letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>Tiger Pride</div>
              <div style={{
                fontSize: 13, color: C.creamMuted, marginTop: 4,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>6 members</span>
                <span style={{ color: C.creamFaint + "40" }}>·</span>
                <span style={{ color: C.blue }}>You're the owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, padding: "20px 24px 0", ...s(2) }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.name;
            return (
              <div key={tab.name} onClick={() => setActiveTab(tab.name)}
                style={{
                  padding: "9px 16px", borderRadius: 22, fontSize: 13, cursor: "pointer",
                  fontWeight: active ? 500 : 400,
                  background: active ? `linear-gradient(135deg, ${C.blue}20, ${C.orange}10)` : "transparent",
                  color: active ? C.cream : C.creamFaint,
                  border: `1px solid ${active ? C.blue + "28" : "transparent"}`,
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <Icon name={tab.icon} size={13} color={active ? C.cream : C.creamFaint + "70"} />
                {tab.name}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ padding: "14px 24px 0" }}>
          <div style={{ height: 1, background: `linear-gradient(to right, ${C.blue}12, ${C.orange}08, transparent)` }} />
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "Feed" && <FeedTab s={s} />}
        {activeTab === "Chat" && <ChatTab s={s} />}
        {activeTab === "Films" && <FilmsTab s={s} />}
        {activeTab === "Insights" && (
          <div style={{ padding: "60px 24px", textAlign: "center", ...s(3) }}>
            <div style={{ fontSize: 14, color: C.creamFaint }}>Insights coming soon</div>
          </div>
        )}

        {/* Spacer */}
        {activeTab !== "Chat" && <div style={{ height: 80 }} />}

        {/* ── FAB (hidden on Chat) ── */}
        {activeTab !== "Chat" && (
        <div style={{
          position: "fixed", bottom: 90,
          left: "50%", transform: "translateX(calc(-50% + 160px))",
          zIndex: 200,
        }}>
          <div style={{
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
        )}

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
            <div key={item.key} onClick={() => setActiveNav(item.key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                cursor: "pointer", transition: "all 0.3s ease",
                opacity: activeNav === item.key ? 1 : 0.4, position: "relative",
              }}>
              <Icon name={item.icon} size={20} color={activeNav === item.key ? C.cream : C.creamMuted} />
              <span style={{ fontSize: 10, letterSpacing: "0.06em", color: activeNav === item.key ? C.cream : C.creamMuted }}>{item.label}</span>
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
