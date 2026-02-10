"use client"

import { useState } from "react"
import { useStackApp } from "@stackframe/stack"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { Settings, LogOut, LayoutDashboard, User, Compass, Users, Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SectionLabel } from "@/components/ui/section-label"
import { LogFilmModal } from "@/components/modals/log-film-modal"
import { LogFilmFAB } from "@/components/soulframe/fab"
import { CollectiveBadge, getCollectiveInitials, getCollectiveGradient } from "@/components/soulframe/collective-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BellIcon, ChevronRightIcon, PlayIcon, ArrowIcon, PlusIcon } from "@/components/dashboard/dashboard-icons"
import { DashboardActivityItem, getUserGradient, type Activity } from "@/components/dashboard/dashboard-activity-item"
import { PlannedWatchesSection } from "@/components/dashboard/planned-watches-section"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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

const STAT_COLORS = ["#ff6b2d", "#3d5a96", "#4a9e8e", "#c4616a"]

// ---- Main Dashboard ----

export function UserDashboard() {
  const { data, isLoading, mutate } = useSWR<DashboardData>("/api/user/dashboard", fetcher)
  const app = useStackApp()
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 lg:pb-0">
        <div className="hidden lg:block fixed top-16 left-0 bottom-0 w-[260px] bg-card border-r border-cream-faint/[0.08] p-6">
          <div className="h-32 bg-surface-light rounded-[14px] animate-pulse mb-6" />
          <div className="h-4 w-24 bg-surface-light rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-surface-light rounded-[10px] animate-pulse" />)}
          </div>
        </div>
        <div className="lg:ml-[260px] px-5 lg:px-9 pt-3 lg:pt-8 space-y-6">
          <div className="h-16 bg-card rounded-[14px] animate-pulse" />
          <div className="grid grid-cols-4 lg:hidden gap-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-card rounded-[14px] animate-pulse" />)}
          </div>
          <div className="h-28 bg-card rounded-[14px] animate-pulse" />
          <div className="h-40 bg-card rounded-[14px] animate-pulse" />
        </div>
      </div>
    )
  }

  const { user, collectives = [], stats, recentActivity = [], insights, favorites = [] } = data || {}
  const firstName = user?.name?.split(" ")[0] || "User"
  const avgRating = insights?.avgRating ? (insights.avgRating / 20).toFixed(1) : "\u2014"
  const userGradient = getUserGradient(user?.name || "U")

  const filteredActivity = recentActivity.filter((a) => {
    if (activityFilter === "all") return true
    if (activityFilter === "ratings") return a.activity_type === "rating"
    if (activityFilter === "discussions") return a.activity_type === "comment" || a.activity_type === "reaction"
    return true
  })
  const visibleActivity = showAllActivity ? filteredActivity : filteredActivity.slice(0, 5)

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">

      {/* ══════ Desktop Three-Column Layout ══════ */}
      <div className="hidden lg:grid" style={{ gridTemplateColumns: "260px 1fr 300px", maxWidth: 1320, margin: "0 auto", minHeight: "100vh" }}>

        {/* ── Left Sidebar ── */}
        <aside className="p-6 border-r border-cream-faint/[0.03] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex flex-col sf-reveal">
          {/* User card */}
          <div className="p-5 bg-card rounded-[14px] border border-cream-faint/[0.05] mb-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]" style={{ background: `linear-gradient(to right, ${userGradient[0]}50, transparent)` }} />
            <div className="flex items-center gap-3 mb-4">
              <Avatar size="lg" gradient={userGradient}>
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback>{(user?.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[11px] text-cream-faint tracking-[0.1em] uppercase mb-0.5">Welcome back</p>
                <p className="text-base font-bold text-cream tracking-[-0.02em]">{user?.name || firstName}</p>
              </div>
            </div>
            <div className="flex gap-0 border-t border-cream-faint/[0.08] pt-3.5">
              {[
                { num: stats?.movies_rated ?? 0, label: "Movies" },
                { num: avgRating, label: "Avg Rating" },
              ].map((stat, i) => (
                <div key={i} className="flex-1 text-center" style={{ borderRight: i === 0 ? "1px solid rgba(107,99,88,0.08)" : "none" }}>
                  <p className="text-[22px] font-bold text-cream tracking-[-0.03em]">{stat.num}</p>
                  <p className="text-[10px] text-cream-faint uppercase tracking-[0.1em] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collectives */}
          <SectionLabel className="mb-3 px-1">Your Collectives</SectionLabel>
          <div className="flex flex-col gap-0.5 mb-2">
            {collectives.map((collective, i) => (
              <Link
                key={collective.id}
                href={`/collectives/${collective.id}`}
                className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-cream/[0.03] transition-colors"
              >
                <CollectiveBadge
                  initials={getCollectiveInitials(collective.name)}
                  colors={getCollectiveGradient(i)}
                  size={34}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-cream truncate tracking-[-0.01em]">{collective.name}</p>
                  <p className="text-xs text-cream-faint">{collective.member_count} member{collective.member_count !== 1 ? "s" : ""}</p>
                </div>
                {collective.role === "owner" && (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: getCollectiveGradient(i)[0] }}>Owner</span>
                )}
              </Link>
            ))}
            <Link
              href="/collectives"
              className="flex items-center gap-3 p-2.5 rounded-[10px] border border-dashed border-cream-faint/[0.12] mt-2 hover:bg-cream/[0.02] transition-colors"
            >
              <div className="size-[34px] rounded-full border-[1.5px] border-dashed border-cream-faint/[0.2] flex items-center justify-center">
                <PlusIcon size={14} />
              </div>
              <span className="text-[13px] text-cream-faint">Create collective</span>
            </Link>
          </div>

          <div className="flex-1" />

          <Link
            href="/handler/account-settings"
            className="flex items-center gap-2.5 p-2.5 rounded-[10px] text-cream-faint hover:text-cream hover:bg-cream/[0.03] transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-[13px]">Settings</span>
          </Link>
        </aside>

        {/* ── Center Column ── */}
        <main className="px-9 py-7 min-h-screen">
          {/* Title */}
          <div className="mb-7 sf-reveal">
            <h1 className="text-[30px] font-bold text-cream tracking-[-0.03em]">Dashboard</h1>
            <p className="text-sm text-cream-muted mt-1">Here&apos;s what&apos;s happening across your collectives</p>
          </div>

          {/* Tonight's Pick Hero */}
          <div className="mb-7 sf-reveal sf-delay-1">
            <Link
              href="/tonights-pick"
              className="block rounded-[16px] relative overflow-visible transition-all duration-500 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(155deg, rgba(61,90,150,0.09), #1a1714 45%, rgba(255,107,45,0.04))",
                border: "1px solid rgba(61,90,150,0.12)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, rgba(61,90,150,0.4), rgba(255,107,45,0.2), transparent)" }} />
              <div className="flex items-stretch">
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-7 rounded-full flex items-center justify-center" style={{ background: "rgba(61,90,150,0.12)", border: "1px solid rgba(61,90,150,0.2)" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3d5a96" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue">Tonight&apos;s Pick</span>
                  </div>
                  <p className="text-[21px] font-semibold text-cream tracking-[-0.02em] leading-[1.3] mb-1.5">Not sure what to watch?</p>
                  <p className="text-[13.5px] text-cream-muted leading-[1.5] mb-4">Get a recommendation based on your mood and taste.</p>
                  <span className="inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded-[22px] text-[13px] font-medium text-blue-light" style={{ background: "rgba(61,90,150,0.1)", border: "1px solid rgba(61,90,150,0.16)" }}>
                    Find a film <ArrowIcon />
                  </span>
                </div>
                {/* Stacked poster visual */}
                <div className="w-[140px] relative flex items-center justify-center">
                  {[2, 1, 0].map((i) => (
                    <div key={i} className="absolute" style={{
                      width: 68, height: 96, borderRadius: 8,
                      background: `linear-gradient(145deg, ${["#252119", "#211e19", "#1a1714"][i]}, #1a1714)`,
                      border: `1px solid rgba(107,99,88,${[0.04, 0.06, 0.08][i]})`,
                      transform: `rotate(${[-8, -3, 4][i]}deg) translateX(${[-8, 0, 8][i]}px)`,
                      boxShadow: "0 2px 10px rgba(10,9,8,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: i,
                    }}>
                      {i === 2 && (
                        <div className="size-[30px] rounded-full flex items-center justify-center" style={{ background: "rgba(61,90,150,0.12)", border: "1px solid rgba(61,90,150,0.18)" }}>
                          <PlayIcon />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Planned Watches */}
          <div className="mb-7 sf-reveal sf-delay-2">
            <PlannedWatchesSection />
          </div>

          {/* Activity header + filters */}
          <div className="flex justify-between items-center mb-4 sf-reveal sf-delay-2">
            <SectionLabel>Collective Activity</SectionLabel>
            <div className="flex gap-1.5">
              {(["all", "ratings", "discussions"] as ActivityFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { setActivityFilter(filter); setShowAllActivity(false) }}
                  className="px-3.5 py-[5px] rounded-[18px] text-xs capitalize transition-colors"
                  style={{
                    background: activityFilter === filter ? "rgba(61,90,150,0.1)" : "transparent",
                    color: activityFilter === filter ? "#5a7cb8" : "#6b6358",
                    border: `1px solid ${activityFilter === filter ? "rgba(61,90,150,0.18)" : "transparent"}`,
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="sf-reveal sf-delay-3">
            {filteredActivity.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-cream-muted">No recent activity</p>
                <p className="text-xs text-cream-faint mt-1">Invite friends to see their activity here</p>
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
                    className="w-full py-3 mt-1 text-[13px] font-medium text-blue-light bg-card rounded-[14px] border border-cream-faint/[0.05] hover:bg-surface-light transition-colors"
                  >
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="p-6 border-l border-cream-faint/[0.03] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          {/* Top 3 Films */}
          {favorites.length > 0 && (
            <div className="sf-reveal sf-delay-2">
              <div className="flex items-center justify-between mb-3.5">
                <SectionLabel>Your Top {Math.min(favorites.length, 3)} Films</SectionLabel>
                <Link href="/profile" className="text-xs font-medium text-orange hover:text-orange-muted transition-colors">Edit</Link>
              </div>
              <div className="bg-card rounded-[14px] border border-cream-faint/[0.05] relative">
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]" style={{ background: "linear-gradient(to right, rgba(255,107,45,0.25), transparent)" }} />
                {favorites.slice(0, 3).map((film, i) => {
                  const filmColor = ["#ff6b2d", "#3d5a96", "#4a9e8e"][i]
                  return (
                    <Link
                      key={film.tmdb_id}
                      href={`/movies/${film.tmdb_id}`}
                      className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-cream/[0.02] transition-colors ${
                        i < Math.min(favorites.length, 3) - 1 ? "border-b border-cream-faint/[0.05]" : ""
                      }`}
                    >
                      <div className="size-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: `${filmColor}18`, border: `1px solid ${filmColor}25`, color: filmColor }}>
                        {i + 1}
                      </div>
                      <div className="w-[38px] h-[54px] rounded-md overflow-hidden shrink-0 border border-cream-faint/[0.08]" style={{ background: `linear-gradient(145deg, ${filmColor}10, #252119)` }}>
                        {film.poster_path && (
                          <Image src={`https://image.tmdb.org/t/p/w92${film.poster_path}`} alt={film.title} width={38} height={54} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-cream tracking-[-0.01em] leading-[1.3]">{film.title}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mt-6 sf-reveal sf-delay-3">
            <SectionLabel className="mb-3.5 block">Your Stats</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: stats?.movies_rated ?? 0, label: "Movies" },
                { value: stats?.shows_rated ?? 0, label: "Shows" },
                { value: stats?.collective_count ?? 0, label: "Collectives" },
                { value: avgRating, label: "Avg Rating" },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-card rounded-[12px] border border-cream-faint/[0.05] text-center relative">
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[12px]" style={{ background: `linear-gradient(to right, ${STAT_COLORS[i]}35, transparent)` }} />
                  <p className="text-[24px] font-bold text-cream tracking-[-0.03em]">{stat.value}</p>
                  <p className="text-[10px] text-cream-faint uppercase tracking-[0.1em] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ══════ Mobile Layout ══════ */}
      <div className="lg:hidden">

        {/* Mobile Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-5 sf-reveal">
          <div>
            <p className="text-xs text-cream-faint uppercase tracking-[0.13em] mb-1">Welcome back</p>
            <h1 className="text-[38px] font-bold tracking-[-0.03em] text-cream leading-[1.05]">{firstName}</h1>
          </div>
          <div className="flex items-center gap-3.5">
            <Link
              href="/notifications"
              className="relative size-10 rounded-full bg-card border border-cream-faint/[0.08] flex items-center justify-center"
            >
              <BellIcon size={20} />
              <div className="absolute top-2 right-2 size-[7px] rounded-full bg-orange" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-blue/50 rounded-full">
                  <Avatar size="lg" gradient={userGradient}>
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback>{(user?.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
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
                  <Link href="/" className="flex items-center gap-2 cursor-pointer"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/discover" className="flex items-center gap-2 cursor-pointer"><Compass className="h-4 w-4" />Discover</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/collectives" className="flex items-center gap-2 cursor-pointer"><Users className="h-4 w-4" />Collectives</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about" className="flex items-center gap-2 cursor-pointer"><Info className="h-4 w-4" />About</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer"><User className="h-4 w-4" />My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/handler/account-settings" className="flex items-center gap-2 cursor-pointer"><Settings className="h-4 w-4" />Account Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5"><ThemeToggle /></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => app.signOut()} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Stats Row */}
        <div className="flex gap-0 px-6 pb-7 sf-reveal sf-delay-1">
          {[
            { num: stats?.movies_rated ?? 0, label: "Films" },
            { num: stats?.shows_rated ?? 0, label: "Shows" },
            { num: stats?.collective_count ?? 0, label: "Collectives" },
            { num: avgRating, label: "Avg" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex-1 text-center py-4">
                <p className="text-[26px] font-bold text-cream tracking-[-0.03em] leading-none">{stat.num}</p>
                <p className="text-[10px] text-cream-faint uppercase tracking-[0.14em] mt-1.5">{stat.label}</p>
              </div>
              {i < 3 && (
                <div className="w-px self-stretch my-2" style={{ background: "linear-gradient(to bottom, transparent, rgba(107,99,88,0.15), transparent)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile Tonight's Pick Hero */}
        <div className="px-6 pb-7 sf-reveal sf-delay-2">
          <Link
            href="/tonights-pick"
            className="block rounded-[16px] relative overflow-visible transition-all duration-500"
            style={{
              background: "linear-gradient(155deg, rgba(61,90,150,0.1), #1a1714 40%, rgba(255,107,45,0.05))",
              border: "1px solid rgba(61,90,150,0.12)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, rgba(61,90,150,0.45), rgba(255,107,45,0.2), transparent)" }} />
            <div className="flex items-stretch">
              <div className="flex-1 p-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue mb-2.5 block">Tonight&apos;s Pick</span>
                <p className="text-[20px] font-semibold text-cream tracking-[-0.02em] leading-[1.25]">Not sure what to watch?</p>
                <p className="text-[13px] text-cream-muted mt-1.5 leading-[1.5]">Get a recommendation based on your mood and taste.</p>
                <span className="inline-flex items-center gap-1.5 mt-3.5 px-4 py-2 rounded-[20px] text-xs font-medium text-blue-light" style={{ background: "rgba(61,90,150,0.1)", border: "1px solid rgba(61,90,150,0.16)" }}>
                  Find a film <ArrowIcon />
                </span>
              </div>
              {/* Stacked poster visual */}
              <div className="w-[100px] relative flex items-center justify-center mr-2">
                {[2, 1, 0].map((i) => (
                  <div key={i} className="absolute" style={{
                    width: 58, height: 82, borderRadius: 8,
                    background: `linear-gradient(145deg, ${["#252119", "#211e19", "#1a1714"][i]}, #1a1714)`,
                    border: `1px solid rgba(107,99,88,${[0.04, 0.06, 0.1][i]})`,
                    transform: `rotate(${[-8, -3, 4][i]}deg) translateX(${[-6, 0, 6][i]}px)`,
                    boxShadow: "0 2px 8px rgba(10,9,8,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: i,
                  }}>
                    {i === 2 && (
                      <div className="size-7 rounded-full flex items-center justify-center" style={{ background: "rgba(61,90,150,0.12)", border: "1px solid rgba(61,90,150,0.18)" }}>
                        <PlayIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>

        {/* Mobile Planned Watches */}
        <div className="px-6 pb-6 sf-reveal sf-delay-3">
          <PlannedWatchesSection />
        </div>

        {/* Mobile Collectives */}
        <div className="pb-6 sf-reveal sf-delay-3">
          <div className="flex items-center justify-between px-6 mb-3.5">
            <SectionLabel>Your Collectives</SectionLabel>
            <Link href="/collectives" className="flex items-center gap-1 text-xs text-cream-muted">
              View All <ChevronRightIcon color="#a69e90" size={12} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {collectives.map((collective, i) => {
              const colors = getCollectiveGradient(i)
              return (
                <Link
                  key={collective.id}
                  href={`/collectives/${collective.id}`}
                  className="shrink-0 w-[155px] p-4 bg-card rounded-[14px] border border-cream-faint/[0.05] relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]" style={{ background: `linear-gradient(to right, ${colors[0]}, ${colors[1]}60, transparent)` }} />
                  <CollectiveBadge initials={getCollectiveInitials(collective.name)} colors={colors} size={40} />
                  <p className="text-[15px] font-semibold text-cream mt-3 mb-1 truncate tracking-[-0.01em] leading-[1.3]">{collective.name}</p>
                  <p className="text-xs text-cream-muted leading-[1.5]">{collective.member_count} member{collective.member_count !== 1 ? "s" : ""}</p>
                  {collective.role === "owner" && (
                    <span
                      className="inline-block mt-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] rounded px-[7px] py-[3px]"
                      style={{ color: colors[0], border: `1px solid ${colors[0]}30` }}
                    >
                      owner
                    </span>
                  )}
                </Link>
              )
            })}
            <Link
              href="/collectives"
              className="shrink-0 w-[155px] rounded-[14px] border border-dashed border-cream-faint/[0.08] flex flex-col items-center justify-center text-center min-h-[140px]"
            >
              <div className="size-11 rounded-full bg-card flex items-center justify-center mb-3">
                <PlusIcon size={24} />
              </div>
              <p className="text-[13px] text-cream-faint">Create new</p>
            </Link>
          </div>
        </div>

        {/* Mobile Top 3 Films */}
        {favorites.length > 0 && (
          <div className="px-6 pb-6 sf-reveal sf-delay-4">
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>Your Top {Math.min(favorites.length, 3)}</SectionLabel>
              <Link href="/profile" className="text-xs font-medium text-orange">Edit</Link>
            </div>
            <div className="flex gap-3 items-end">
              {favorites.slice(0, 3).map((film, i) => {
                const filmColor = ["#ff6b2d", "#3d5a96", "#4a9e8e"][i]
                return (
                  <Link key={film.tmdb_id} href={`/movies/${film.tmdb_id}`} className="flex-1 relative" style={{ flex: i === 0 ? 1.1 : 1 }}>
                    <div className="aspect-[2/3] rounded-[10px] relative bg-card border border-cream-faint/[0.05] flex flex-col justify-end p-3">
                      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[10px]" style={{ background: `linear-gradient(to right, ${filmColor}, ${filmColor}30, transparent)` }} />
                      {/* Rank watermark */}
                      <span className="absolute top-1.5 left-2.5 text-[56px] font-extrabold text-cream/[0.05] leading-none">{i + 1}</span>
                      {film.poster_path ? (
                        <>
                          <Image src={`https://image.tmdb.org/t/p/w185${film.poster_path}`} alt={film.title} fill className="object-cover rounded-[10px]" />
                          <div className="absolute bottom-0 left-0 right-0 h-[65%] rounded-b-[10px]" style={{ background: `linear-gradient(to top, rgba(10,9,8,0.8), transparent)` }} />
                        </>
                      ) : (
                        <div className="absolute inset-0 rounded-[10px]" style={{ background: `linear-gradient(155deg, ${filmColor}10, #1a1714, #252119)` }} />
                      )}
                      <p className="relative z-10 text-[13.5px] font-semibold text-cream leading-[1.2] tracking-[-0.01em]">{film.title}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Mobile Activity Feed */}
        <div className="px-6 pb-6 sf-reveal sf-delay-5">
          <div className="flex items-center justify-between mb-3.5">
            <SectionLabel>Collective Activity</SectionLabel>
          </div>
          {/* Filter pills */}
          <div className="flex gap-2 mb-3">
            {(["all", "ratings", "discussions"] as ActivityFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => { setActivityFilter(filter); setShowAllActivity(false) }}
                className="px-3.5 py-1.5 rounded-[20px] text-xs capitalize transition-colors"
                style={{
                  background: activityFilter === filter ? "rgba(61,90,150,0.1)" : "transparent",
                  color: activityFilter === filter ? "#5a7cb8" : "#6b6358",
                  border: `1px solid ${activityFilter === filter ? "rgba(61,90,150,0.18)" : "transparent"}`,
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredActivity.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-cream-muted">No recent activity</p>
              <p className="text-xs text-cream-faint mt-1">Invite friends to see their activity here</p>
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
                  className="w-full py-3 mt-1 text-[13px] font-medium text-blue-light bg-card rounded-[14px] border border-cream-faint/[0.05] hover:bg-surface-light transition-colors"
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>

        {/* Spacer for bottom nav + FAB */}
        <div className="h-10" />
      </div>

      {/* FAB — Log a Film */}
      <LogFilmFAB onClick={() => setShowLogModal(true)} />

      <LogFilmModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
