import { RecommendationCard } from "./recommendation-card"
import type { TonightPickResponse } from "./types"

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', sans-serif"

function GenreTag({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        color: "#5aaa8a",
        border: "1px solid #5aaa8a44",
        borderRadius: 14,
        padding: "4px 12px",
        fontFamily: SANS,
        fontWeight: 500,
        background: "#5aaa8a0a",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  )
}

export function ResultsStep({ results, reasoningLoading }: { results: TonightPickResponse; reasoningLoading?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Recommendations header card */}
      <div
        style={{
          background: "#141210",
          borderRadius: 10,
          border: "1px solid #2a2420",
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
              fontFamily: SERIF,
            }}
          >
            Recommendations for{" "}
            <span style={{ color: "#ece6da" }}>
              {results.groupProfile.memberCount} member
              {results.groupProfile.memberCount !== 1 ? "s" : ""}
            </span>
          </span>
        </div>
        {results.groupProfile.sharedGenres.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                color: "#5a554e",
                fontFamily: SANS,
                marginRight: 2,
              }}
            >
              Shared favorites:
            </span>
            {results.groupProfile.sharedGenres.map((genre) => (
              <GenreTag key={genre.genreId} label={genre.genreName} />
            ))}
          </div>
        )}
      </div>

      {/* Recommendations List */}
      {results.recommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ margin: "0 auto 16px", width: 48 }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5a554e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: "#ece6da",
              margin: "0 0 8px",
              fontFamily: SERIF,
            }}
          >
            No recommendations found
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#8a7e70",
              margin: 0,
              fontFamily: SANS,
            }}
          >
            Try adjusting your mood or runtime preferences
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {results.recommendations.map((movie, index) => (
            <RecommendationCard key={movie.tmdbId} movie={movie} index={index} reasoningLoading={reasoningLoading} />
          ))}
        </div>
      )}
    </div>
  )
}
