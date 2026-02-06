import { useState } from "react";

// ── Sample data to demo the cards ──
const sampleMovies = [
  {
    tmdbId: 1,
    title: "The Intouchables",
    releaseDate: "2011-11-02",
    voteAverage: 8.3,
    groupFitScore: 87,
    posterPath: "https://image.tmdb.org/t/p/w342/323BP0itpBCvmOpBHnAJ7KBoCQi.jpg",
    genres: [{ id: 18, name: "Drama" }, { id: 35, name: "Comedy" }],
    runtime: 112,
    reasoning: [
      "A character study built on contrasting personalities and emotional authenticity similar to what made you love The Lives of Others. The naturalistic performances and warmth echo the same understated humanity your group rated highest in Green Book and The Grand Budapest Hotel."
    ],
    seenBy: ["Sarah"],
    parentalGuide: {
      violence: "Mild",
      sexNudity: "Mild",
      profanity: "Moderate",
      alcoholDrugsSmoking: "Moderate",
      frighteningIntense: "Mild",
    },
  },
  {
    tmdbId: 2,
    title: "KPop Demon Hunters",
    releaseDate: "2025-03-14",
    voteAverage: 8.1,
    groupFitScore: 72,
    posterPath: "https://image.tmdb.org/t/p/w342/vLJVsfi7CXdOmCTMODJmuVwKlZF.jpg",
    genres: [{ id: 28, name: "Action" }, { id: 16, name: "Animation" }, { id: 35, name: "Comedy" }],
    runtime: 94,
    reasoning: [
      "This blends kinetic action with character-driven storytelling in a way that echoes Spider-Man: Across the Spider-Verse's visual inventiveness. The irreverent humor and high-energy set pieces match the tone your group gravitates toward when you're in the mood for something fun and unpredictable."
    ],
    seenBy: [],
    parentalGuide: {
      violence: "Moderate",
      sexNudity: "None",
      profanity: "Mild",
      alcoholDrugsSmoking: "None",
      frighteningIntense: "Mild",
    },
  },
  {
    tmdbId: 3,
    title: "Moonlight",
    releaseDate: "2016-10-21",
    voteAverage: 7.9,
    groupFitScore: 91,
    posterPath: "https://image.tmdb.org/t/p/w342/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg",
    genres: [{ id: 18, name: "Drama" }],
    runtime: 111,
    reasoning: [
      "Your group consistently rates intimate character studies above 85 — this is one of the finest examples of the form. The triptych structure and poetic visual language share DNA with the atmospheric storytelling you loved in Eternal Sunshine and Lost in Translation."
    ],
    seenBy: ["Mike", "Sarah"],
    parentalGuide: {
      violence: "Moderate",
      sexNudity: "Moderate",
      profanity: "Severe",
      alcoholDrugsSmoking: "Severe",
      frighteningIntense: "Mild",
    },
  },
];

// ── Severity color mapping ──
const severityColor = {
  None: { bg: "rgba(76, 175, 80, 0.12)", text: "#6abf6e", border: "rgba(76, 175, 80, 0.25)" },
  Mild: { bg: "rgba(212, 117, 62, 0.10)", text: "#D4753E", border: "rgba(212, 117, 62, 0.25)" },
  Moderate: { bg: "rgba(255, 183, 77, 0.10)", text: "#ffb74d", border: "rgba(255, 183, 77, 0.25)" },
  Severe: { bg: "rgba(244, 67, 54, 0.10)", text: "#f44336", border: "rgba(244, 67, 54, 0.25)" },
};

const severityIcons = {
  violence: "⚔️",
  sexNudity: "🔞",
  profanity: "🗯",
  alcoholDrugsSmoking: "🍺",
  frighteningIntense: "😰",
};

const severityLabels = {
  violence: "Violence",
  sexNudity: "Sex/Nudity",
  profanity: "Language",
  alcoholDrugsSmoking: "Substances",
  frighteningIntense: "Intense",
};

// ── Fit score ring ──
function FitScoreRing({ score }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#6abf6e" : score >= 60 ? "#D4753E" : "#a09890";

  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(232,224,216,0.08)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color,
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Genre pill ──
function GenrePill({ name }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      color: "#a09890",
      background: "rgba(232,224,216,0.06)",
      border: "1px solid rgba(232,224,216,0.08)",
      letterSpacing: "0.02em",
    }}>
      {name}
    </span>
  );
}

// ── Parental guide badge ──
function ParentalBadge({ category, severity }) {
  if (!severity || severity === "None") return null;
  const colors = severityColor[severity] || severityColor.Mild;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 6,
      background: colors.bg, border: `1px solid ${colors.border}`,
      fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: colors.text,
    }}>
      <span style={{ fontSize: 12 }}>{severityIcons[category]}</span>
      <span style={{ fontWeight: 500 }}>{severityLabels[category]}: {severity}</span>
    </div>
  );
}

