import { useState } from "react";

const TABS = ["Info", "Discussion", "Ratings"];

const movie = {
  title: "The Godfather",
  year: 1972,
  genres: ["Drama", "Crime"],
  runtime: "2h 55m",
  rating: 5.0,
  totalRatings: 2,
  tagline: '"An offer you can\'t refuse."',
  overview:
    "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
  poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  backdrop: "https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
  cast: [
    { name: "Marlon Brando", role: "Don Vito Corleone", img: "https://image.tmdb.org/t/p/w185/fuTEPMsBtV1zE98ujPONbKiYDc2.jpg" },
    { name: "Al Pacino", role: "Michael Corleone", img: "https://image.tmdb.org/t/p/w185/2dGBb1fOcNdZXQWNfCuVLbvDIIo.jpg" },
    { name: "James Caan", role: "Sonny Corleone", img: "https://image.tmdb.org/t/p/w185/v3flJtQEyczxENi29yFMNjKYsXW.jpg" },
    { name: "Robert Duvall", role: "Tom Hagen", img: "https://image.tmdb.org/t/p/w185/ybMrK3IMSASRhiMq3bCb3VuAjVi.jpg" },
    { name: "Richard Castellano", role: "Clemenza", img: "https://image.tmdb.org/t/p/w185/1vr18MxhCcjbnMgFBZmOWGFGBST.jpg" },
  ],
  crew: {
    director: "Francis Ford Coppola",
    writers: "Mario Puzo, Francis Ford Coppola",
    cinematography: "Gordon Willis",
    music: "Nino Rota",
  },
  details: {
    runtime: "2h 55m",
    releaseDate: "March 13, 1972",
    studio: "Paramount Pictures",
    budget: "$6,000,000",
    boxOffice: "$245,066,411",
  },
};

const discussions = [
  {
    id: 1,
    user: "Tiger Pride",
    date: "WED, DEC 10",
    messages: [
      { id: 1, text: "This is the best movie of all time. There is no debate here", sender: "other", time: "3:42 PM" },
    ],
  },
  {
    id: 2,
    date: "YESTERDAY",
    messages: [
      { id: 2, text: "Test message", sender: "me", time: "5:18 PM" },
    ],
  },
];

const collectiveRatings = [
  { name: "You", rating: 5, avatar: "https://i.pravatar.cc/80?img=11" },
  { name: "Dan Gunko", rating: 5, avatar: "https://i.pravatar.cc/80?img=12" },
];

