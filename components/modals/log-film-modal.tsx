"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getImageUrl } from "@/lib/tmdb/image"
import { colors } from "@/lib/design-tokens"
import { SearchResultRow } from "@/components/modals/search-result-row"
import { QuickAddCard } from "@/components/modals/quick-add-card"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Film = {
  tmdbId: number
  title: string
  releaseDate?: string
  posterPath?: string | null
  director?: string
  userRating?: number // 0-5 if already rated
}

type LogFilmModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  recentFilms?: Film[]
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs matching design reference)
// ---------------------------------------------------------------------------

function SearchIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BackIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M19 12H5M12 19L5 12L12 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractYear(dateString?: string): string {
  if (!dateString) return ""
  return dateString.substring(0, 4)
}

function resolveWatchedDate(value: "today" | "yesterday" | "other"): string {
  const now = new Date()
  if (value === "today") return now.toISOString().split("T")[0]
  if (value === "yesterday") {
    now.setDate(now.getDate() - 1)
    return now.toISOString().split("T")[0]
  }
  return ""
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LogFilmModal({ isOpen, onClose, onSuccess, recentFilms }: LogFilmModalProps) {
  const [step, setStep] = useState<"search" | "rate" | "success">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Film[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [trendingFilms, setTrendingFilms] = useState<Film[]>([])
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [watchedDate, setWatchedDate] = useState<"today" | "yesterday" | "other">("today")
  const [review, setReview] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Map of tmdbId -> { score, comment } for films the user has already rated
  const [ratedFilms, setRatedFilms] = useState<Map<number, { score: number; comment: string }>>(new Map())

  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ratingContainerRef = useRef<HTMLDivElement>(null)
  const isTouchRef = useRef(false)

  const displayRating = hoverRating || userRating

  const getStarFromTouch = useCallback((clientX: number) => {
    const container = ratingContainerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const raw = (x / rect.width) * 5
    const snapped = Math.round(raw * 2) / 2
    return Math.max(0.5, Math.min(5, snapped))
  }, [])

  // ---- Fetch user's existing ratings + trending films on open ----------------

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function fetchRated() {
      try {
        const res = await fetch("/api/user/ratings")
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const map = new Map<number, { score: number; comment: string }>()
        for (const r of data.ratings ?? []) {
          // overallScore is 0-100, convert to 0-5
          const score = r.overallScore != null ? r.overallScore / 20 : 0
          const tmdbId = r.movie?.tmdbId
          if (tmdbId != null) map.set(tmdbId, { score, comment: r.userComment || "" })
        }
        setRatedFilms(map)
      } catch {
        // ignore
      }
    }

    async function fetchTrending() {
      try {
        const res = await fetch("/api/tmdb/search")
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const all: Film[] = (data.results ?? []).map((r: Record<string, unknown>) => ({
          tmdbId: r.tmdbId as number,
          title: r.title as string,
          releaseDate: r.releaseDate as string | undefined,
          posterPath: r.posterPath as string | null | undefined,
        }))
        // Pick 3 random films from the top results
        const shuffled = all.sort(() => Math.random() - 0.5)
        setTrendingFilms(shuffled.slice(0, 3))
      } catch {
        // ignore
      }
    }

    fetchRated()
    fetchTrending()
    return () => { cancelled = true }
  }, [isOpen])

  // ---- Search with debounce -----------------------------------------------

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      const films: Film[] = (data.results ?? []).slice(0, 8).map((r: Record<string, unknown>) => ({
        tmdbId: r.tmdbId as number,
        title: r.title as string,
        releaseDate: r.releaseDate as string | undefined,
        posterPath: r.posterPath as string | null | undefined,
      }))
      setSearchResults(films)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(searchQuery), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, performSearch])

  // ---- Reset state on open/close ------------------------------------------

  useEffect(() => {
    if (isOpen) {
      setStep("search")
      setSearchQuery("")
      setSearchResults([])
      setSelectedFilm(null)
      setUserRating(0)
      setHoverRating(0)
      setIsEditing(false)
      setWatchedDate("today")
      setReview("")
      setIsSaving(false)
      setSaveError("")
      // autofocus search input after mount
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [isOpen])

  // ---- Lock body scroll while modal is open --------------------------------

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  // ---- Keyboard / focus trap ----------------------------------------------

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
        return
      }

      // Simple focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // ---- Handlers -----------------------------------------------------------

  function handleSelectFilm(film: Film) {
    setSelectedFilm(film)
    const existing = ratedFilms.get(film.tmdbId)
    if (existing != null && existing.score > 0) {
      setUserRating(Math.round(existing.score))
      setReview(existing.comment)
      setIsEditing(true)
    } else {
      setUserRating(0)
      setReview("")
      setIsEditing(false)
    }
    setStep("rate")
  }

  function handleBack() {
    setStep("search")
    setSelectedFilm(null)
    setUserRating(0)
    setHoverRating(0)
    setIsEditing(false)
    setReview("")
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  async function handleSubmit() {
    if (!selectedFilm || userRating === 0 || isSaving) return
    setIsSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: selectedFilm.tmdbId,
          score: userRating,
          comment: review.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save rating")
      }
      // Update local rated films map so the search results reflect the new rating
      setRatedFilms((prev) => {
        const next = new Map(prev)
        next.set(selectedFilm.tmdbId, { score: userRating, comment: review.trim() })
        return next
      })
      setStep("success")
      onSuccess?.()
      // Auto-close after showing confirmation
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  // ---- Render nothing when closed -----------------------------------------

  if (!isOpen) return null

  // ---- Markup -------------------------------------------------------------

  return (
    <>
      {/* Modal overlay — single scrollable layer, no flex tricks */}
      <style>{`
        @keyframes log-film-modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        ref={modalRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.8)",
          WebkitOverflowScrolling: "touch",
          overflowY: "scroll",
          overscrollBehavior: "contain",
          WebkitBackdropFilter: "blur(4px)",
          backdropFilter: "blur(4px)",
          animation: "log-film-modal-fade-in 0.2s ease",
        }}
        onClick={(e) => {
          // Close only when clicking the backdrop area, not the modal card
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* Modal card — horizontally centered, safe bottom padding */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={step === "search" ? "Log a Film" : step === "success" ? "Rating saved" : isEditing ? "Edit Rating" : "Rate Film"}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "480px",
            margin: "20px auto",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: colors.bg,
            borderRadius: "20px",
            border: `1px solid ${colors.borderLight}`,
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* ============ Header ============ */}
          <div
            style={{
              padding: "20px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
              borderRadius: "20px 20px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {step === "rate" && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                >
                  <BackIcon color={colors.cream} size={22} />
                </button>
              )}
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.cream, margin: 0 }}>
                {step === "search" ? "Log a Film" : step === "success" ? "Done" : isEditing ? "Edit Rating" : "Rate Film"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
              }}
            >
              <CloseIcon color={colors.textMuted} size={22} />
            </button>
          </div>

          {/* ============ Content ============ */}
          <div
            style={{ padding: "20px" }}
          >
            {/* ---------- Step: Search ---------- */}
            {step === "search" && (
              <>
                {/* Search input */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    backgroundColor: colors.surface,
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                    marginBottom: "24px",
                  }}
                >
                  <SearchIcon color={colors.textMuted} size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for a film..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "16px",
                      color: colors.cream,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Search results */}
                {searchQuery.length > 1 && (
                  <div style={{ marginBottom: "24px" }}>
                    <p
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: colors.textMuted,
                        marginBottom: "12px",
                      }}
                    >
                      Results
                    </p>

                    {isSearching ? (
                      <p
                        style={{
                          fontSize: "14px",
                          color: colors.textMuted,
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        Searching...
                      </p>
                    ) : searchResults.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {searchResults.map((film) => (
                          <SearchResultRow
                            key={film.tmdbId}
                            film={film}
                            existingRating={ratedFilms.get(film.tmdbId)?.score}
                            onSelect={handleSelectFilm}
                          />
                        ))}
                      </div>
                    ) : (
                      <p
                        style={{
                          fontSize: "14px",
                          color: colors.textMuted,
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        No films found
                      </p>
                    )}
                  </div>
                )}

                {/* Trending / Quick Add */}
                {searchQuery.length < 2 && trendingFilms.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: colors.textMuted,
                        marginBottom: "12px",
                      }}
                    >
                      Trending Now
                    </p>

                    <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                      {trendingFilms.map((film) => (
                        <QuickAddCard
                          key={film.tmdbId}
                          film={film}
                          existingRating={ratedFilms.get(film.tmdbId)?.score}
                          onSelect={handleSelectFilm}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Help text */}
                {searchQuery.length < 2 && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: colors.surface,
                      borderRadius: "12px",
                      border: `1px dashed ${colors.borderLight}`,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "14px", color: colors.textTertiary }}>
                      Can't find a film? Try searching by director or year.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ---------- Step: Rate ---------- */}
            {step === "rate" && selectedFilm && (
              <>
                {/* Selected film card */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "28px",
                    padding: "16px",
                    backgroundColor: colors.surface,
                    borderRadius: "14px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "100px",
                      borderRadius: "8px",
                      flexShrink: 0,
                      overflow: "hidden",
                      backgroundColor: colors.surfaceLight,
                    }}
                  >
                    {selectedFilm.posterPath ? (
                      <img
                        src={getImageUrl(selectedFilm.posterPath, "w185") ?? ""}
                        alt={selectedFilm.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: `linear-gradient(135deg, ${colors.accent}60, ${colors.cool}30)`,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: colors.cream,
                        marginBottom: "4px",
                      }}
                    >
                      {selectedFilm.title}
                    </p>
                    <p style={{ fontSize: "14px", color: colors.textTertiary }}>
                      {extractYear(selectedFilm.releaseDate)}
                      {selectedFilm.director && ` \u00b7 ${selectedFilm.director}`}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: "28px" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: colors.textMuted,
                      marginBottom: "16px",
                      textAlign: "center",
                    }}
                  >
                    Your Rating
                  </p>

                  <div
                    ref={ratingContainerRef}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "8px",
                      touchAction: "none",
                      userSelect: "none",
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      isTouchRef.current = true
                      const val = getStarFromTouch(e.touches[0].clientX)
                      if (val !== null) setHoverRating(val)
                    }}
                    onTouchMove={(e) => {
                      const val = getStarFromTouch(e.touches[0].clientX)
                      if (val !== null) setHoverRating(val)
                    }}
                    onTouchEnd={(e) => {
                      const touch = e.changedTouches[0]
                      const val = getStarFromTouch(touch.clientX)
                      if (val !== null) setUserRating(val)
                      setHoverRating(0)
                      setTimeout(() => { isTouchRef.current = false }, 300)
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = displayRating >= star
                      const isHalf = !isFull && displayRating >= star - 0.5
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={(e) => {
                            if (isTouchRef.current) return
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            setUserRating(isLeftHalf ? star - 0.5 : star)
                          }}
                          onMouseMove={(e) => {
                            if (isTouchRef.current) return
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            setHoverRating(isLeftHalf ? star - 0.5 : star)
                          }}
                          onMouseLeave={() => {
                            if (isTouchRef.current) return
                            setHoverRating(0)
                          }}
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            fontSize: "36px",
                            lineHeight: 1,
                            color: isFull ? colors.accent : `${colors.cream}20`,
                            transform: isFull ? "scale(1.1)" : "scale(1)",
                            transition: "all 0.15s ease",
                            position: "relative" as const,
                          }}
                        >
                          ★
                          {isHalf && (
                            <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: "50%", color: colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>★</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "14px",
                      color: colors.textTertiary,
                    }}
                  >
                    {userRating > 0 ? `${userRating} out of 5` : "Tap to rate"}
                  </p>
                </div>

                {/* When did you watch? */}
                <div style={{ marginBottom: "28px" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: colors.textMuted,
                      marginBottom: "12px",
                    }}
                  >
                    When did you watch?
                  </p>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {(
                      [
                        { id: "today", label: "Today" },
                        { id: "yesterday", label: "Yesterday" },
                        { id: "other", label: "Other" },
                      ] as const
                    ).map((option) => {
                      const isSelected = watchedDate === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setWatchedDate(option.id)}
                          style={{
                            flex: 1,
                            padding: "12px",
                            backgroundColor: isSelected
                              ? `${colors.accent}15`
                              : colors.surface,
                            border: `1px solid ${isSelected ? colors.accent + "40" : colors.border}`,
                            borderRadius: "10px",
                            cursor: "pointer",
                            color: isSelected ? colors.cream : colors.textTertiary,
                            fontSize: "14px",
                            fontWeight: isSelected ? 500 : 400,
                            transition: "all 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: colors.textMuted,
                      marginBottom: "12px",
                    }}
                  >
                    Leave a Review{" "}
                    <span style={{ color: colors.textSubtle }}>(optional)</span>
                  </p>

                  <textarea
                    placeholder="What did you think?"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "14px",
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "12px",
                      color: colors.cream,
                      fontSize: "14px",
                      lineHeight: 1.5,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Error message */}
                {saveError && (
                  <p style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#f87171",
                    textAlign: "center",
                  }}>
                    {saveError}
                  </p>
                )}

                {/* Submit button */}
                <div style={{ paddingTop: "20px" }}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={userRating === 0 || isSaving}
                    style={{
                      width: "100%",
                      padding: "16px",
                      backgroundColor: userRating > 0 && !isSaving ? colors.accent : colors.surfaceLight,
                      border: "none",
                      borderRadius: "12px",
                      color: userRating > 0 && !isSaving ? colors.bg : colors.textMuted,
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: userRating > 0 && !isSaving ? "pointer" : "not-allowed",
                      opacity: isSaving ? 0.7 : 1,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    {isSaving
                      ? "Saving..."
                      : userRating > 0
                        ? (isEditing ? "Update Rating" : "Save Rating")
                        : "Rate to continue"}
                  </button>
                </div>
              </>
            )}

            {/* ---------- Step: Success ---------- */}
            {step === "success" && selectedFilm && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px",
                textAlign: "center",
              }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: `${colors.accent}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke={colors.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: colors.cream,
                  marginBottom: "8px",
                }}>
                  {isEditing ? "Rating Updated" : "Rating Saved"}
                </p>
                <p style={{ fontSize: "14px", color: colors.textTertiary }}>
                  {selectedFilm.title} — {userRating} out of 5
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = userRating >= star
                    const isHalf = !isFull && userRating >= star - 0.5
                    return (
                      <span
                        key={star}
                        style={{
                          fontSize: "24px",
                          color: isFull ? colors.accent : `${colors.cream}20`,
                          position: "relative" as const,
                        }}
                      >
                        ★
                        {isHalf && (
                          <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: "50%", color: colors.accent }}>★</span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default LogFilmModal
