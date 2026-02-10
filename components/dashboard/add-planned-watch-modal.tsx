"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getImageUrl } from "@/lib/tmdb/image"
import { colors } from "@/lib/design-tokens"
import { SearchResultRow } from "@/components/modals/search-result-row"
import { QuickAddCard } from "@/components/modals/quick-add-card"
import type { Film } from "@/components/modals/log-film-modal"

// ─── Icons ───

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
      <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Helpers ───

function extractYear(dateString?: string): string {
  if (!dateString) return ""
  return dateString.substring(0, 4)
}

const TIMING_OPTIONS = [
  { key: "Tonight", label: "Tonight" },
  { key: "This Week", label: "This Week" },
  { key: "This Weekend", label: "This Weekend" },
] as const

// ─── Component ───

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddPlannedWatchModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"search" | "confirm">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Film[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [trendingFilms, setTrendingFilms] = useState<Film[]>([])
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null)
  const [selectedTiming, setSelectedTiming] = useState("Tonight")
  const [isSaving, setIsSaving] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch trending on open ──

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

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
        const shuffled = all.sort(() => Math.random() - 0.5)
        setTrendingFilms(shuffled.slice(0, 3))
      } catch {
        // ignore
      }
    }

    fetchTrending()
    return () => { cancelled = true }
  }, [isOpen])

  // ── Search with debounce ──

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

  // ── Reset state on open/close ──

  useEffect(() => {
    if (isOpen) {
      setStep("search")
      setSearchQuery("")
      setSearchResults([])
      setSelectedFilm(null)
      setSelectedTiming("tonight")
      setIsSaving(false)
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [isOpen])

  // ── Lock body scroll ──

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  // ── Keyboard ──

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // ── Film selection ──

  const handleSelectFilm = useCallback((film: Film) => {
    setSelectedFilm(film)
    setStep("confirm")
  }, [])

  // ── Save planned watch ──

  const handleSave = useCallback(async () => {
    if (!selectedFilm || isSaving) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/planned-watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: selectedFilm.tmdbId,
          movieTitle: selectedFilm.title,
          movieYear: extractYear(selectedFilm.releaseDate) ? parseInt(extractYear(selectedFilm.releaseDate)) : null,
          moviePoster: selectedFilm.posterPath ?? null,
          source: "manual",
          scheduledFor: selectedTiming,
          participantIds: [],
        }),
      })
      if (res.ok) {
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      console.error("Failed to create planned watch:", err)
    } finally {
      setIsSaving(false)
    }
  }, [selectedFilm, selectedTiming, isSaving, onSuccess, onClose])

  if (!isOpen) return null

  const posterUrl = selectedFilm ? getImageUrl(selectedFilm.posterPath ?? null, "w185") : null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: "calc(100% - 32px)",
          margin: "20px auto",
          background: colors.bg,
          borderRadius: 20,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 0",
          }}
        >
          {step === "confirm" ? (
            <button
              onClick={() => setStep("search")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <BackIcon color={colors.cream} size={20} />
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.cream,
              margin: 0,
            }}
          >
            Add Planned Watch
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CloseIcon color={colors.textMuted} size={20} />
          </button>
        </div>

        {/* Search Step */}
        {step === "search" && (
          <div style={{ padding: "16px 20px 20px" }}>
            {/* Search input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                marginBottom: 20,
              }}
            >
              <SearchIcon color={colors.textMuted} size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a movie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 15,
                  color: colors.cream,
                  fontFamily: "inherit",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                  }}
                >
                  <CloseIcon color={colors.textMuted} size={16} />
                </button>
              )}
            </div>

            {/* Loading */}
            {isSearching && (
              <p style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", padding: "20px 0" }}>
                Searching...
              </p>
            )}

            {/* Search results */}
            {!isSearching && searchQuery.length >= 2 && searchResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {searchResults.map((film) => (
                  <SearchResultRow key={film.tmdbId} film={film} onSelect={handleSelectFilm} />
                ))}
              </div>
            )}

            {/* No results */}
            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", padding: "20px 0" }}>
                No movies found. Try a different search.
              </p>
            )}

            {/* Trending when no search */}
            {searchQuery.length < 2 && trendingFilms.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Trending Now
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  {trendingFilms.map((film) => (
                    <QuickAddCard key={film.tmdbId} film={film} onSelect={handleSelectFilm} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && selectedFilm && (
          <div style={{ padding: "24px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Movie poster */}
            <div
              style={{
                width: 120,
                height: 180,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 16,
                background: colors.surfaceLight,
              }}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
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

            {/* Movie title + year */}
            <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.cream, margin: "0 0 4px", textAlign: "center" }}>
              {selectedFilm.title}
            </h3>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 24px" }}>
              {extractYear(selectedFilm.releaseDate)}
            </p>

            {/* Divider */}
            <div style={{ width: "100%", height: 1, background: colors.border, marginBottom: 20 }} />

            {/* When are you watching? */}
            <p style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, margin: "0 0 10px" }}>
              When are you watching?
            </p>

            {/* Timing pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, width: "100%" }}>
              {TIMING_OPTIONS.map(({ key, label }) => {
                const isActive = selectedTiming === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTiming(key)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      border: `1px solid ${isActive ? "#c97b3a" : colors.border}`,
                      background: isActive ? "#c97b3a14" : "transparent",
                      color: isActive ? "#e8943a" : colors.textMuted,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Add button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 12,
                border: "none",
                background: isSaving ? "#555" : "linear-gradient(135deg, #c97b3a, #e8943a)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: isSaving ? "default" : "pointer",
                transition: "all 0.2s",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? "Adding..." : "Add to Planned Watches"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