// ── Parental guide collapsible ──
function ParentalGuideSection({ guide }) {
  const [open, setOpen] = useState(false);

  if (!guide) return null;

  const categories = ["violence", "sexNudity", "profanity", "alcoholDrugsSmoking", "frighteningIntense"];
  const hasAnyContent = categories.some(c => guide[c] && guide[c] !== "None");

  if (!hasAnyContent) return null;

  // Find the highest severity for the summary label
  const severityRank = { None: 0, Mild: 1, Moderate: 2, Severe: 3 };
  const maxSeverity = categories.reduce((max, cat) => {
    const level = guide[cat] || "None";
    return severityRank[level] > severityRank[max] ? level : max;
  }, "None");
  const summaryColors = severityColor[maxSeverity] || severityColor.Mild;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 0", fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          color: summaryColors.text,
          opacity: 0.85,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "0.85"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4m0 4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
        </svg>
        <span style={{ fontWeight: 500 }}>Parental Guide</span>
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 4,
          background: summaryColors.bg, border: `1px solid ${summaryColors.border}`,
          fontWeight: 600,
        }}>
          Up to {maxSeverity}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8,
          paddingTop: 8, borderTop: "1px solid rgba(232,224,216,0.06)",
          animation: "fadeSlideIn 0.2s ease",
        }}>
          {categories.map(cat => (
            <ParentalBadge key={cat} category={cat} severity={guide[cat]} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Recommendation Card ──
function RecommendationCard({ movie }) {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "";
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const mins = movie.runtime ? movie.runtime % 60 : 0;
  const runtimeStr = movie.runtime ? `${hours}h ${mins}m` : null;
  const reasoningText = movie.reasoning?.[0] || "";

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(30,26,22,0.95) 0%, rgba(20,17,14,0.98) 100%)",
      borderRadius: 14,
      border: "1px solid rgba(232,224,216,0.07)",
      overflow: "hidden",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(212,117,62,0.25)";
      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "rgba(232,224,216,0.07)";
      e.currentTarget.style.boxShadow = "none";
    }}
    >
      {/* ── Header: Poster + Meta ── */}
      <div style={{ display: "flex", gap: 14, padding: 16, paddingBottom: 0 }}>
        {/* Poster */}
        <div style={{
          width: 80, height: 120, borderRadius: 8, overflow: "hidden", flexShrink: 0,
          background: "rgba(232,224,216,0.05)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {movie.posterPath ? (
            <img src={movie.posterPath} alt={movie.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#a09890", fontSize: 11,
              fontFamily: "'DM Sans', sans-serif",
            }}>No Poster</div>
          )}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h3 style={{
              margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.25,
              fontFamily: "'Playfair Display', serif", color: "#e8e0d8",
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {movie.title}
            </h3>
            <FitScoreRing score={movie.groupFitScore} />
          </div>

          {/* Year · Rating · Runtime row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#a09890",
          }}>
            <span>{year}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ color: "#D4753E", fontSize: 13 }}>★</span>
              <span style={{ color: "#e8e0d8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 13 }}>
                {movie.voteAverage?.toFixed(1)}
              </span>
            </span>
            {runtimeStr && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span>{runtimeStr}</span>
              </>
            )}
          </div>

          {/* Genre pills */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
            {movie.genres?.slice(0, 3).map(g => <GenrePill key={g.id} name={g.name} />)}
          </div>
        </div>
      </div>

      {/* ── Reasoning Section ── */}
      <div style={{ padding: "14px 16px 0 16px" }}>
        <div style={{
          position: "relative",
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(212,117,62,0.04)",
          borderLeft: "3px solid rgba(212,117,62,0.35)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#D4753E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span style={{
              fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              color: "#D4753E", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Why we picked this
            </span>
          </div>
          <p style={{
            margin: 0, fontSize: 13.5, lineHeight: 1.55,
            fontFamily: "'DM Sans', sans-serif", color: "#c8c0b8",
          }}>
            {reasoningText}
          </p>
        </div>
      </div>

      {/* ── Seen By ── */}
      {movie.seenBy?.length > 0 && (
        <div style={{
          padding: "8px 16px 0 16px",
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#a09890", opacity: 0.7,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Seen by {movie.seenBy.join(", ")}</span>
        </div>
      )}

      {/* ── Parental Guide (collapsed) ── */}
      <div style={{ padding: "0 16px" }}>
        <ParentalGuideSection guide={movie.parentalGuide} />
      </div>

      {/* ── Footer Actions ── */}
      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8,
        padding: "12px 16px 14px 16px",
      }}>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8,
          background: "rgba(212,117,62,0.12)",
          border: "1px solid rgba(212,117,62,0.2)",
          color: "#D4753E",
          fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(212,117,62,0.2)";
          e.currentTarget.style.borderColor = "rgba(212,117,62,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(212,117,62,0.12)";
          e.currentTarget.style.borderColor = "rgba(212,117,62,0.2)";
        }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  );
}

// ── Full Demo ──
export default function TonightsPickDemo() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0D0B09",
      padding: "32px 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: 480, margin: "0 auto 24px",
        textAlign: "center",
      }}>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          color: "#e8e0d8",
        }}>
          Tonight's Pick
        </h1>
        <p style={{
          margin: "6px 0 0", fontSize: 13, color: "#a09890",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Curated for your collective · 3 results
        </p>
      </div>

      {/* Cards */}
      <div style={{
        maxWidth: 480, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {sampleMovies.map(movie => (
          <RecommendationCard key={movie.tmdbId} movie={movie} />
        ))}
      </div>
    </div>
  );
}