function StarRating({ rating, max = 5, size = 18, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={(interactive ? (hover || rating) : rating) > i ? "#D4753E" : "none"}
          stroke={(interactive ? (hover || rating) : rating) > i ? "#D4753E" : "#555"}
          strokeWidth={2}
          style={{ cursor: interactive ? "pointer" : "default", transition: "all 0.15s" }}
          onMouseEnter={() => interactive && setHover(i + 1)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i + 1)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function CrewCard({ label, value }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "16px 20px",
      flex: "1 1 0",
      minWidth: 180,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#e8e0d8", fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
    </div>
  );
}

export default function FilmDetailsPage() {
  const [activeTab, setActiveTab] = useState("Info");
  const [userRating, setUserRating] = useState(5);
  const [msgInput, setMsgInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Tiger Pride");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0D0B09",
      color: "#e8e0d8",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      {/* Hero Backdrop */}
      <div style={{ position: "relative", width: "100%", height: 420, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${movie.backdrop})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "brightness(0.35) saturate(0.6)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #0D0B09 0%, transparent 50%, rgba(13,11,9,0.3) 100%)",
        }} />
        {/* Top nav */}
        <div style={{
          position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "24px 48px",
        }}>
          <button style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#e8e0d8", backdropFilter: "blur(12px)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <button style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#e8e0d8", backdropFilter: "blur(12px)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", marginTop: -200, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>

          {/* Left Column - Poster + Actions */}
          <div style={{ flexShrink: 0, width: 280 }}>
            <div style={{
              width: 280, aspectRatio: "2/3", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1510, #2a1f15)'; }}
              />
            </div>

            {/* Your Rating */}
            <div style={{
              marginTop: 28, padding: "24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888", textTransform: "uppercase", marginBottom: 16 }}>Your Rating</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <StarRating rating={userRating} size={32} interactive onChange={setUserRating} />
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 10 }}>Tap a star to update</div>
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button style={{
                flex: 1, padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "#e8e0d8", cursor: "pointer",
                fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Add to list
              </button>
              <button style={{
                flex: 1, padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "#e8e0d8", cursor: "pointer",
                fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                Share
              </button>
            </div>
          </div>

          {/* Right Column - Details */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 20 }}>
            {/* Title Area */}
            <div style={{ marginBottom: 8 }}>
              <h1 style={{
                fontSize: 48, fontWeight: 700, margin: 0, lineHeight: 1.1,
                fontFamily: "'Playfair Display', serif", color: "#fff",
                letterSpacing: "-0.01em",
              }}>
                {movie.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <span style={{ color: "#999", fontSize: 15 }}>{movie.year}</span>
                <span style={{ color: "#333" }}>•</span>
                <span style={{ color: "#999", fontSize: 15 }}>{movie.genres.join(", ")}</span>
                <span style={{ color: "#333" }}>•</span>
                <span style={{ color: "#999", fontSize: 15 }}>{movie.runtime}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <StarRating rating={movie.rating} size={16} />
                <span style={{ color: "#D4753E", fontWeight: 600, fontSize: 15 }}>{movie.rating.toFixed(1)}</span>
                <span style={{ color: "#666", fontSize: 14 }}>· {movie.totalRatings} ratings</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", gap: 0, marginTop: 32, borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none", border: "none", color: activeTab === tab ? "#D4753E" : "#777",
                    fontSize: 15, fontWeight: 500, padding: "14px 28px", cursor: "pointer",
                    borderBottom: activeTab === tab ? "2px solid #D4753E" : "2px solid transparent",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {tab === "Discussion" && (
                    <span style={{
                      background: activeTab === tab ? "#D4753E" : "#444",
                      color: "#fff", fontSize: 11, fontWeight: 600,
                      borderRadius: 10, padding: "2px 7px", lineHeight: "16px",
                    }}>3</span>
                  )}
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ marginTop: 32, paddingBottom: 64 }}>

              {/* INFO TAB */}
              {activeTab === "Info" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {/* Tagline */}
                  <p style={{
                    fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                    fontSize: 20, color: "#b8a898", marginBottom: 32, marginTop: 0,
                  }}>
                    {movie.tagline}
                  </p>

                  {/* Overview */}
                  <div style={{ marginBottom: 40 }}>
                    <h3 style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                      textTransform: "uppercase", marginBottom: 14, marginTop: 0,
                    }}>Overview</h3>
                    <p style={{ fontSize: 16, lineHeight: 1.7, color: "#c4bab0", margin: 0, maxWidth: 680 }}>
                      {movie.overview}
                    </p>
                  </div>

                  {/* Cast */}
                  <div style={{ marginBottom: 40 }}>
                    <h3 style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                      textTransform: "uppercase", marginBottom: 20, marginTop: 0,
                    }}>Cast</h3>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {movie.cast.map((person) => (
                        <div key={person.name} style={{ textAlign: "center", width: 100 }}>
                          <div style={{
                            width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
                            margin: "0 auto 10px", border: "2px solid rgba(255,255,255,0.08)",
                            background: "#1a1510",
                          }}>
                            <img src={person.img} alt={person.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e0d8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
                          <div style={{ fontSize: 12, color: "#777", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crew */}
                  <div style={{ marginBottom: 40 }}>
                    <h3 style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                      textTransform: "uppercase", marginBottom: 16, marginTop: 0,
                    }}>Crew</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <CrewCard label="Director" value={movie.crew.director} />
                      <CrewCard label="Writers" value={movie.crew.writers} />
                      <CrewCard label="Cinematography" value={movie.crew.cinematography} />
                      <CrewCard label="Music" value={movie.crew.music} />
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                      textTransform: "uppercase", marginBottom: 16, marginTop: 0,
                    }}>Details</h3>
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16, overflow: "hidden",
                    }}>
                      {Object.entries(movie.details).map(([key, val], i) => (
                        <div key={key} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "16px 24px",
                          borderBottom: i < Object.entries(movie.details).length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}>
                          <span style={{ fontSize: 14, color: "#999", textTransform: "capitalize" }}>
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e0d8" }}>{val}</span>
                        </div>
                      ))}
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "16px 24px",
                      }}>
                        <span style={{ fontSize: 14, color: "#999" }}>Genres</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {movie.genres.map(g => (
                            <span key={g} style={{
                              fontSize: 13, color: "#e8e0d8", padding: "4px 14px",
                              borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                            }}>{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DISCUSSION TAB */}
              {activeTab === "Discussion" && (
                <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 640 }}>
                  {/* Group Selector */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, marginBottom: 32, cursor: "pointer",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4753E" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{selectedGroup}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>

                  {/* Messages */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {discussions.map((group) => (
                      <div key={group.id}>
                        <div style={{
                          textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                          color: "#666", marginBottom: 16, textTransform: "uppercase",
                        }}>{group.date}</div>
                        {group.messages.map((msg) => (
                          <div key={msg.id} style={{
                            display: "flex", justifyContent: msg.sender === "me" ? "flex-end" : "flex-start",
                          }}>
                            <div style={{
                              maxWidth: "75%", padding: "14px 20px", borderRadius: 18,
                              background: msg.sender === "me"
                                ? "linear-gradient(135deg, #D4753E, #b8612e)"
                                : "rgba(255,255,255,0.06)",
                              color: msg.sender === "me" ? "#fff" : "#e8e0d8",
                              fontSize: 15, lineHeight: 1.5,
                              borderBottomRightRadius: msg.sender === "me" ? 6 : 18,
                              borderBottomLeftRadius: msg.sender === "me" ? 18 : 6,
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginTop: 32,
                    padding: "12px 16px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28,
                  }}>
                    <button style={{
                      background: "none", border: "none", cursor: "pointer", padding: 4,
                      color: "#888", display: "flex",
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                    </button>
                    <input
                      type="text"
                      placeholder="Discuss this film..."
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      style={{
                        flex: 1, background: "none", border: "none", outline: "none",
                        color: "#e8e0d8", fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                    <button style={{
                      background: msgInput ? "#D4753E" : "rgba(255,255,255,0.06)",
                      border: "none", borderRadius: "50%", width: 36, height: 36,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: msgInput ? "pointer" : "default",
                      transition: "all 0.2s", color: "#fff",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* RATINGS TAB */}
              {activeTab === "Ratings" && (
                <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 640 }}>
                  {/* Collective Ratings */}
                  <h3 style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                    textTransform: "uppercase", marginBottom: 20, marginTop: 0,
                  }}>Ratings from your Collectives</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
                    {collectiveRatings.map((person) => (
                      <div key={person.name} style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "18px 24px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 16,
                      }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
                          border: "2px solid rgba(255,255,255,0.08)", background: "#1a1510", flexShrink: 0,
                        }}>
                          <img src={person.avatar} alt={person.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{person.name}</div>
                          <StarRating rating={person.rating} size={14} />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#D4753E" }}>{person.rating}</div>
                      </div>
                    ))}
                  </div>

                  {/* Community Stats */}
                  <h3 style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#888",
                    textTransform: "uppercase", marginBottom: 16, marginTop: 0,
                  }}>Community Stats</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16, padding: "28px 24px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 12 }}>Average</div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
                        <span style={{ fontSize: 44, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{movie.rating.toFixed(1)}</span>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#D4753E" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                    </div>
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16, padding: "28px 24px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase", marginBottom: 12 }}>Total Ratings</div>
                      <span style={{ fontSize: 44, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{movie.totalRatings}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::placeholder { color: #666; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
