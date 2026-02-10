"use client"

import { useState, useCallback } from "react"
import { RecommendationCard } from "./recommendation-card"
import { LockInModal } from "./lock-in-modal"
import { LockInSuccess } from "./lock-in-success"
import { C, getAvatarGradient } from "./constants"
import type { GroupMember, MovieRecommendation, TonightPickResponse } from "./types"

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', sans-serif"

const memberColors = ["#d4753e", "#d4a050", "#6a9fd4", "#82b882", "#a088c0"]

type Props = {
  results: TonightPickResponse
  members?: GroupMember[]
  collectiveId?: string
  onLockInComplete?: () => void
}

export function ResultsStep({ results, members, collectiveId, onLockInComplete }: Props) {
  const [lockedTmdbId, setLockedTmdbId] = useState<number | null>(null)
  const [pendingMovie, setPendingMovie] = useState<MovieRecommendation | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successTitle, setSuccessTitle] = useState("")

  const handleLockIn = useCallback((movie: MovieRecommendation) => {
    setPendingMovie(movie)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!pendingMovie) return
    const movie = pendingMovie
    setPendingMovie(null)
    setSuccessTitle(movie.title)
    setShowSuccess(true)
    setLockedTmdbId(movie.tmdbId)

    // Fire the API call after showing success
    try {
      const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
      await fetch("/api/planned-watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: movie.tmdbId,
          movieTitle: movie.title,
          movieYear: year,
          moviePoster: movie.posterPath,
          collectiveId: collectiveId ?? null,
          participantIds: members?.map((m) => m.userId) ?? [],
          moodTags: null,
        }),
      })
    } catch (err) {
      console.error("Failed to save planned watch:", err)
    }
  }, [pendingMovie, collectiveId, members])

  const handleCancel = useCallback(() => {
    setPendingMovie(null)
  }, [])

  const handleSuccessComplete = useCallback(() => {
    setShowSuccess(false)
    if (onLockInComplete) {
      onLockInComplete()
    }
  }, [onLockInComplete])

  const pendingYear = pendingMovie?.releaseDate
    ? new Date(pendingMovie.releaseDate).getFullYear()
    : ""

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      {/* Recommendations header card */}
      <div
        style={{
          background: "#141210",
          borderRadius: 10,
          border: "1px solid #2a2420",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 18px 18px",
          gap: 10,
        }}>
          {/* Avatar stack */}
          {members && members.length > 0 && (
            <div style={{ display: "flex" }}>
              {members.map((member, i) => {
                const [c1, c2] = getAvatarGradient(member.name)
                return (
                  <div
                    key={member.userId}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: member.avatarUrl
                        ? `url(${member.avatarUrl}) center/cover`
                        : `linear-gradient(135deg, ${c1}cc, ${c2}88)`,
                      border: `2px solid ${C.bg}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.bg,
                      marginLeft: i === 0 ? 0 : -9,
                      zIndex: members.length - i,
                      position: "relative",
                    }}
                  >
                    {!member.avatarUrl && (member.name?.[0] || "?")}
                  </div>
                )
              })}
            </div>
          )}

          {/* Title + member names */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.cream }}>
              Tonight&apos;s Picks
            </div>
            {members && members.length > 0 && (
              <div style={{ fontSize: 12, color: C.creamFaint, marginTop: 3 }}>
                for {members.map(m => m.name).join(", ")}
              </div>
            )}
          </div>

          {/* Small gold accent divider */}
          <div style={{
            width: 32,
            height: 1.5,
            borderRadius: 1,
            background: "linear-gradient(90deg, transparent, #d4a05088, transparent)",
          }} />
        </div>
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
            <RecommendationCard
              key={movie.tmdbId}
              movie={movie}
              index={index}
              isLocked={lockedTmdbId === movie.tmdbId}
              isFaded={lockedTmdbId !== null && lockedTmdbId !== movie.tmdbId}
              onLockIn={() => handleLockIn(movie)}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingMovie && (
        <LockInModal
          movieTitle={pendingMovie.title}
          movieYear={pendingYear}
          participants={members ?? []}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Success Animation */}
      {showSuccess && (
        <LockInSuccess
          movieTitle={successTitle}
          onComplete={handleSuccessComplete}
        />
      )}
    </div>
  )
}
