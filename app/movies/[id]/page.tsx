"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SectionLabel } from "@/components/ui/section-label"
import { useSafeUser } from "@/hooks/use-safe-user"
import { MovieDiscussion } from "@/components/movie-discussion"

// ─── Constants ──────────────────────────────────────────────

const HEADER_TRIGGER = 260 // px — when backdrop is mostly scrolled away
const HEADER_HEIGHT = 102 // 48px safe area + 40px buttons + 14px padding

// ─── Icons ──────────────────────────────────────────────────

function BackIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MoreIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <circle cx="19" cy="12" r="1.5" fill={color} />
      <circle cx="5" cy="12" r="1.5" fill={color} />
    </svg>
  )
}

function InfoIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M3 20C3 16.5 5.5 14 9 14C12.5 14 15 16.5 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 14C17.5 14 19.5 15.8 20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeartIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20L4.5 12.5C2.5 10.5 2.5 7 4.5 5C6.5 3 10 3 12 5.5C14 3 17.5 3 19.5 5C21.5 7 21.5 10.5 19.5 12.5L12 20Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.5" />
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function PlayIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 4.8C6.5 4.1 7.3 3.7 7.9 4.1L19.4 11.3C19.9 11.6 19.9 12.4 19.4 12.7L7.9 19.9C7.3 20.3 6.5 19.9 6.5 19.2V4.8Z" fill={color} />
    </svg>
  )
}

function CloseIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Types ──────────────────────────────────────────────────

type FilmTab = "info" | "discussion" | "ratings"

type Collective = {
  id: string
  name: string
  color: string
}

type MemberRating = {
  user_id: string
  user_name: string | null
  user_avatar: string | null
  score: number
  user_comment?: string | null
}

// ─── Fetcher ────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

// ─── Mobile Tab Bar Component ────────────────────────────────

