"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SectionLabel } from "@/components/ui/section-label"
import { useSafeUser } from "@/hooks/use-safe-user"
import { formatDistanceToNow } from "date-fns"

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

function SendIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

type DiscussionMessage = {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  content: string
  gif_url?: string | null
  created_at: string
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

// ─── Sticky Header Component ────────────────────────────────

function FilmStickyHeader({
  isFixed,
  activeTab,
  onTabChange,
  collective,
  collectives,
  onCollectiveChange,
  discussionCount,
}: {
  isFixed: boolean
  activeTab: FilmTab
  onTabChange: (tab: FilmTab) => void
  collective: Collective | null
  collectives: Collective[]
  onCollectiveChange: (id: string) => void
  discussionCount: number
}) {
  const [showDropdown, setShowDropdown] = useState(false)

  const tabs: { id: FilmTab; label: string; Icon: typeof InfoIcon; badge?: number }[] = [
    { id: "info", label: "Info", Icon: InfoIcon },
    { id: "discussion", label: "Discussion", Icon: ChatIcon, badge: discussionCount > 0 ? discussionCount : undefined },
    { id: "ratings", label: "Ratings", Icon: UsersIcon },
  ]

  return (
    <div
      className={`bg-background ${isFixed ? "fixed top-0 left-0 right-0 z-[100] border-b border-foreground/10" : ""}`}
      style={isFixed ? { boxShadow: "0 4px 20px rgba(0,0,0,0.3)" } : {}}
    >
      {/* Collective dropdown */}
      <div className="mx-5 my-3 relative">
        {collective ? (
          <>
            <button
              type="button"
              onClick={() => collectives.length > 1 && setShowDropdown(!showDropdown)}
              className="w-full p-2.5 px-3.5 bg-surface rounded-[10px] border border-foreground/[0.06] flex items-center gap-2.5"
            >
              <div
                className="size-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${collective.color}20` }}
              >
                <HeartIcon color={collective.color} size={16} />
              </div>
              <span className="flex-1 text-left text-[13px] font-medium">{collective.name}</span>
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

      {/* Tab bar */}
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
    </div>
  )
}

// ─── Star Rating Component ──────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = hoverValue || value

  return (
    <div className="flex justify-center gap-2.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          disabled={readonly}
          className="text-[28px] transition-transform"
          style={{
            color: star <= displayValue ? "#e07850" : "rgba(248,246,241,0.2)",
            transform: star <= displayValue ? "scale(1.1)" : "scale(1)",
            cursor: readonly ? "default" : "pointer",
            background: "none",
            border: "none",
            padding: "6px",
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ─── Discussion Message Component ───────────────────────────

function MessageBubble({
  message,
  isYou,
}: {
  message: DiscussionMessage
  isYou: boolean
}) {
  return (
    <div
      className="flex gap-2.5 mb-4"
      style={{ flexDirection: isYou ? "row-reverse" : "row" }}
    >
      {/* Avatar */}
      <div
        className="size-8 rounded-full flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: isYou ? "#e07850" : "#f472b6" }}
      >
        {message.user_avatar ? (
          <Image
            src={message.user_avatar}
            alt={message.user_name || "User"}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
            {(message.user_name || "U")[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Message content */}
      <div style={{ maxWidth: "75%" }}>
        {/* Name and time */}
        <div
          className="flex items-baseline gap-2 mb-1"
          style={{ flexDirection: isYou ? "row-reverse" : "row" }}
        >
          <span className="text-xs font-semibold text-foreground/70">{message.user_name || "User"}</span>
          <span className="text-[10px] text-foreground/30">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Bubble */}
        <div
          className="px-3.5 py-2.5"
          style={{
            backgroundColor: isYou ? "rgba(224,120,80,0.2)" : "rgba(15,15,18,1)",
            borderRadius: "14px",
            borderTopLeftRadius: isYou ? "14px" : "4px",
            borderTopRightRadius: isYou ? "4px" : "14px",
            border: isYou ? "1px solid rgba(224,120,80,0.3)" : "1px solid rgba(248,246,241,0.06)",
          }}
        >
          {message.gif_url ? (
            <Image
              src={message.gif_url}
              alt="GIF"
              width={200}
              height={150}
              className="rounded-lg max-w-full"
              unoptimized
            />
          ) : (
            <p className="text-sm leading-[1.45]">{message.content}</p>
          )}
        </div>
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
  const [isSticky, setIsSticky] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [messageInput, setMessageInput] = useState("")
  const [selectedCollectiveId, setSelectedCollectiveId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const stickyRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch movie data
  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(`/api/movies/tmdb/${id}`, fetcher)
  const { data: communityStats } = useSWR(`/api/movies/${id}/stats`, fetcher)
  const { data: collectivesData } = useSWR(user ? "/api/collectives" : null, fetcher)
  const { data: userRatingData } = useSWR(user ? `/api/ratings?tmdbId=${id}` : null, fetcher)

  // Fetch collective-specific data when collective is selected
  const commentsKey = selectedCollectiveId ? `/api/collectives/${selectedCollectiveId}/movie/${id}/comments?mediaType=movie` : null
  const ratingsKey = selectedCollectiveId ? `/api/collectives/${selectedCollectiveId}/movie/${id}` : null

  const { data: commentsData, mutate: mutateComments } = useSWR<DiscussionMessage[]>(commentsKey, fetcher)
  const { data: collectiveRatingsData } = useSWR<{ ratings: MemberRating[] }>(ratingsKey, fetcher)

  // Set initial collective (API returns array directly, not { collectives: [...] })
  useEffect(() => {
    const collectivesList = Array.isArray(collectivesData) ? collectivesData : collectivesData?.collectives || []
    if (collectivesList.length > 0 && !selectedCollectiveId) {
      setSelectedCollectiveId(collectivesList[0].id)
    }
  }, [collectivesData, selectedCollectiveId])

  // Set existing user rating
  useEffect(() => {
    if (userRatingData?.userRating?.score) {
      setUserRating(userRatingData.userRating.score)
    }
  }, [userRatingData])

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (stickyRef.current && scrollContainerRef.current) {
        const stickyTop = stickyRef.current.offsetTop
        const scrollTop = scrollContainerRef.current.scrollTop
        setIsSticky(scrollTop >= stickyTop)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "discussion" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [commentsData, activeTab])

  // Transform collectives data (API returns array directly)
  const collectivesList = Array.isArray(collectivesData) ? collectivesData : collectivesData?.collectives || []
  const collectives: Collective[] = collectivesList.map((c: any, index: number) => ({
    id: c.id,
    name: c.name,
    color: ["#f472b6", "#7b8cde", "#e07850", "#d4a574"][index % 4],
  }))

  const selectedCollective = collectives.find((c) => c.id === selectedCollectiveId) || null
  const discussionMessages = commentsData || []
  const collectiveRatings = collectiveRatingsData?.ratings || []

  // Filter out current user from collective ratings
  const otherMemberRatings = collectiveRatings.filter((r) => r.user_id !== user?.id)
  const myRatingInCollective = collectiveRatings.find((r) => r.user_id === user?.id)

  const handleSaveRating = async (rating: number) => {
    if (!user || rating === 0) return
    setUserRating(rating)
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
      // Refresh collective ratings
      if (ratingsKey) {
        mutate(ratingsKey)
      }
    } catch (error) {
      console.error("Error saving rating:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !selectedCollectiveId || !messageInput.trim() || isSending) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/collectives/${selectedCollectiveId}/movie/${id}/comments?mediaType=movie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageInput.trim() }),
      })

      if (res.ok) {
        setMessageInput("")
        mutateComments()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const stickyHeaderHeight = selectedCollective ? 100 : 52

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
          <p className="text-foreground/50 mb-6">This film doesn't exist or couldn't be loaded.</p>
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
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  const runtime = movie.runtime
  const genres = movie.genres?.map((g: any) => g.name).join(", ")
  const overview = movie.overview
  const posterUrl = getImageUrl(movie.posterPath, "w500")
  const backdropUrl = getImageUrl(movie.backdropPath, "original")
  const director = movie.director?.name
  const cast = movie.cast || []
  const studio = movie.productionCompanies?.[0]?.name
  const clipKey = movie.clip?.key

  // Calculate bottom padding: 85px for nav + 65px for input when on discussion tab
  const scrollPaddingBottom = activeTab === "discussion" && selectedCollective && user ? 150 : 85

  return (
    <div className="h-screen bg-background flex flex-col relative">
      {/* STICKY HEADER - fixed at top when scrolled past trigger */}
      {isSticky && (
        <FilmStickyHeader
          isFixed={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collective={selectedCollective}
          collectives={collectives}
          onCollectiveChange={setSelectedCollectiveId}
          discussionCount={discussionMessages.length}
        />
      )}

      {/* MAIN SCROLLABLE AREA */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto"
        style={{
          paddingBottom: scrollPaddingBottom,
          WebkitOverflowScrolling: "touch" // Smooth scroll on iOS
        }}
      >
        {/* Hero with video/backdrop */}
        <div className="relative h-[200px]">
          {/* Video background (subtle) */}
          {clipKey ? (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${clipKey}?autoplay=1&mute=1&loop=1&playlist=${clipKey}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] pointer-events-none opacity-60"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : backdropUrl ? (
            <Image
              src={backdropUrl}
              alt=""
              fill
              className="object-cover opacity-60"
              priority
            />
          ) : null}

          {/* Gradient overlays */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(224,120,80,0.3) 0%, rgba(123,140,222,0.2) 50%, #08080a 100%)",
            }}
          />

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-3 left-5 size-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(8,8,10,0.5)", backdropFilter: "blur(10px)" }}
          >
            <BackIcon size={20} />
          </button>

          {/* More button */}
          <button
            type="button"
            className="absolute top-3 right-5 size-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(8,8,10,0.5)", backdropFilter: "blur(10px)" }}
          >
            <MoreIcon size={20} />
          </button>

          {/* Poster overlapping bottom */}
          <div
            className="absolute -bottom-10 left-5 w-20 h-[110px] rounded-lg overflow-hidden shadow-xl z-10"
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

        {/* Title section */}
        <div className="pt-14 px-5 pb-4">
          <h1 className="text-[22px] font-semibold tracking-tight text-cream mb-1">{title}</h1>
          <p className="text-[13px] text-foreground/50">
            {[year, genres, runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Sticky header placeholder */}
        <div ref={stickyRef}>
          <FilmStickyHeader
            isFixed={false}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collective={selectedCollective}
            collectives={collectives}
            onCollectiveChange={setSelectedCollectiveId}
            discussionCount={discussionMessages.length}
          />
        </div>

        {/* Tab content with padding compensation when sticky */}
        <div style={{ paddingTop: isSticky ? stickyHeaderHeight : 0 }}>
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="p-5 space-y-5">
              {/* Your Rating */}
              <div className="bg-surface rounded-[14px] p-5 border border-foreground/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Your Rating</SectionLabel>
                  {userRating > 0 && (
                    <span className="text-[13px] text-foreground/50">{userRating}/5</span>
                  )}
                </div>
                <StarRating
                  value={userRating}
                  onChange={handleSaveRating}
                />
              </div>

              {/* Overview */}
              {overview && (
                <div>
                  <SectionLabel className="mb-2.5 block">Overview</SectionLabel>
                  <p className="text-sm leading-[1.6] text-foreground/70">{overview}</p>
                </div>
              )}

              {/* Details */}
              <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06] space-y-2.5">
                {director && (
                  <div className="flex justify-between">
                    <span className="text-[13px] text-foreground/50">Director</span>
                    <span className="text-[13px] font-medium">{director}</span>
                  </div>
                )}
                {cast.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[13px] text-foreground/50">Cast</span>
                    <span className="text-[13px] font-medium truncate max-w-[200px]">
                      {cast
                        .slice(0, 2)
                        .map((a: any) => a.name)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {studio && (
                  <div className="flex justify-between">
                    <span className="text-[13px] text-foreground/50">Studio</span>
                    <span className="text-[13px] font-medium">{studio}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2.5">
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

          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div className="p-4 px-5">
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
              ) : discussionMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-foreground/50">No messages yet</p>
                  <p className="text-xs text-foreground/30 mt-1">Start the conversation about this film</p>
                </div>
              ) : (
                <>
                  {discussionMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isYou={msg.user_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* Ratings Tab */}
          {activeTab === "ratings" && (
            <div className="p-5 space-y-3">
              {selectedCollective && (
                <SectionLabel className="mb-3.5 block">
                  Ratings in {selectedCollective.name}
                </SectionLabel>
              )}

              {/* Your rating card */}
              {user && (myRatingInCollective || userRating > 0) && (
                <div
                  className="flex items-center gap-3.5 p-3.5 rounded-xl"
                  style={{
                    backgroundColor: "rgba(224,120,80,0.1)",
                    border: "1px solid rgba(224,120,80,0.2)",
                  }}
                >
                  <Avatar size="md">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>{(user.displayName || "Y")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">You</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className="text-sm"
                          style={{ color: s <= (myRatingInCollective?.score || userRating) ? "#e07850" : "rgba(248,246,241,0.2)" }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-accent">
                    {myRatingInCollective?.score || userRating}
                  </span>
                </div>
              )}

              {/* Other members' ratings */}
              {otherMemberRatings.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-surface border border-foreground/[0.06]"
                >
                  <Avatar size="md">
                    <AvatarImage src={member.user_avatar || undefined} />
                    <AvatarFallback>{(member.user_name || "U")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">{member.user_name || "User"}</p>
                    <div className="flex gap-0.5">
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
                  </div>
                  <span className="text-lg font-semibold text-accent">{member.score}</span>
                </div>
              ))}

              {/* Empty state for ratings */}
              {collectiveRatings.length === 0 && selectedCollective && (
                <div className="text-center py-8 bg-surface rounded-xl border border-foreground/[0.06]">
                  <p className="text-sm text-foreground/50">No ratings yet</p>
                  <p className="text-xs text-foreground/30 mt-1">Be the first to rate this film</p>
                </div>
              )}

              {/* Community stats */}
              {communityStats && communityStats.ratingCount > 0 && (
                <div className="mt-5">
                  <SectionLabel className="mb-3.5 block">Community Stats</SectionLabel>
                  <div className="bg-surface rounded-xl p-4 border border-foreground/[0.06]">
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

      {/* CHAT INPUT - fixed at bottom, only on discussion tab */}
      {activeTab === "discussion" && selectedCollective && user && (
        <div
          className="fixed left-0 right-0 p-3 px-5 bg-background border-t border-foreground/[0.06]"
          style={{
            bottom: 85, // Height of bottom nav
            zIndex: 50
          }}
        >
          <div className="flex items-center gap-2.5 p-2 pl-4 bg-surface rounded-full border border-foreground/[0.08]">
            <input
              type="text"
              placeholder="Discuss this film..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              className="size-9 rounded-full bg-accent flex items-center justify-center disabled:opacity-50"
            >
              <SendIcon color="#08080a" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV - already has fixed positioning via component */}
      <MobileBottomNav className="z-[100]" />
    </div>
  )
}
