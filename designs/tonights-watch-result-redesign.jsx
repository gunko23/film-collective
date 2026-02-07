import { useState } from "react";

// ─── MOCK DATA ───
const recommendations = [
  {
    id: 1,
    title: "KPop Demon Hunters",
    year: 2025,
    rating: 8.1,
    metascore: 64,
    poster: "https://image.tmdb.org/t/p/w200/jFyGdzEDwe2pF2gSEctJRnFssHZ.jpg",
    reason:
      "This one's a genuinely fun genre-mashup that channels the stylized action and dark humor you loved in Sin City paired with the kinetic energy of Spider-Man 2's best sequences—K-pop stars wielding supernatural powers gives it a visual flair and self-aware confidence that makes it perfect for your current mood.",
    parentalGuide: "Stylized violence, mild language, brief frightening sequences. Some intense supernatural action scenes. Suitable for teens 13+.",
    pairings: {
      cocktail: {
        name: "Seoul Sunset",
        desc: "Soju and blood orange with a gochugaru rim — sweet heat for a demon-slaying night",
      },
      zeroproof: {
        name: "The Trainee",
        desc: "Sparkling yuzu with butterfly pea flower and a lychee garnish — K-pop pretty",
      },
      snack: {
        name: "Hellfire Tteok",
        desc: "Crispy rice cake bites with gochujang glaze and sesame — spicy, crunchy, addictive",
      },
    },
  },
  {
    id: 2,
    title: "Sing 2",
    year: 2021,
    rating: 7.8,
    metascore: 59,
    poster: "https://image.tmdb.org/t/p/w200/aWeKITRFbbwY8txG5uCj4rMCfSP.jpg",
    reason:
      "Sing 2 captures that same infectious joy and underdog energy—big musical numbers, lovable characters giving everything they've got, and a story about chasing impossible dreams that pairs perfectly with your mood for something uplifting and fun.",
    parentalGuide: "Mild rude humor, some thematic elements. Animated musical suitable for all ages. Brief moments of peril played for comedy.",
    pairings: {
      cocktail: {
        name: "Standing Ovation",
        desc: "Champagne with elderflower and a sugar-rim star — fizzy, celebratory, show-stopping",
      },
      zeroproof: {
        name: "The Encore",
        desc: "Passion fruit spritz with vanilla cream soda and edible glitter — pure joy in a glass",
      },
      snack: {
        name: "Showtime Caramel Corn",
        desc: "Salted caramel popcorn clusters with dark chocolate drizzle and sprinkles",
      },
    },
  },
];

const sharedFavorites = ["Western", "Documentary", "War", "Drama", "History"];