function FilmTabBar({
  activeTab,
  onTabChange,
  discussionCount,
}: {
  activeTab: FilmTab
  onTabChange: (tab: FilmTab) => void
  discussionCount: number
}) {
  const tabs: { id: FilmTab; label: string; Icon: typeof InfoIcon; badge?: number }[] = [
    { id: "info", label: "Details", Icon: InfoIcon },
    { id: "discussion", label: "Discussion", Icon: ChatIcon, badge: discussionCount > 0 ? discussionCount : undefined },
    { id: "ratings", label: "Ratings", Icon: UsersIcon },
  ]

  return (
    <div className="px-5 border-b border-foreground/[0.08]">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-3 transition-colors"
              style={{
                borderBottom: isActive ? "2px solid #e07850" : "2px solid transparent",
                marginBottom: "-1px",
                color: isActive ? "#f8f6f1" : "rgba(248,246,241,0.5)",
              }}
            >
              <tab.Icon color={isActive ? "#e07850" : "rgba(248,246,241,0.4)"} size={16} />
              <span className={`text-[13px] ${isActive ? "font-medium" : "font-normal"}`}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[11px]"
                  style={{
                    backgroundColor: isActive ? "rgba(224,120,80,0.2)" : "rgba(248,246,241,0.1)",
                    color: isActive ? "#e07850" : "rgba(248,246,241,0.5)",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Desktop Tab Bar Component ────────────────────────────────

function DesktopFilmTabBar({
  activeTab,
  onTabChange,
  discussionCount,
}: {
  activeTab: FilmTab
  onTabChange: (tab: FilmTab) => void
  discussionCount: number
}) {
  const tabs: { id: FilmTab; label: string }[] = [
    { id: "info", label: "Details" },
    { id: "discussion", label: "Discussion" },
    { id: "ratings", label: "Ratings" },
  ]

  return (
    <div className="border-b border-foreground/[0.06]">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2 px-7 py-3.5 transition-colors text-[15px] font-medium"
              style={{
                borderBottom: isActive ? "2px solid #D4753E" : "2px solid transparent",
                marginBottom: "-1px",
                color: isActive ? "#D4753E" : "#777",
              }}
            >
              {tab.id === "discussion" && discussionCount > 0 && (
                <span
                  className="text-[11px] font-semibold rounded-[10px] px-[7px] leading-4"
                  style={{
                    backgroundColor: isActive ? "#D4753E" : "#444",
                    color: "#fff",
                  }}
                >
                  {discussionCount}
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Collective Dropdown Component ────────────────────────────────

function CollectiveDropdown({
  collective,
  collectives,
  onCollectiveChange,
}: {
  collective: Collective | null
  collectives: Collective[]
  onCollectiveChange: (id: string) => void
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="mx-5 my-3 lg:mx-0 lg:my-0 relative">
      {collective ? (
        <>
          <button
            type="button"
            onClick={() => collectives.length > 1 && setShowDropdown(!showDropdown)}
            className="w-full p-2.5 px-3.5 lg:p-3.5 lg:px-5 bg-surface rounded-[10px] lg:rounded-[14px] border border-foreground/[0.06] flex items-center gap-2.5 lg:gap-3"
          >
            <div
              className="size-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${collective.color}20` }}
            >
              <HeartIcon color={collective.color} size={16} />
            </div>
            <span className="flex-1 text-left text-[13px] lg:text-[15px] font-medium">{collective.name}</span>
            {collectives.length > 1 && <ChevronDownIcon color="rgba(248,246,241,0.4)" size={18} />}
          </button>

          {showDropdown && collectives.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-[10px] border border-foreground/[0.06] overflow-hidden z-50 shadow-lg">
              {collectives.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onCollectiveChange(c.id)
                    setShowDropdown(false)
                  }}
                  className={`w-full p-2.5 px-3.5 flex items-center gap-2.5 hover:bg-foreground/[0.04] transition-colors ${c.id === collective.id ? "bg-foreground/[0.04]" : ""}`}
                >
                  <div
                    className="size-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${c.color}20` }}
                  >
                    <HeartIcon color={c.color} size={16} />
                  </div>
                  <span className="text-[13px] font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <Link
          href="/collectives"
          className="w-full p-2.5 px-3.5 bg-surface rounded-[10px] border border-foreground/[0.06] flex items-center gap-2.5"
        >
          <div className="size-7 rounded-lg flex items-center justify-center bg-foreground/10">
            <HeartIcon color="rgba(248,246,241,0.4)" size={16} />
          </div>
          <span className="flex-1 text-left text-[13px] text-foreground/50">Join a collective to discuss</span>
          <ChevronDownIcon color="rgba(248,246,241,0.4)" size={18} />
        </Link>
      )}
    </div>
  )
}

// ─── Star Rating Component ──────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = hoverValue || value

  const sizeClasses = {
    sm: "text-sm",
    md: "text-[28px]",
    lg: "text-[32px]",
  }

  const paddingClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-1",
  }

  return (
    <div className="flex justify-center gap-1 lg:gap-2.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          disabled={readonly}
          className={`${sizeClasses[size]} transition-transform ${paddingClasses[size]}`}
          style={{
            color: star <= displayValue ? "#e07850" : "rgba(248,246,241,0.2)",
            transform: star <= displayValue ? "scale(1.1)" : "scale(1)",
            cursor: readonly ? "default" : "pointer",
            background: "none",
            border: "none",
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ─── Desktop Star Rating (SVG-based, matching design) ──────────

function DesktopStarRating({
  value,
  onChange,
  readonly = false,
  starSize = 18,
}: {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  starSize?: number
}) {
  const [hover, setHover] = useState(0)
  const displayValue = hover || value

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={starSize}
          height={starSize}
          viewBox="0 0 24 24"
          fill={displayValue >= i ? "#D4753E" : "none"}
          stroke={displayValue >= i ? "#D4753E" : "#555"}
          strokeWidth={2}
          style={{ cursor: readonly ? "default" : "pointer", transition: "all 0.15s" }}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(i)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

// ─── Trailer Modal ──────────────────────────────────────────

function TrailerModal({
  videoKey,
  title,
  onClose,
}: {
  videoKey: string
  title: string
  onClose: () => void
}) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-trailer-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.92)", backdropFilter: "blur(24px)" }}
        onClick={onClose}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 lg:top-8 lg:right-8 z-10 size-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <CloseIcon size={20} />
      </button>

      {/* Title */}
      <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10 animate-trailer-slide-up">
        <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1">Now Playing</p>
        <p className="text-[15px] lg:text-[18px] font-medium text-white/80">{title}</p>
      </div>

      {/* Video container */}
      <div
        className="relative z-10 w-[94vw] max-w-[1100px] aspect-video rounded-xl lg:rounded-2xl overflow-hidden animate-trailer-scale-in"
        style={{
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 120px rgba(224,120,80,0.08)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title={`${title} - Trailer`}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export default function FilmDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { user } = useSafeUser()
  const [activeTab, setActiveTab] = useState<FilmTab>("info")
  const [scrollY, setScrollY] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [selectedCollectiveId, setSelectedCollectiveId] = useState<string | null>(null)
  const [ratingSaved, setRatingSaved] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [userReview, setUserReview] = useState("")
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [reviewDraft, setReviewDraft] = useState("")

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch movie data
  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(`/api/movies/tmdb/${id}`, fetcher)
  const { data: communityStats } = useSWR(`/api/movies/${id}/stats`, fetcher)
  const { data: parentalGuide } = useSWR(`/api/movies/${id}/parental-guide`, fetcher)
  const { data: collectivesData } = useSWR(user ? "/api/collectives" : null, fetcher)
  const { data: userRatingData } = useSWR(user ? `/api/ratings?tmdbId=${id}` : null, fetcher)

  // Fetch collective-specific data when collective is selected (for Discussion tab)
  const ratingsKey = selectedCollectiveId ? `/api/collectives/${selectedCollectiveId}/movie/${id}` : null
  const { data: collectiveRatingsData } = useSWR<{ ratings: MemberRating[] }>(ratingsKey, fetcher)

  // Fetch discussion comments count for the selected collective
  const commentsKey = selectedCollectiveId ? `/api/collectives/${selectedCollectiveId}/movie/${id}/comments?mediaType=movie` : null
  const { data: commentsData } = useSWR<any[]>(commentsKey, fetcher)

  // Fetch ratings from ALL collectives for Ratings tab
  const allCollectivesKey = user && collectivesData ? `all-ratings-${id}` : null
  const { data: allRatingsData } = useSWR<MemberRating[]>(
    allCollectivesKey,
    async () => {
      const collectivesList = Array.isArray(collectivesData) ? collectivesData : collectivesData?.collectives || []
      if (collectivesList.length === 0) return []

      const promises = collectivesList.map((c: any) =>
        fetch(`/api/collectives/${c.id}/movie/${id}`).then(res => res.ok ? res.json() : { ratings: [] })
      )
      const results = await Promise.all(promises)

      const seenUserIds = new Set<string>()
      const merged: MemberRating[] = []
      for (const result of results) {
        for (const rating of (result.ratings || [])) {
          if (!seenUserIds.has(rating.user_id)) {
            seenUserIds.add(rating.user_id)
            merged.push(rating)
          }
        }
      }
      return merged
    },
    { revalidateOnFocus: false }
  )

  // Set initial collective
  useEffect(() => {
    const collectivesList = Array.isArray(collectivesData) ? collectivesData : collectivesData?.collectives || []
    if (collectivesList.length > 0 && !selectedCollectiveId) {
      setSelectedCollectiveId(collectivesList[0].id)
    }
  }, [collectivesData, selectedCollectiveId])

  // Set existing user rating and review
  useEffect(() => {
    if (userRatingData?.userRating?.score) {
      setUserRating(userRatingData.userRating.score)
    }
    if (userRatingData?.userRating?.userComment) {
      setUserReview(userRatingData.userRating.userComment)
    }
  }, [userRatingData])

  // Scroll tracking for header transition + parallax
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      setScrollY(container.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => container.removeEventListener("scroll", handleScroll)
  }, [movieLoading, handleScroll])

  // Header progress: 0 at top, 1 when backdrop scrolled away
  const headerProgress = Math.min(1, Math.max(0, (scrollY - HEADER_TRIGGER + 80) / 80))

  // Transform collectives data
  const collectivesList = Array.isArray(collectivesData) ? collectivesData : collectivesData?.collectives || []
  const collectives: Collective[] = collectivesList.map((c: any, index: number) => ({
    id: c.id,
    name: c.name,
    color: ["#f472b6", "#7b8cde", "#e07850", "#d4a574"][index % 4],
  }))

  const selectedCollective = collectives.find((c) => c.id === selectedCollectiveId) || null

  // All ratings from all collectives (for Ratings tab)
  const allRatings = allRatingsData || []
  const otherMemberRatingsAll = allRatings.filter((r) => r.user_id !== user?.id)

  const handleSaveRating = async (rating: number) => {
    if (!user) return
    const previousRating = userRating
    setUserRating(rating)
    setRatingSaved(false)

    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "movie",
          tmdbId: Number(id),
          score: rating,
        }),
      })
      setRatingSaved(true)
      setTimeout(() => setRatingSaved(false), 2000)

      if (ratingsKey) {
        mutate(ratingsKey)
      }
      mutate(`all-ratings-${id}`)
      mutate(`/api/movies/${id}/stats`)
    } catch (error) {
      console.error("Error saving rating:", error)
      setUserRating(previousRating)
    }
  }

  const handleSaveReview = async () => {
    if (!user || !userRating) return
    setIsSavingReview(true)
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "movie",
          tmdbId: Number(id),
          score: userRating,
          comment: reviewDraft,
        }),
      })
      setUserReview(reviewDraft)
      setIsEditingReview(false)
      mutate(`/api/ratings?tmdbId=${id}`)
      if (ratingsKey) mutate(ratingsKey)
      mutate(`all-ratings-${id}`)
    } catch (error) {
      console.error("Error saving review:", error)
    } finally {
      setIsSavingReview(false)
    }
  }

  // Discussion message count for badge
  const discussionCount = Array.isArray(commentsData) ? commentsData.length : 0

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-foreground/50">Loading film...</p>
        </div>
      </div>
    )
  }

  if (movieError || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Film not found</h1>
          <p className="text-foreground/50 mb-6">This film doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-surface rounded-lg border border-foreground/[0.06] text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const title = movie.title || "Untitled"
  const tagline = movie.tagline
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  const releaseDate = movie.releaseDate
  const runtime = movie.runtimeMinutes || movie.runtime
  const genres = movie.genres || []
  const genreNames = genres.map((g: any) => g.name).join(", ")
  const overview = movie.overview
  const posterUrl = getImageUrl(movie.posterPath, "w500")
  const backdropUrl = getImageUrl(movie.backdropPath, "original")
  const director = movie.director
  const cast = movie.cast || []
  const writers = movie.writers || []
  const cinematographer = movie.cinematographer
  const composer = movie.composer
  const studio = movie.productionCompanies?.[0]?.name
  const clipKey = movie.clip?.key
  const trailerKey = movie.trailer?.key || clipKey
  const budget = movie.budget
  const revenue = movie.revenue

  const formatRuntime = (mins: number) => {
    if (!mins) return null
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="h-screen lg:h-auto lg:min-h-screen bg-background relative">

      {/* ══════════ FIXED HEADER — scroll-based transition (mobile) ══════════ */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] lg:hidden"
        style={{
          background: `rgba(13,11,9, ${headerProgress * 0.97})`,
          backdropFilter: headerProgress > 0.1 ? "blur(20px)" : "none",
          WebkitBackdropFilter: headerProgress > 0.1 ? "blur(20px)" : "none",
          borderBottom: `1px solid rgba(255,255,255, ${headerProgress * 0.08})`,
          transition: "background 0.15s ease, border-bottom 0.15s ease",
        }}
      >
        {/* Safe area spacer */}
        <div style={{ height: 48 }} />

        {/* Button row */}
        <div className="flex items-center px-4 pb-3.5">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="size-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: headerProgress < 0.5 ? "rgba(0,0,0,0.35)" : "transparent",
              backdropFilter: headerProgress < 0.5 ? "blur(16px)" : "none",
              WebkitBackdropFilter: headerProgress < 0.5 ? "blur(16px)" : "none",
              transition: "background 0.2s ease, backdrop-filter 0.2s ease",
            }}
          >
            <BackIcon size={20} />
          </button>

          {/* Title (fades in) */}
          <div
            className="flex-1 text-center min-w-0 px-3"
            style={{
              opacity: headerProgress,
              transform: `translateY(${(1 - headerProgress) * 8}px)`,
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <p className="text-[16px] font-semibold truncate text-cream">{title}</p>
            {year && <p className="text-[12px] text-[#888]">{year}</p>}
          </div>

          {/* Menu button */}
          <button
            type="button"
            className="size-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: headerProgress < 0.5 ? "rgba(0,0,0,0.35)" : "transparent",
              backdropFilter: headerProgress < 0.5 ? "blur(16px)" : "none",
              WebkitBackdropFilter: headerProgress < 0.5 ? "blur(16px)" : "none",
              transition: "background 0.2s ease, backdrop-filter 0.2s ease",
            }}
          >
            <MoreIcon size={20} />
          </button>
        </div>
      </div>

      {/* ══════════ MAIN SCROLLABLE AREA ══════════ */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto lg:h-auto lg:overflow-visible"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >

        {/* ────────── HERO BACKDROP ────────── */}
        <div className="relative h-[200px] lg:h-[420px]">
          {/* Inner overflow-hidden container for backdrop content */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Parallax wrapper (mobile) / static (desktop) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translateY(${Math.min(0, -scrollY * 0.3)}px)`,
              }}
            >
              {clipKey ? (
                <div className="absolute inset-0 overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${clipKey}?autoplay=1&mute=1&loop=1&playlist=${clipKey}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] pointer-events-none opacity-60 lg:opacity-40"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : backdropUrl ? (
                <Image
                  src={backdropUrl}
                  alt=""
                  fill
                  className="object-cover opacity-60 lg:opacity-100"
                  style={{
                    objectPosition: "center 20%",
                    transform: `scale(${1 + scrollY * 0.0003})`,
                  }}
                  priority
                />
              ) : null}
            </div>

            {/* Mobile gradient */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{
                background: "linear-gradient(180deg, rgba(224,120,80,0.3) 0%, rgba(123,140,222,0.2) 50%, #08080a 100%)",
              }}
            />

            {/* Desktop gradient + brightness overlay */}
            {!clipKey && (
              <div
                className="absolute inset-0 hidden lg:block"
                style={{
                  background: "linear-gradient(to top, var(--background) 0%, transparent 50%, rgba(13,11,9,0.5) 100%)",
                }}
              />
            )}
            {!clipKey && (
              <div
                className="absolute inset-0 hidden lg:block"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              />
            )}
            {clipKey && (
              <div
                className="absolute inset-0 hidden lg:block"
                style={{
                  background: "linear-gradient(to top, var(--background) 0%, transparent 50%, rgba(13,11,9,0.3) 100%)",
                }}
              />
            )}

            {/* Desktop top nav (hidden on mobile — handled by fixed header) */}
            <div className="hidden lg:flex absolute top-0 left-0 right-0 z-[2] justify-between items-center p-6 px-12">
              <button
                type="button"
                onClick={() => router.back()}
                className="size-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
              >
                <BackIcon size={20} />
              </button>
              <button
                type="button"
                className="size-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
              >
                <MoreIcon size={20} />
              </button>
            </div>
          </div>

          {/* Mobile poster overlapping bottom — outside overflow-hidden so it won't clip */}
          <div
            className="absolute -bottom-10 left-5 w-20 h-[110px] rounded-lg overflow-hidden shadow-xl z-10 lg:hidden"
            style={{ border: "1px solid rgba(248,246,241,0.1)" }}
          >
            {posterUrl ? (
              <Image src={posterUrl} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <span className="text-foreground/30 text-xs">No poster</span>
              </div>
            )}
          </div>
        </div>

        {/* ────────── CONTENT LAYOUT ────────── */}
        <div className="lg:max-w-[1200px] lg:mx-auto lg:px-12 lg:-mt-[200px] lg:relative lg:z-[2]">
          <div className="lg:flex lg:gap-12 lg:items-start">

            {/* ═══════ DESKTOP LEFT COLUMN ═══════ */}
            <div className="hidden lg:block lg:w-[280px] lg:flex-shrink-0">
              {/* Desktop poster */}
              <div
                className="w-[280px] rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "2/3",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={title}
                    width={280}
                    height={420}
                    className="object-cover w-full h-full"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-surface flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1a1510, #2a1f15)" }}
                  >
                    <span className="text-foreground/30 text-sm">No poster</span>
                  </div>
                )}
              </div>

              {/* Desktop Your Rating card */}
              {user && (
                <div
                  className="mt-7 p-6 rounded-2xl text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-foreground/40 uppercase mb-4">
                    Your Rating
                  </div>
                  <div className="flex justify-center">
                    <DesktopStarRating
                      value={userRating}
                      onChange={handleSaveRating}
                      starSize={32}
                    />
                  </div>
                  {ratingSaved ? (
                    <div className="text-[12px] text-green-400 mt-2.5 flex items-center justify-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Saved
                    </div>
                  ) : (
                    <div className="text-[12px] text-foreground/30 mt-2.5">
                      {userRating > 0 ? "Tap a star to update" : "Tap a star to rate"}
                    </div>
                  )}

                  {/* Desktop review section */}
                  {userRating > 0 && (
                    <div className="mt-4 pt-4 border-t border-foreground/[0.06]">
                      {isEditingReview ? (
                        <div className="space-y-3">
                          <textarea
                            value={reviewDraft}
                            onChange={(e) => setReviewDraft(e.target.value)}
                            placeholder="Write your thoughts about this film..."
                            className="w-full bg-background/50 border border-foreground/[0.08] rounded-xl p-3.5 text-[13px] leading-relaxed text-foreground/80 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-foreground/[0.15] transition-colors text-left"
                            rows={4}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditingReview(false)}
                              className="px-3.5 py-1.5 text-[12px] text-foreground/50 hover:text-foreground/70 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveReview}
                              disabled={isSavingReview}
                              className="px-4 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
                              style={{
                                backgroundColor: "rgba(212,117,62,0.15)",
                                color: "#D4753E",
                              }}
                            >
                              {isSavingReview ? "Saving..." : "Save Review"}
                            </button>
                          </div>
                        </div>
                      ) : userReview ? (
                        <div className="text-left">
                          <p className="text-[13px] leading-relaxed text-foreground/50 italic">&ldquo;{userReview}&rdquo;</p>
                          <button
                            type="button"
                            onClick={() => { setReviewDraft(userReview); setIsEditingReview(true) }}
                            className="mt-2 text-[11px] text-[#D4753E]/70 hover:text-[#D4753E] transition-colors"
                          >
                            Edit review
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setReviewDraft(""); setIsEditingReview(true) }}
                          className="w-full py-2 text-[12px] text-foreground/40 hover:text-foreground/60 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Write a review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop action buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 p-3.5 rounded-xl border text-[14px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-foreground/[0.08]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <PlusIcon size={16} />
                  Add to list
                </button>
                <button
                  type="button"
                  className="flex-1 p-3.5 rounded-xl border text-[14px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-foreground/[0.08]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <ShareIcon size={16} />
                  Share
                </button>
              </div>
            </div>

            {/* ═══════ RIGHT COLUMN / MAIN CONTENT ═══════ */}
            <div className="lg:flex-1 lg:min-w-0 lg:pt-5">

              {/* ──── Title Section ──── */}
              <div className="pt-14 px-5 pb-4 lg:pt-0 lg:px-0 lg:pb-0 lg:mb-2">
                <h1 className="text-[22px] lg:text-[48px] font-semibold lg:font-bold tracking-tight text-cream mb-1 lg:mb-0 lg:leading-[1.1] lg:tracking-[-0.01em] lg:font-serif lg:text-white">
                  {title}
                </h1>
                <div className="lg:flex lg:items-center lg:gap-3 lg:mt-3.5 lg:flex-wrap">
                  <p className="text-[13px] lg:text-[15px] text-foreground/50 lg:text-[#999] mb-2 lg:mb-0 lg:contents">
                    {/* Mobile: joined with dots */}
                    <span className="lg:hidden">
                      {[year, genreNames, formatRuntime(runtime)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {/* Desktop: separate spans with dot separators */}
                    <span className="hidden lg:inline">{year}</span>
                    {year && genreNames && <span className="hidden lg:inline text-[#333]">•</span>}
                    <span className="hidden lg:inline">{genreNames}</span>
                    {genreNames && formatRuntime(runtime) && <span className="hidden lg:inline text-[#333]">•</span>}
                    <span className="hidden lg:inline">{formatRuntime(runtime)}</span>
                  </p>
                </div>

                {/* Community Rating */}
                {communityStats && communityStats.ratingCount > 0 && (
                  <div className="flex items-center gap-2 lg:mt-3.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="text-sm lg:hidden"
                          style={{
                            color: star <= Math.round(communityStats.averageScore || 0) ? "#e07850" : "rgba(248,246,241,0.2)"
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span className="hidden lg:flex">
                        <DesktopStarRating value={Math.round(communityStats.averageScore || 0)} readonly starSize={16} />
                      </span>
                    </div>
                    <span className="text-[12px] lg:text-[15px] text-foreground/40 lg:text-[#D4753E] lg:font-semibold">
                      {communityStats.averageScore?.toFixed(1)}
                    </span>
                    <span className="text-[12px] lg:text-[14px] text-foreground/40 lg:text-[#666]">
                      · {communityStats.ratingCount} {communityStats.ratingCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                )}

                {/* Watch Trailer Button */}
                {trailerKey && (
                  <button
                    type="button"
                    onClick={() => setShowTrailer(true)}
                    className="mt-3 lg:mt-5 group flex items-center gap-2.5 transition-all"
                  >
                    <span
                      className="size-9 lg:size-10 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #e07850, #c45a30)",
                        boxShadow: "0 4px 16px rgba(224,120,80,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <PlayIcon color="#fff" size={16} />
                    </span>
                    <span className="text-[13px] lg:text-[15px] font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
                      Watch Trailer
                    </span>
                  </button>
                )}
              </div>

              {/* ──── Mobile Tab Bar (sticky) ──── */}
              <div
                className="lg:hidden sticky z-50"
                style={{ top: HEADER_HEIGHT, background: "#0D0B09" }}
              >
                <FilmTabBar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  discussionCount={discussionCount}
                />
              </div>

              {/* ──── Desktop Tab Bar ──── */}
              <div className="hidden lg:block lg:mt-8">
                <DesktopFilmTabBar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  discussionCount={discussionCount}
                />
              </div>

              {/* Mobile collective dropdown (discussion tab) */}
              {activeTab === "discussion" && (
                <div className="lg:hidden">
                  <CollectiveDropdown
                    collective={selectedCollective}
                    collectives={collectives}
                    onCollectiveChange={setSelectedCollectiveId}
                  />
                </div>
              )}

              {/* ──── Tab Content ──── */}
              <div>

                {/* ════════ INFO TAB ════════ */}
                {activeTab === "info" && (
                  <div className="p-5 lg:p-0 lg:mt-8 space-y-5 lg:space-y-10 lg:pb-16 animate-fade-in">

                    {/* Mobile Your Rating */}
                    {user && (
                      <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06] lg:hidden">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] uppercase tracking-wider text-foreground/40">Your Rating</p>
                          {ratingSaved && (
                            <span className="text-[11px] text-green-400 animate-fade-in flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Saved
                            </span>
                          )}
                        </div>
                        <StarRating value={userRating} onChange={handleSaveRating} />
                        {userRating > 0 && (
                          <p className="text-center text-[11px] text-foreground/40 mt-2">Tap a star to update</p>
                        )}

                        {/* Review section */}
                        {userRating > 0 && (
                          <div className="mt-3 pt-3 border-t border-foreground/[0.06]">
                            {isEditingReview ? (
                              <div className="space-y-2.5">
                                <textarea
                                  value={reviewDraft}
                                  onChange={(e) => setReviewDraft(e.target.value)}
                                  placeholder="Write your thoughts about this film..."
                                  className="w-full bg-background/50 border border-foreground/[0.08] rounded-lg p-3 text-[13px] leading-relaxed text-foreground/80 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-foreground/[0.15] transition-colors"
                                  rows={4}
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingReview(false)}
                                    className="px-3 py-1.5 text-[12px] text-foreground/50 hover:text-foreground/70 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveReview}
                                    disabled={isSavingReview}
                                    className="px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
                                    style={{
                                      backgroundColor: "rgba(224,120,80,0.15)",
                                      color: "#e07850",
                                    }}
                                  >
                                    {isSavingReview ? "Saving..." : "Save Review"}
                                  </button>
                                </div>
                              </div>
                            ) : userReview ? (
                              <div>
                                <p className="text-[13px] leading-relaxed text-foreground/60 italic">&ldquo;{userReview}&rdquo;</p>
                                <button
                                  type="button"
                                  onClick={() => { setReviewDraft(userReview); setIsEditingReview(true) }}
                                  className="mt-2 text-[11px] text-accent/70 hover:text-accent transition-colors"
                                >
                                  Edit review
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setReviewDraft(""); setIsEditingReview(true) }}
                                className="w-full py-2 text-[12px] text-foreground/40 hover:text-foreground/60 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Write a review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tagline */}
                    {tagline && (
                      <p className="text-sm lg:text-xl italic text-foreground/50 lg:text-[#b8a898] text-center lg:text-left lg:font-serif lg:mt-0">
                        &ldquo;{tagline}&rdquo;
                      </p>
                    )}

                    {/* Overview */}
                    {overview && (
                      <div>
                        <SectionLabel className="mb-2.5 lg:mb-3.5 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Overview</SectionLabel>
                        <p className="text-sm lg:text-base leading-[1.6] lg:leading-[1.7] text-foreground/70 lg:text-[#c4bab0] lg:max-w-[680px]">
                          {overview}
                        </p>
                      </div>
                    )}

                    {/* Cast */}
                    {cast.length > 0 && (
                      <div>
                        <SectionLabel className="mb-3 lg:mb-5 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Cast</SectionLabel>
                        <div
                          className="flex gap-3 lg:gap-6 overflow-x-auto lg:overflow-visible lg:flex-wrap pb-2"
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                          {cast.map((actor: any) => (
                            <div key={actor.id} className="flex-shrink-0 w-[72px] lg:w-[100px] text-center">
                              <div
                                className="w-[72px] h-[72px] lg:w-[80px] lg:h-[80px] rounded-full overflow-hidden bg-surface mb-2 lg:mb-2.5 mx-auto"
                                style={{ border: "2px solid rgba(255,255,255,0.08)" }}
                              >
                                {actor.profilePath ? (
                                  <Image
                                    src={getImageUrl(actor.profilePath, "w185")}
                                    alt={actor.name}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-foreground/20 text-2xl bg-[#1a1510]">
                                    {actor.name?.[0]?.toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] lg:text-[13px] font-medium lg:font-semibold text-center truncate">{actor.name}</p>
                              <p className="text-[10px] lg:text-[12px] text-foreground/40 lg:text-[#777] text-center truncate">{actor.character}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crew */}
                    <div>
                      <SectionLabel className="mb-3 lg:mb-4 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Crew</SectionLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {director && (
                          <div className="bg-surface rounded-xl p-3 lg:p-4 lg:px-5 border border-foreground/[0.06]">
                            <p className="text-[10px] uppercase tracking-wider lg:tracking-[0.1em] text-foreground/40 lg:text-[#888] mb-1 lg:mb-2 font-semibold">Director</p>
                            <p className="text-[13px] lg:text-[15px] font-medium lg:text-[#e8e0d8]">{director.name}</p>
                          </div>
                        )}
                        {writers.length > 0 && (
                          <div className="bg-surface rounded-xl p-3 lg:p-4 lg:px-5 border border-foreground/[0.06]">
                            <p className="text-[10px] uppercase tracking-wider lg:tracking-[0.1em] text-foreground/40 lg:text-[#888] mb-1 lg:mb-2 font-semibold">Writers</p>
                            <p className="text-[13px] lg:text-[15px] font-medium lg:text-[#e8e0d8] truncate">
                              {writers.map((w: any) => w.name).join(", ")}
                            </p>
                          </div>
                        )}
                        {cinematographer && (
                          <div className="bg-surface rounded-xl p-3 lg:p-4 lg:px-5 border border-foreground/[0.06]">
                            <p className="text-[10px] uppercase tracking-wider lg:tracking-[0.1em] text-foreground/40 lg:text-[#888] mb-1 lg:mb-2 font-semibold">Cinematography</p>
                            <p className="text-[13px] lg:text-[15px] font-medium lg:text-[#e8e0d8]">{cinematographer.name}</p>
                          </div>
                        )}
                        {composer && (
                          <div className="bg-surface rounded-xl p-3 lg:p-4 lg:px-5 border border-foreground/[0.06]">
                            <p className="text-[10px] uppercase tracking-wider lg:tracking-[0.1em] text-foreground/40 lg:text-[#888] mb-1 lg:mb-2 font-semibold">Music</p>
                            <p className="text-[13px] lg:text-[15px] font-medium lg:text-[#e8e0d8]">{composer.name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <SectionLabel className="mb-3 lg:mb-4 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Details</SectionLabel>

                      {/* Mobile details */}
                      <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06] space-y-2.5 lg:hidden">
                        {runtime > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-foreground/50">Runtime</span>
                            <span className="text-[13px] font-medium">{formatRuntime(runtime)}</span>
                          </div>
                        )}
                        {releaseDate && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-foreground/50">Release Date</span>
                            <span className="text-[13px] font-medium">
                              {new Date(releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {studio && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-foreground/50">Studio</span>
                            <span className="text-[13px] font-medium">{studio}</span>
                          </div>
                        )}
                        {budget > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-foreground/50">Budget</span>
                            <span className="text-[13px] font-medium">{formatCurrency(budget)}</span>
                          </div>
                        )}
                        {revenue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-foreground/50">Box Office</span>
                            <span className="text-[13px] font-medium">{formatCurrency(revenue)}</span>
                          </div>
                        )}
                        {genres.length > 0 && (
                          <div className="flex justify-between items-start">
                            <span className="text-[13px] text-foreground/50">Genres</span>
                            <div className="flex flex-wrap gap-1.5 justify-end max-w-[200px]">
                              {genres.map((g: any) => (
                                <span
                                  key={g.id}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-foreground/[0.06] text-foreground/70"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Desktop details table */}
                      <div
                        className="hidden lg:block rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {[
                          runtime > 0 && { label: "Runtime", value: formatRuntime(runtime) },
                          releaseDate && {
                            label: "Release Date",
                            value: new Date(releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                          },
                          studio && { label: "Studio", value: studio },
                          budget > 0 && { label: "Budget", value: formatCurrency(budget) },
                          revenue > 0 && { label: "Box Office", value: formatCurrency(revenue) },
                        ]
                          .filter(Boolean)
                          .map((item, i, arr) => (
                            <div
                              key={(item as any).label}
                              className="flex justify-between items-center px-6 py-4"
                              style={{
                                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                              }}
                            >
                              <span className="text-[14px] text-[#999]">{(item as any).label}</span>
                              <span className="text-[14px] font-medium text-[#e8e0d8]">{(item as any).value}</span>
                            </div>
                          ))}
                        {genres.length > 0 && (
                          <div
                            className="flex justify-between items-center px-6 py-4"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <span className="text-[14px] text-[#999]">Genres</span>
                            <div className="flex gap-2">
                              {genres.map((g: any) => (
                                <span
                                  key={g.id}
                                  className="text-[13px] text-[#e8e0d8] px-3.5 py-1 rounded-full"
                                  style={{
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    background: "rgba(255,255,255,0.04)",
                                  }}
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Parental Guide */}
                    {parentalGuide && (
                      <div>
                        <SectionLabel className="mb-3 lg:mb-4 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Parental Guide</SectionLabel>

                        {/* Mobile parental guide */}
                        <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06] space-y-3 lg:hidden">
                          {[
                            { label: "Sex & Nudity", value: parentalGuide.sexNudity },
                            { label: "Violence & Gore", value: parentalGuide.violence },
                            { label: "Profanity", value: parentalGuide.profanity },
                            { label: "Alcohol, Drugs & Smoking", value: parentalGuide.alcoholDrugsSmoking },
                            { label: "Frightening & Intense", value: parentalGuide.frighteningIntense },
                          ].filter(item => item.value).map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-[13px] text-foreground/50">{item.label}</span>
                              <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                                style={{
                                  backgroundColor:
                                    item.value === "Severe" ? "rgba(239,68,68,0.15)" :
                                    item.value === "Moderate" ? "rgba(245,158,11,0.15)" :
                                    item.value === "Mild" ? "rgba(34,197,94,0.15)" :
                                    "rgba(248,246,241,0.06)",
                                  color:
                                    item.value === "Severe" ? "#ef4444" :
                                    item.value === "Moderate" ? "#f59e0b" :
                                    item.value === "Mild" ? "#22c55e" :
                                    "rgba(248,246,241,0.4)",
                                }}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Desktop parental guide */}
                        <div
                          className="hidden lg:block rounded-2xl overflow-hidden"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {[
                            { label: "Sex & Nudity", value: parentalGuide.sexNudity },
                            { label: "Violence & Gore", value: parentalGuide.violence },
                            { label: "Profanity", value: parentalGuide.profanity },
                            { label: "Alcohol, Drugs & Smoking", value: parentalGuide.alcoholDrugsSmoking },
                            { label: "Frightening & Intense", value: parentalGuide.frighteningIntense },
                          ].filter(item => item.value).map((item, i, arr) => (
                            <div
                              key={item.label}
                              className="flex justify-between items-center px-6 py-4"
                              style={{
                                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                              }}
                            >
                              <span className="text-[14px] text-[#999]">{item.label}</span>
                              <span
                                className="text-[12px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
                                style={{
                                  backgroundColor:
                                    item.value === "Severe" ? "rgba(239,68,68,0.12)" :
                                    item.value === "Moderate" ? "rgba(245,158,11,0.12)" :
                                    item.value === "Mild" ? "rgba(34,197,94,0.12)" :
                                    "rgba(255,255,255,0.04)",
                                  color:
                                    item.value === "Severe" ? "#ef4444" :
                                    item.value === "Moderate" ? "#f59e0b" :
                                    item.value === "Mild" ? "#22c55e" :
                                    "#666",
                                }}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="mt-2.5 lg:mt-3 text-[11px] lg:text-[12px] text-foreground/30 lg:text-[#666]">
                          Source: IMDb Parental Guide
                        </p>
                      </div>
                    )}

                    {/* Mobile action buttons */}
                    <div className="grid grid-cols-2 gap-2.5 lg:hidden">
                      <button
                        type="button"
                        className="p-3.5 bg-surface rounded-[10px] border border-foreground/[0.08] text-[13px] font-medium flex items-center justify-center gap-2"
                      >
                        <PlusIcon size={16} />
                        Add to list
                      </button>
                      <button
                        type="button"
                        className="p-3.5 bg-surface rounded-[10px] border border-foreground/[0.08] text-[13px] font-medium flex items-center justify-center gap-2"
                      >
                        <ShareIcon size={16} />
                        Share
                      </button>
                    </div>
                  </div>
                )}

                {/* ════════ DISCUSSION TAB ════════ */}
                {activeTab === "discussion" && (
                  <div className="flex flex-col min-h-[400px] lg:mt-8 lg:max-w-[640px] lg:pb-16 animate-fade-in">

                    {/* Desktop collective selector */}
                    <div className="hidden lg:block lg:mb-8">
                      <CollectiveDropdown
                        collective={selectedCollective}
                        collectives={collectives}
                        onCollectiveChange={setSelectedCollectiveId}
                      />
                    </div>

                    {!selectedCollective ? (
                      <div className="text-center py-12">
                        <p className="text-sm text-foreground/50">Join a collective to discuss this film</p>
                        <Link
                          href="/collectives"
                          className="inline-block mt-3 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium"
                        >
                          Browse Collectives
                        </Link>
                      </div>
                    ) : !user ? (
                      <div className="text-center py-12">
                        <p className="text-sm text-foreground/50">Sign in to join the discussion</p>
                        <Link
                          href="/handler/sign-in"
                          className="inline-block mt-3 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium"
                        >
                          Sign In
                        </Link>
                      </div>
                    ) : (
                      <div className="min-h-[400px]">
                        <MovieDiscussion
                          collectiveId={selectedCollective.id}
                          tmdbId={id}
                          mediaType="movie"
                          currentUserId={user.id}
                          currentUserName={user.displayName || undefined}
                          stickyInput={true}
                          stickyInputBottomOffset={0}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ════════ RATINGS TAB ════════ */}
                {activeTab === "ratings" && (
                  <div className="p-5 lg:p-0 lg:mt-8 lg:max-w-[640px] lg:pb-16 space-y-3 animate-fade-in">
                    <SectionLabel className="mb-3.5 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em] lg:mb-5">
                      Ratings from your collectives
                    </SectionLabel>

                    {/* Your rating card */}
                    {user && userRating > 0 && (
                      <div
                        className="rounded-xl lg:rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "rgba(224,120,80,0.1)",
                          border: "1px solid rgba(224,120,80,0.2)",
                        }}
                      >
                        <div className="flex items-center gap-3.5 lg:gap-4 p-3.5 lg:p-[18px] lg:px-6">
                          <Avatar size="md" className="lg:size-12">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>{(user.displayName || "Y")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm lg:text-[15px] font-semibold mb-1">You</p>
                            <div className="flex gap-0.5 lg:hidden">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span
                                  key={s}
                                  className="text-sm"
                                  style={{ color: s <= userRating ? "#e07850" : "rgba(248,246,241,0.2)" }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="hidden lg:block">
                              <DesktopStarRating value={userRating} readonly starSize={14} />
                            </div>
                          </div>
                        </div>
                        {userReview && (
                          <div className="px-3.5 lg:px-6 pb-3.5 lg:pb-[18px]">
                            <p className="text-[12px] lg:text-[13px] leading-relaxed text-foreground/50 italic">&ldquo;{userReview}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Other members' ratings from all collectives */}
                    {otherMemberRatingsAll.map((member) => (
                      <div
                        key={member.user_id}
                        className="rounded-xl lg:rounded-2xl bg-surface border border-foreground/[0.06] overflow-hidden"
                      >
                        <div className="flex items-center gap-3.5 lg:gap-4 p-3.5 lg:p-[18px] lg:px-6">
                          <Avatar size="md" className="lg:size-12">
                            <AvatarImage src={member.user_avatar || undefined} />
                            <AvatarFallback>{(member.user_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm lg:text-[15px] font-semibold mb-1">{member.user_name || "User"}</p>
                            <div className="flex gap-0.5 lg:hidden">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span
                                  key={s}
                                  className="text-sm"
                                  style={{ color: s <= member.score ? "#e07850" : "rgba(248,246,241,0.2)" }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="hidden lg:block">
                              <DesktopStarRating value={member.score} readonly starSize={14} />
                            </div>
                          </div>
                        </div>
                        {member.user_comment && (
                          <div className="px-3.5 lg:px-6 pb-3.5 lg:pb-[18px]">
                            <p className="text-[12px] lg:text-[13px] leading-relaxed text-foreground/50 italic">&ldquo;{member.user_comment}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Empty state for ratings */}
                    {otherMemberRatingsAll.length === 0 && !userRating && (
                      <div className="text-center py-8 bg-surface rounded-xl border border-foreground/[0.06]">
                        <p className="text-sm text-foreground/50">No ratings yet</p>
                        <p className="text-xs text-foreground/30 mt-1">Be the first to rate this film</p>
                      </div>
                    )}

                    {/* Community stats */}
                    {communityStats && communityStats.ratingCount > 0 && (
                      <div className="mt-5 lg:mt-10">
                        <SectionLabel className="mb-3.5 lg:mb-4 block lg:text-[11px] lg:font-semibold lg:tracking-[0.12em]">Community Stats</SectionLabel>

                        {/* Mobile stats */}
                        <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06] lg:hidden">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Average</p>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold">{communityStats.averageScore?.toFixed(1)}</span>
                                <span className="text-accent text-lg">★</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Total Ratings</p>
                              <p className="text-2xl font-semibold">{communityStats.ratingCount}</p>
                            </div>
                          </div>
                        </div>

                        {/* Desktop stats */}
                        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
                          <div
                            className="rounded-2xl p-7 text-center"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="text-[11px] font-semibold tracking-[0.1em] text-[#888] uppercase mb-3">Average</div>
                            <div className="flex items-baseline justify-center gap-2">
                              <span className="text-[44px] font-bold text-white font-serif">
                                {communityStats.averageScore?.toFixed(1)}
                              </span>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="#D4753E" stroke="none">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </div>
                          </div>
                          <div
                            className="rounded-2xl p-7 text-center"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="text-[11px] font-semibold tracking-[0.1em] text-[#888] uppercase mb-3">Total Ratings</div>
                            <span className="text-[44px] font-bold text-white font-serif">{communityStats.ratingCount}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!user && (
                      <div className="text-center py-8">
                        <p className="text-sm text-foreground/50">Sign in to rate this film</p>
                        <Link
                          href="/handler/sign-in"
                          className="inline-block mt-3 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium"
                        >
                          Sign In
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          title={title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  )
}
