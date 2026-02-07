import { C, FONT_STACK } from "./constants"
import { IconUsers, IconFilm } from "./icons"
import { RecommendationCard } from "./recommendation-card"
import type { TonightPickResponse } from "./types"

export function ResultsStep({ results }: { results: TonightPickResponse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Group Profile Summary */}
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${C.creamFaint}15`,
          background: C.bgCard,
          padding: "14px 16px",
        }}
      >
        <div className="flex items-center" style={{ gap: 8, marginBottom: 10, fontSize: 13, color: C.creamMuted }}>
          <IconUsers size={16} color={C.creamMuted} />
          <span style={{ fontFamily: FONT_STACK }}>
            Recommendations for {results.groupProfile.memberCount} member
            {results.groupProfile.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
        {results.groupProfile.sharedGenres.length > 0 && (
          <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
            <span style={{ fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
              Shared favorites:
            </span>
            {results.groupProfile.sharedGenres.map((genre) => (
              <span
                key={genre.genreId}
                style={{
                  padding: "3px 10px",
                  borderRadius: 12,
                  background: `${C.teal}15`,
                  color: C.teal,
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                }}
              >
                {genre.genreName}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations List */}
      {results.recommendations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ margin: "0 auto 16px", width: 48 }}>
            <IconFilm size={48} color={C.creamFaint} />
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: C.cream,
              margin: "0 0 8px",
              fontFamily: FONT_STACK,
            }}
          >
            No recommendations found
          </p>
          <p
            style={{
              fontSize: 13,
              color: C.creamMuted,
              margin: 0,
              fontFamily: FONT_STACK,
            }}
          >
            Try adjusting your mood or runtime preferences
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {results.recommendations.map((movie, index) => (
            <RecommendationCard key={movie.tmdbId} movie={movie} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
