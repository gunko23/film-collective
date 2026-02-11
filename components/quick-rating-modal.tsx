"use client"

import { useState, useRef, useCallback, useId, useEffect } from "react"
import { createPortal } from "react-dom"
import { colors } from "@/lib/design-tokens"
import { getImageUrl } from "@/lib/tmdb/image"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

interface QuickRatingModalProps {
  isOpen: boolean
  onClose: () => void
  movieTitle: string
  tmdbId: number
  moviePoster: string | null
  onRated: () => void
}

export function QuickRatingModal({
  isOpen,
  onClose,
  movieTitle,
  tmdbId,
  moviePoster,
  onRated,
}: QuickRatingModalProps) {
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [step, setStep] = useState<"rate" | "success">("rate")

  const ratingContainerRef = useRef<HTMLDivElement>(null)
  const isTouchRef = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const ratingBaseId = useId()

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUserRating(0)
      setHoverRating(0)
      setReview("")
      setIsSaving(false)
      setSaveError("")
      setStep("rate")
    }
  }, [isOpen])

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  async function handleSubmit() {
    if (userRating === 0 || isSaving) return
    setIsSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          score: userRating,
          comment: review.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save rating")
      }
      setStep("success")
      onRated()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  function handleSkip() {
    onRated()
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <>
      <style>{`
        @keyframes quick-rate-fade-in {
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
          animation: "quick-rate-fade-in 0.2s ease",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleSkip()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rate Film"
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
          {/* Header */}
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
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: colors.cream, margin: 0 }}>
              {step === "success" ? "Done" : "Rate Film"}
            </h2>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
              }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "20px" }}>
            {step === "rate" && (
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
                    {moviePoster ? (
                      <img
                        src={getImageUrl(moviePoster, "w185") ?? ""}
                        alt={movieTitle}
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
                      {movieTitle}
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
                    {[1, 2, 3, 4, 5].map((star) => (
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
                          transition: "all 0.15s ease",
                        }}
                      >
                        <RatingStar
                          fill={getStarFill(star, displayRating)}
                          size={36}
                          filledColor={colors.accent}
                          emptyColor={`${colors.cream}20`}
                          uid={`quick-rate-${ratingBaseId}-${star}`}
                        />
                      </button>
                    ))}
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

                {/* Review */}
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

                {/* Error */}
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

                {/* Actions */}
                <div style={{ paddingTop: "20px", display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={handleSkip}
                    style={{
                      flex: 1,
                      padding: "16px",
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "12px",
                      color: colors.textTertiary,
                      fontSize: "16px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={userRating === 0 || isSaving}
                    style={{
                      flex: 1,
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
                    {isSaving ? "Saving..." : userRating > 0 ? "Save Rating" : "Rate to continue"}
                  </button>
                </div>
              </>
            )}

            {/* Success */}
            {step === "success" && (
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
                  Rating Saved
                </p>
                <p style={{ fontSize: "14px", color: colors.textTertiary }}>
                  {movieTitle} — {userRating} out of 5
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RatingStar
                      key={star}
                      fill={getStarFill(star, userRating)}
                      size={24}
                      filledColor={colors.accent}
                      emptyColor={`${colors.cream}20`}
                      uid={`quick-success-${ratingBaseId}-${star}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
