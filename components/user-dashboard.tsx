"use client"

import { useState } from "react"
import { useStackApp } from "@stackframe/stack"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Compass, Users, Info, Settings, LayoutDashboard, User, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SectionLabel } from "@/components/ui/section-label"
import { LogFilmModal } from "@/components/modals/log-film-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// ─── Icons ──────────────────────────────────────────────────

function BellIcon({ color = "#f8f6f1", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21C13.37 21.62 12.71 22 12 22C11.29 22 10.63 21.62 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TonightsPickIcon({ color = "#e07850", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
      <circle cx="5" cy="18" r="1" fill={color} opacity="0.4" />
    </svg>
  )
}

function LogFilmIcon({ color = "#f8f6f1", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M7 7V4C7 3.45 7.45 3 8 3H16C16.55 3 17 3.45 17 4V7" stroke={color} strokeWidth="1.5" />
      <circle cx="8.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
      <circle cx="15.5" cy="13" r="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 13H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon({ color = "rgba(248,246,241,0.25)", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ─── Types ──────────────────────────────────────────────────

type Activity = {
  activity_type: "rating" | "comment" | "reaction"
  activity_id: string
  created_at: string
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  tmdb_id: number
  media_title: string
  poster_path: string | null
  media_type: "movie" | "tv"
  score: number | null
  content: string | null
  reaction_type: string | null
  collective_id: string
  collective_name: string
  rating_id: string
  target_user_name: string | null
}

type DashboardData = {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    memberSince: string
  } | null
  collectives: {
    id: string
    name: string
    description: string | null
    role: string
    member_count: number
  }[]
  stats: {
    movies_rated: number
    shows_rated: number
    collective_count: number
  }
  recentActivity: Activity[]
  insights: {
    avgRating: number
    topGenres: { genre: string; count: number }[]
    favoriteDecade: number | null
    highestRated: {
      tmdb_id: number
      title: string
      poster_path: string | null
      overall_score: number
    } | null
    ratingActivity: {
      this_month: number
      last_month: number
    }
  }
  favorites: {
    tmdb_id: number
    title: string
    poster_path: string | null
    position: number
  }[]
}

type ActivityFilter = "all" | "ratings" | "discussions"

const REACTION_EMOJI_MAP: Record<string, string> = {
  fire: "\uD83D\uDD25",
  heart: "\u2764\uFE0F",
  laughing: "\uD83D\uDE02",
  crying: "\uD83D\uDE22",
  mindblown: "\uD83E\uDD2F",
  clap: "\uD83D\uDC4F",
  thinking: "\uD83E\uDD14",
  angry: "\uD83D\uDE21",
  love: "\uD83D\uDE0D",
  thumbsup: "\uD83D\uDC4D",
}

// ─── Activity Item ──────────────────────────────────────────

function DashboardActivityItem({ activity }: { activity: Activity }) {
  const router = useRouter()

  const getDescription = () => {
    switch (activity.activity_type) {
      case "rating":
        return (
          <>
            <span className="text-foreground/60"> rated </span>
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      case "comment":
        return (
          <>
            <span className="text-foreground/60"> commented on </span>
            {activity.target_user_name && (
              <><span className="font-medium">{activity.target_user_name}&apos;s</span><span className="text-foreground/60"> review of </span></>
            )}
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      case "reaction":
        return (
          <>
            <span className="text-foreground/60">
              {" "}reacted {REACTION_EMOJI_MAP[activity.reaction_type || ""] || activity.reaction_type} to{" "}
            </span>
            {activity.target_user_name && (
              <><span className="font-medium">{activity.target_user_name}&apos;s</span><span className="text-foreground/60"> review of </span></>
            )}
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Link
      href={`/collectives/${activity.collective_id}/movie/${activity.tmdb_id}/conversation`}
      className="flex gap-3 lg:gap-4 p-3.5 lg:p-5 bg-surface rounded-xl lg:rounded-[14px] border border-foreground/[0.04] mb-2.5 lg:mb-3"
    >
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/${activity.actor_id}`) }}
        className="cursor-pointer shrink-0"
      >
        <Avatar size="sm">
          <AvatarImage src={activity.actor_avatar || undefined} />
          <AvatarFallback>{activity.actor_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm lg:text-[15px] leading-[1.4] mb-1.5 lg:mb-2">
          <span className="font-semibold">{activity.actor_name}</span>
          {getDescription()}
        </p>

        {activity.activity_type === "rating" && activity.score != null && activity.score > 0 && (
          <div className="flex gap-0.5 mb-1.5 lg:mb-2 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="text-xs lg:text-sm"
                style={{ color: s <= Math.floor(activity.score! / 20) ? "#e07850" : "rgba(248,246,241,0.13)" }}
              >
                ★
              </span>
            ))}
            <span className="text-xs lg:text-sm text-accent ml-1">{(activity.score / 20).toFixed(1)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-surface-light rounded text-[11px] lg:text-xs text-foreground/50">
            {activity.collective_name}
          </span>
          <span className="text-[11px] lg:text-xs text-foreground/[0.25]">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {activity.poster_path && (
        <div className="relative w-11 h-[60px] lg:w-[52px] lg:h-[72px] rounded-md lg:rounded-lg overflow-hidden shrink-0">
          <Image
            src={`https://image.tmdb.org/t/p/w92${activity.poster_path}`}
            alt={activity.media_title}
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────

export function UserDashboard() {
  const { data, isLoading, mutate } = useSWR<DashboardData>("/api/user/dashboard", fetcher)
  const app = useStackApp()
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 lg:pb-0">
        {/* Desktop sidebar skeleton */}
        <div className="hidden lg:block fixed top-20 left-0 bottom-0 w-[280px] bg-surface border-r border-foreground/[0.06] p-6">
          <div className="h-32 bg-surface-light rounded-[14px] animate-pulse mb-6" />
          <div className="h-4 w-24 bg-surface-light rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-surface-light rounded-[10px] animate-pulse" />)}
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="lg:ml-[280px] px-5 lg:px-12 pt-3 lg:pt-8 space-y-6">
          <div className="h-16 bg-surface rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 lg:hidden gap-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-surface rounded-xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
            <div className="h-28 lg:h-24 bg-surface rounded-[14px] animate-pulse" />
            <div className="h-28 lg:h-24 bg-surface rounded-[14px] animate-pulse" />
          </div>
          <div className="h-40 bg-surface rounded-[14px] animate-pulse" />
        </div>
      </div>
    )
  }

  const { user, collectives = [], stats, recentActivity = [], insights, favorites = [] } = data || {}
  const firstName = user?.name?.split(" ")[0] || "User"
  const avgRating = insights?.avgRating ? (insights.avgRating / 20).toFixed(1) : "\u2014"

  const filteredActivity = recentActivity.filter((a) => {
    if (activityFilter === "all") return true
    if (activityFilter === "ratings") return a.activity_type === "rating"
    if (activityFilter === "discussions") return a.activity_type === "comment" || a.activity_type === "reaction"
    return true
  })
  const visibleActivity = showAllActivity ? filteredActivity : filteredActivity.slice(0, 5)

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">

      {/* ═══════════════════════════════════════════════════════
          Desktop Sidebar (hidden below lg)
          ═══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed top-20 left-0 bottom-0 w-[280px] bg-surface border-r border-foreground/[0.06] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-6">
          {/* User Greeting Card */}
          <div className="p-4 bg-surface-light rounded-[14px] mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar size="lg">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback>{firstName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[11px] text-foreground/50 mb-0.5">Welcome back</p>
                <p className="text-base font-semibold text-cream">{user?.name || firstName}</p>
              </div>
            </div>
            {/* Mini Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: stats?.movies_rated ?? 0, label: "Movies" },
                { value: avgRating, label: "Avg Rating" },
              ].map((stat, i) => (
                <div key={i} className="p-2.5 bg-surface rounded-lg text-center">
                  <p className="text-lg font-semibold text-cream">{stat.value}</p>
                  <p className="text-[10px] text-foreground/[0.3] uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collectives List */}
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Your Collectives</SectionLabel>
          </div>
          <div className="flex flex-col gap-1.5">
            {collectives.map((collective) => (
              <Link
                key={collective.id}
                href={`/collectives/${collective.id}`}
                className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-surface-light transition-colors"
              >
                <div className="size-9 rounded-[10px] bg-cool/15 border border-cool/30 flex items-center justify-center text-sm">
                  👥
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cream truncate">{collective.name}</p>
                  <p className="text-[11px] text-foreground/[0.3]">
                    {collective.member_count} member{collective.member_count !== 1 ? "s" : ""}
                  </p>
                </div>
                {collective.role === "owner" && (
                  <span className="text-[9px] font-semibold text-cool uppercase tracking-wide">Owner</span>
                )}
              </Link>
            ))}
            <Link
              href="/collectives"
              className="flex items-center gap-3 p-3 rounded-[10px] border border-dashed border-foreground/[0.1] hover:bg-surface-light/50 transition-colors"
            >
              <div className="size-9 rounded-[10px] bg-surface-light flex items-center justify-center">
                <PlusIcon size={18} />
              </div>
              <span className="text-sm text-foreground/[0.3]">Create collective</span>
            </Link>
          </div>
        </div>

        {/* Settings at bottom */}
        <div className="mt-auto p-6 pt-0">
          <Link
            href="/handler/account-settings"
            className="flex items-center gap-2.5 p-3 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface-light transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          Main Content Area
          ═══════════════════════════════════════════════════════ */}
      <div className="lg:ml-[280px]">

        {/* ─── Mobile Header ───────────────────────────────── */}
        <div className="lg:hidden flex items-start justify-between px-5 pt-3 pb-5">
          <div>
            <p className="text-[13px] text-foreground/50 mb-1">Welcome back</p>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-cream">{firstName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative size-10 rounded-full bg-surface border border-foreground/[0.06] flex items-center justify-center"
            >
              <BellIcon size={20} />
              <div className="absolute top-2 right-2 size-2 rounded-full bg-accent border-2 border-surface" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-full">
                  <Avatar size="lg">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback>{firstName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/discover" className="flex items-center gap-2 cursor-pointer">
                    <Compass className="h-4 w-4" />
                    Discover
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/collectives" className="flex items-center gap-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    Collectives
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about" className="flex items-center gap-2 cursor-pointer">
                    <Info className="h-4 w-4" />
                    About
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/handler/account-settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => app.signOut()} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ─── Desktop Header ──────────────────────────────── */}
        <div className="hidden lg:flex items-center justify-between px-12 pt-8 pb-8">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-cream mb-1">Dashboard</h1>
            <p className="text-[15px] text-foreground/50">Here&apos;s what&apos;s happening across your collectives</p>
          </div>
          <Link
            href="/notifications"
            className="relative size-11 rounded-full bg-surface border border-foreground/[0.06] flex items-center justify-center hover:bg-surface-light transition-colors"
          >
            <BellIcon size={22} />
            <div className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent" />
          </Link>
        </div>

        {/* ─── Mobile Quick Stats ──────────────────────────── */}
        <div className="lg:hidden px-5 pb-6">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: stats?.movies_rated ?? 0, label: "Movies" },
              { value: stats?.shows_rated ?? 0, label: "Shows" },
              { value: stats?.collective_count ?? 0, label: "Collectives" },
              { value: avgRating, label: "Avg" },
            ].map((stat, i) => (
              <div key={i} className="py-3.5 px-2.5 bg-surface rounded-xl border border-foreground/[0.04] text-center">
                <p className="text-xl font-semibold text-cream mb-0.5">{stat.value}</p>
                <p className="text-[9px] text-foreground/[0.3] uppercase tracking-[0.05em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Quick Actions ────────────────────────────────── */}
        <div className="px-5 lg:px-12 pb-6 lg:pb-10">
          <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
            <Link
              href="/tonights-pick"
              className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 p-4 lg:p-7 rounded-[14px] lg:rounded-2xl text-left bg-gradient-to-br from-accent/[0.12] to-accent/[0.03] border border-accent/[0.18] hover:border-accent/30 transition-colors"
            >
              <div className="size-11 lg:size-14 rounded-xl lg:rounded-[14px] bg-accent/20 flex items-center justify-center shrink-0">
                <TonightsPickIcon color="#e07850" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] lg:text-lg font-medium text-cream">Tonight&apos;s Pick</p>
                <p className="text-xs lg:text-sm text-foreground/50 mt-0.5">Find something to watch</p>
              </div>
              <div className="hidden lg:block">
                <ChevronRightIcon color="rgba(248,246,241,0.3)" size={20} />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 p-4 lg:p-7 rounded-[14px] lg:rounded-2xl text-left bg-surface border border-foreground/[0.06] hover:border-foreground/10 transition-colors"
            >
              <div className="size-11 lg:size-14 rounded-xl lg:rounded-[14px] bg-surface-light flex items-center justify-center shrink-0">
                <LogFilmIcon size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] lg:text-lg font-medium text-cream">Log a Film</p>
                <p className="text-xs lg:text-sm text-foreground/50 mt-0.5">Rate what you watched</p>
              </div>
              <div className="hidden lg:block">
                <ChevronRightIcon color="rgba(248,246,241,0.3)" size={20} />
              </div>
            </button>
          </div>
        </div>

        {/* ─── Mobile Collectives (horizontal scroll) ──────── */}
        <div className="lg:hidden pb-6">
          <div className="flex items-center justify-between px-5 mb-3.5">
            <SectionLabel>Your Collectives</SectionLabel>
            <Link href="/collectives" className="flex items-center gap-1 text-[13px] text-cool">
              View All
              <ChevronRightIcon color="#7b8cde" size={14} />
            </Link>
          </div>

          <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {collectives.map((collective) => (
              <Link
                key={collective.id}
                href={`/collectives/${collective.id}`}
                className="shrink-0 w-40 p-4 bg-surface rounded-[14px] border border-foreground/[0.04] relative"
              >
                <div className="size-11 rounded-xl bg-cool/15 border border-cool/30 flex items-center justify-center mb-3 text-lg">
                  👥
                </div>
                <p className="text-sm font-semibold text-cream truncate mb-1">{collective.name}</p>
                <p className="text-xs text-foreground/[0.3] mb-2">
                  {collective.member_count} member{collective.member_count !== 1 ? "s" : ""}
                </p>
                {collective.role === "owner" && (
                  <span className="inline-block px-2 py-1 bg-cool/15 rounded-md text-[10px] font-semibold text-cool uppercase tracking-[0.05em]">
                    Owner
                  </span>
                )}
              </Link>
            ))}

            {/* Create new card */}
            <Link
              href="/collectives"
              className="shrink-0 w-40 p-4 rounded-[14px] border border-dashed border-foreground/[0.08] flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div className="size-11 rounded-xl bg-surface flex items-center justify-center mb-3">
                <PlusIcon size={24} />
              </div>
              <p className="text-[13px] text-foreground/[0.25]">Create new</p>
            </Link>
          </div>
        </div>

        {/* ─── Mobile Top 3 Films ──────────────────────────── */}
        {favorites.length > 0 && (
          <div className="lg:hidden px-5 pb-6">
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>Your Top {Math.min(favorites.length, 3)} Films</SectionLabel>
              <Link href="/profile" className="text-[13px] text-cool">Edit</Link>
            </div>
            <div className="flex gap-2.5">
              {favorites.slice(0, 3).map((film, i) => (
                <Link key={film.tmdb_id} href={`/movies/${film.tmdb_id}`} className="flex-1 relative">
                  <div className={`absolute top-2 left-2 z-10 size-[22px] rounded-md flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-accent text-background" : "bg-surface-light text-cream"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="aspect-[2/3] rounded-[10px] overflow-hidden mb-2 bg-gradient-to-br from-accent/40 to-cool/20">
                    {film.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
                        alt={film.title}
                        width={185}
                        height={278}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs font-medium text-cream truncate">{film.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Activity + Desktop Right Column ─────────────── */}
        <div className="px-5 lg:px-12 pb-6">
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">

            {/* Activity Feed */}
            <div>
              <div className="flex items-center justify-between mb-3.5 lg:mb-5">
                <SectionLabel>Collective Activity</SectionLabel>
                {/* Filter tabs */}
                <div className="flex gap-1.5">
                  {(["all", "ratings", "discussions"] as ActivityFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => { setActivityFilter(filter); setShowAllActivity(false) }}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors capitalize ${
                        activityFilter === filter
                          ? "bg-accent/15 text-accent lg:bg-accent lg:text-background"
                          : "bg-surface text-foreground/50 lg:bg-transparent lg:border lg:border-foreground/10"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActivity.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-foreground/50">No recent activity</p>
                  <p className="text-xs text-foreground/[0.25] mt-1">Invite friends to see their activity here</p>
                </div>
              ) : (
                <>
                  {visibleActivity.map((activity, i) => (
                    <DashboardActivityItem
                      key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                      activity={activity}
                    />
                  ))}

                  {!showAllActivity && filteredActivity.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllActivity(true)}
                      className="w-full py-3 mt-1 text-[13px] lg:text-sm font-medium text-cool bg-surface rounded-xl border border-foreground/[0.04] hover:bg-surface-light transition-colors"
                    >
                      Load more
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Desktop Right Column */}
            <div className="hidden lg:block space-y-8">
              {/* Top Films - list format */}
              {favorites.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <SectionLabel>Your Top {Math.min(favorites.length, 3)} Films</SectionLabel>
                    <Link href="/profile" className="text-[13px] text-cool hover:text-cool/80 transition-colors">Edit</Link>
                  </div>
                  <div className="bg-surface rounded-[14px] p-4 border border-foreground/[0.04]">
                    {favorites.slice(0, 3).map((film, i) => (
                      <Link
                        key={film.tmdb_id}
                        href={`/movies/${film.tmdb_id}`}
                        className={`flex items-center gap-3.5 py-3 hover:opacity-80 transition-opacity ${
                          i < Math.min(favorites.length, 3) - 1 ? "border-b border-foreground/[0.04]" : ""
                        }`}
                      >
                        <div className={`size-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          i === 0 ? "bg-accent text-background" : "bg-surface-light text-cream"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="w-10 h-14 rounded-md overflow-hidden bg-gradient-to-br from-accent/40 to-cool/20 shrink-0">
                          {film.poster_path && (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                              alt={film.title}
                              width={40}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cream">{film.title}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div>
                <SectionLabel className="mb-4 block">Your Stats</SectionLabel>
                <div className="bg-surface rounded-[14px] p-5 border border-foreground/[0.04]">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: stats?.movies_rated ?? 0, label: "Movies" },
                      { value: stats?.shows_rated ?? 0, label: "Shows" },
                      { value: stats?.collective_count ?? 0, label: "Collectives" },
                      { value: avgRating, label: "Avg Rating" },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 bg-surface-light rounded-[10px] text-center">
                        <p className="text-2xl font-semibold text-cream mb-1">{stat.value}</p>
                        <p className="text-[11px] text-foreground/[0.3] uppercase tracking-wide">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <LogFilmModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