// ─── METASCORE BADGE ───
function MetascoreBadge({ score }) {
  const color =
    score >= 61 ? "#6c3" : score >= 40 ? "#fc3" : "#f33";
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `2px solid ${color}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        color: color,
        fontFamily: "'DM Sans', sans-serif",
        background: `${color}10`,
      }}
    >
      {score}
    </div>
  );
}

// ─── CHALKBOARD CONCESSION ───
function ChalkboardSection({ pairings }) {
  const items = [
    { label: "cocktail", icon: "🍸", ...pairings.cocktail },
    { label: "zero-proof", icon: "🌿", ...pairings.zeroproof },
    { label: "snack", icon: "🧂", ...pairings.snack },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(170deg, #1b2b1b 0%, #162016 50%, #1a271a 100%)",
        borderRadius: 6,
        overflow: "hidden",
        position: "relative",
        boxShadow:
          "inset 0 0 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Wood frame top */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(180deg, #5a3f22, #4a3318)",
          borderBottom: "1px solid #2a1a08",
        }}
      />

      {/* Chalk dust texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.025) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "14px 16px 10px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid #5a7a5a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              color: "#7a9a7a",
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: 3.5,
              color: "#7a9a7a",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
            }}
          >
            Pair with your screening
          </span>
        </div>

        {/* Items */}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "9px 0",
              borderTop: i > 0 ? "1px solid #243024" : "none",
            }}
          >
            <span style={{ fontSize: 15, marginTop: 1, opacity: 0.85 }}>
              {item.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    color: "#e2ddd0",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontStyle: "italic",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: "#5a7a5a",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontFamily: "'DM Sans', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "#7a9a7a",
                  lineHeight: 1.5,
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wood frame bottom */}
      <div
        style={{
          height: 5,
          background: "linear-gradient(180deg, #4a3318, #5a3f22)",
          borderTop: "1px solid #2a1a08",
        }}
      />
    </div>
  );
}

// ─── PARENTAL GUIDE TOGGLE ───
function ParentalGuide({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b6259"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span
          style={{
            fontSize: 11,
            color: "#6b6259",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          Parental Guide
        </span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            background: "#1a1714",
            borderRadius: 6,
            borderLeft: "2px solid #4a3828",
            fontSize: 12,
            color: "#8a7e70",
            lineHeight: 1.6,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// ─── MOVIE CARD ───
function MovieCard({ movie, index }) {
  return (
    <div
      style={{
        background: "linear-gradient(175deg, #181410 0%, #141210 100%)",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        border: "1px solid #2a2420",
        animationDelay: `${index * 120}ms`,
      }}
    >
      {/* Subtle warm glow on left edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "linear-gradient(180deg, #e8843a 0%, #c45a2a 100%)",
          borderRadius: "10px 0 0 10px",
        }}
      />

      {/* Card content */}
      <div style={{ padding: "18px 18px 14px 20px" }}>
        {/* ─ Movie info row ─ */}
        <div style={{ display: "flex", gap: 14 }}>
          {/* Poster */}
          <div
            style={{
              width: 82,
              height: 120,
              borderRadius: 5,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              position: "relative",
            }}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.style.background =
                  "linear-gradient(135deg, #2a2030, #1a1520)";
                e.target.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#4a4050;font-family:sans-serif">${movie.title}</div>`;
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: "#ece6da",
                margin: "0 0 6px 0",
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.2,
              }}
            >
              {movie.title}
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#6b6259",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {movie.year}
              </span>

              {/* Star rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#e8a43a"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#e8a43a",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {movie.rating}
                </span>
              </div>

              <MetascoreBadge score={movie.metascore} />
            </div>
          </div>
        </div>

        {/* ─ Why we picked this ─ */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#e8843a18",
                border: "1.5px solid #e8843a55",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e8843a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2.5,
                color: "#e8843a",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Why we picked this
            </span>
          </div>
          <p
            style={{
              fontSize: 13.5,
              color: "#998e80",
              lineHeight: 1.7,
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {movie.reason}
          </p>
        </div>

        {/* ─ Chalkboard concession ─ */}
        <div style={{ marginTop: 16 }}>
          <ChalkboardSection pairings={movie.pairings} />
        </div>

        {/* ─ Bottom actions ─ */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ParentalGuide text={movie.parentalGuide} />

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1px solid #2a2420",
              borderRadius: 20,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#e8843a55";
              e.currentTarget.style.background = "#e8843a0a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2420";
              e.currentTarget.style.background = "none";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7e70"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span
              style={{
                fontSize: 12,
                color: "#8a7e70",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              View Details
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEPPER ───
function Stepper() {
  const steps = [
    { label: "Who", done: true },
    { label: "Mood", done: true },
    { label: "Results", active: true },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "4px 0 8px",
      }}
    >
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: s.done
                  ? "#e8843a"
                  : s.active
                  ? "#e8843a22"
                  : "#1a1816",
                border: s.active ? "1.5px solid #e8843a" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: s.done ? "#fff" : s.active ? "#e8843a" : "#555",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {s.done ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: s.done || s.active ? "#ccc" : "#555",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 36,
                height: 1.5,
                background: s.done
                  ? "linear-gradient(90deg, #e8843a, #e8843a88)"
                  : "#2a2420",
                margin: "0 10px",
                borderRadius: 1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── GENRE TAG ───
function GenreTag({ label }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        color: "#5aaa8a",
        border: "1px solid #5aaa8a44",
        borderRadius: 14,
        padding: "4px 12px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        background: "#5aaa8a0a",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ─── MAIN PAGE ───
export default function TonightsPickResults() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0c0a",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Phone wrapper */}
      <div
        style={{
          maxWidth: 400,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Top nav */}
        <div style={{ padding: "16px 18px 0" }}>
          <button
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: 0,
              marginBottom: 16,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7e70"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span
              style={{
                fontSize: 13,
                color: "#8a7e70",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              Back to Mood
            </span>
          </button>

          <Stepper />
        </div>

        {/* Content area */}
        <div
          style={{
            padding: "16px 14px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Recommendations header card */}
          <div
            style={{
              background: "#141210",
              borderRadius: 10,
              border: "1px solid #2a2420",
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8a7e70"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span
                style={{
                  fontSize: 14,
                  color: "#b5aa98",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                Recommendations for{" "}
                <span style={{ color: "#ece6da" }}>3 members</span>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#5a554e",
                  fontFamily: "'DM Sans', sans-serif",
                  marginRight: 2,
                }}
              >
                Shared favorites:
              </span>
              {sharedFavorites.map((g) => (
                <GenreTag key={g} label={g} />
              ))}
            </div>
          </div>

          {/* Movie cards */}
          {recommendations.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>

        {/* Fixed bottom bar */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 400,
            padding: "12px 14px",
            background:
              "linear-gradient(180deg, transparent 0%, #0e0c0a 30%)",
            display: "flex",
            gap: 10,
            zIndex: 10,
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 10,
              border: "1px solid #2a2420",
              background: "#141210",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "all 0.2s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7e70"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span
              style={{
                fontSize: 14,
                color: "#8a7e70",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              Back
            </span>
          </button>
          <button
            style={{
              flex: 1.5,
              padding: "14px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #e8843a, #d46a28)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: "0 4px 20px #e8843a33",
              transition: "all 0.2s",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M23 4l-6 6" />
              <path d="M17 4h6v6" />
              <path d="M1 20l6-6" />
              <path d="M7 20H1v-6" />
            </svg>
            <span
              style={{
                fontSize: 14,
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              Shuffle
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
