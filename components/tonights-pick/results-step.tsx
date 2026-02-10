"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
  onShuffle?: () => void
}

export function ResultsStep({ results, members, collectiveId, onLockInComplete, onShuffle }: Props) {
  const [lockedTmdbId, setLockedTmdbId] = useState<number | null>(null)
  const [pendingMovie, setPendingMovie] = useState<MovieRecommendation | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successTitle, setSuccessTitle] = useState("")
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())
  const [undoMovie, setUndoMovie] = useState<MovieRecommendation | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const handleNotInterested = useCallback((movie: MovieRecommendation) => {
    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)

    setDismissedIds(prev => new Set(prev).add(movie.tmdbId))
    setUndoMovie(movie)

    // POST to API
    fetch("/api/dismissed-movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: movie.tmdbId, source: "recommendation" }),
    }).catch(err => console.error("Failed to dismiss movie:", err))

    // Start 5s undo timer
    undoTimerRef.current = setTimeout(() => {
      setUndoMovie(null)
      undoTimerRef.current = null
    }, 5000)
  }, [])

  const handleUndo = useCallback(() => {
    if (!undoMovie) return
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }

    const movieId = undoMovie.tmdbId
    setDismissedIds(prev => {
      const next = new Set(prev)
      next.delete(movieId)
      return next
    })
    setUndoMovie(null)

    // DELETE from API
    fetch(`/api/dismissed-movies/${movieId}`, { method: "DELETE" })
      .catch(err => console.error("Failed to undo dismissal:", err))
  }, [undoMovie])

  const visibleMovies = results.recommendations.filter(m => !dismissedIds.has(m.tmdbId))

  const handleLockIn = useCallback((movie: MovieRecommendation) => {
    setPendingMovie(movie)
  }, [])

  const handleConfirm = useCallback(async (scheduledFor: string) => {
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
          scheduledFor,
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
      ) : visibleMovies.length === 0 ? (
        /* All movies dismissed empty state */
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: "#ece6da",
              margin: "0 0 8px",
              fontFamily: SERIF,
            }}
          >
            No picks left
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#8a7e70",
              margin: "0 0 20px",
              fontFamily: SANS,
            }}
          >
            You dismissed all recommendations
          </p>
          {onShuffle && (
            <button
              onClick={onShuffle}
              style={{
                background: "none",
                border: "1px solid #3a3430",
                borderRadius: 8,
                padding: "10px 20px",
                color: "#d4a050",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SANS,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a050" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3430" }}
            >
              Shuffle for new picks
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {results.recommendations.map((movie) => {
            const isDismissed = dismissedIds.has(movie.tmdbId)
            const visibleIndex = visibleMovies.indexOf(movie)
            return (
              <div
                key={movie.tmdbId}
                style={{
                  opacity: isDismissed ? 0 : 1,
                  maxHeight: isDismissed ? 0 : 2000,
                  marginBottom: isDismissed ? -14 : 0,
                  overflow: "hidden",
                  transition: "opacity 0.3s ease, max-height 0.3s ease, margin-bottom 0.3s ease",
                }}
              >
                <RecommendationCard
                  movie={movie}
                  index={visibleIndex >= 0 ? visibleIndex : 0}
                  isLocked={lockedTmdbId === movie.tmdbId}
                  isFaded={lockedTmdbId !== null && lockedTmdbId !== movie.tmdbId}
                  onLockIn={() => handleLockIn(movie)}
                  onNotInterested={() => handleNotInterested(movie)}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Dismiss undo toast */}
      {undoMovie && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px",
            background: "#1a1816",
            borderTop: "1px solid #2a2420",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 13, color: "#8a7e70", fontFamily: SANS }}>
            Removed from recommendations
          </span>
          <button
            onClick={handleUndo}
            style={{
              background: "none",
              border: "none",
              color: "#d4a050",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: SANS,
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            Undo
          </button>
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
