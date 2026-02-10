"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Settings, ChevronRight } from "lucide-react"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { GeneralDiscussion } from "@/components/general-discussion"
import { TonightsPick } from "@/components/tonights-pick"
import { MembersModal } from "@/components/members-modal"
import { SectionLabel } from "@/components/ui/section-label"
import { getImageUrl } from "@/lib/tmdb/image"
import { CollectiveBadge, getCollectiveGradient, getCollectiveInitials } from "@/components/soulframe/collective-badge"
import { LogFilmFAB } from "@/components/soulframe/fab"
import { BackIcon, SearchIcon, PlusIcon, DiscussionIcon, StarIcon } from "@/components/collective/collective-icons"
import { PillTabBar, EASING, type CollectiveTab } from "@/components/collective/pill-tab-bar"
import { InviteModal } from "@/components/collective/invite-modal"
import { DashboardActivityItem, type Activity as FeedActivity } from "@/components/dashboard/dashboard-activity-item"
import { LogFilmModal } from "@/components/modals/log-film-modal"

// ─── Color helpers ──────────────────────────────────────────

const MEMBER_COLORS: [string, string][] = [
  ["#4a9e8e", "#6bc4b4"], // teal
  ["#c4616a", "#d88088"], // rose
  ["#ff6b2d", "#ff8f5e"], // orange
  ["#3d5a96", "#5a7cb8"], // blue
  ["#2e4470", "#5a7cb8"], // muted blue
]

const FILM_COLORS = [
  "#ff6b2d", "#ff8f5e", "#3d5a96", "#4a9e8e", "#2e4470",
  "#c4616a", "#ff6b2d", "#cc5624", "#6b6358",
]

function getMemberColor(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length]
}

// ─── Types ──────────────────────────────────────────────────

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
}

type TVShowStat = {
  tv_show_id: number
  name: string | null
  poster_path: string | null
  first_air_date: string | null
  avg_score: number
  rating_count: number
}

type Member = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
  joined_at: string
}

type MemberSimilarity = {
  user1_id: string
  user2_id: string
  user1_name: string
  user2_name: string
  similarity_score: number
}

type Analytics = {
  total_movies_rated: number
  total_ratings: number
  avg_collective_score: number
  active_raters: number
}

type Props = {
  collectiveId: string
  collectiveName: string
  collectiveDescription?: string | null
  memberCount: number
  userRole: string
  currentUserId: string
  currentUserName?: string
  movieStats: MovieStat[]
  tvShowStats: TVShowStat[]
  members: Member[]
  analytics: Analytics
  memberSimilarity: MemberSimilarity[]
  insightsContent: React.ReactNode
}

// ─── Main Component ─────────────────────────────────────────

export function MobileCollectiveView({
  collectiveId,
  collectiveName,
  collectiveDescription,
  memberCount,
  userRole,
  currentUserId,
  currentUserName,
  movieStats,
  tvShowStats,
  members,
  analytics,
  memberSimilarity,
  insightsContent,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CollectiveTab>("feed")
  const [recentActivity, setRecentActivity] = useState<FeedActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Log film modal state
  const [showLogModal, setShowLogModal] = useState(false)

  // Fetch recent activity for feed tab
  useEffect(() => {
    if (activeTab === "feed") {
      fetchRecentActivity()
    }
  }, [activeTab, collectiveId])

  const fetchRecentActivity = async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/activity?limit=10`)
      if (res.ok) {
        const data = await res.json()
        setRecentActivity(data.activity || [])
      }
    } catch (error) {
      console.error("Error fetching activity:", error)
    } finally {
      setActivityLoading(false)
    }
  }

  // Set data attribute on body for fullscreen Tonight's Pick experience
  useEffect(() => {
    if (activeTab === "tonights-pick") {
      document.body.setAttribute("data-tonights-pick-active", "true")
    } else {
      document.body.removeAttribute("data-tonights-pick-active")
    }
    return () => { document.body.removeAttribute("data-tonights-pick-active") }
  }, [activeTab])

  // Scroll tracking for mobile sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const roleText = userRole === "owner" ? "You're the owner" : "Member"
  const badgeColors = getCollectiveGradient(0)
  const badgeInitials = getCollectiveInitials(collectiveName)

  return (
    <div className={`bg-background lg:pb-0 lg:flex ${activeTab === "tonights-pick" ? "h-dvh overflow-hidden flex flex-col" : "min-h-screen pb-20"}`}>
      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[300px] lg:border-r lg:p-6"
        style={{ background: "#1a1714", borderColor: "rgba(107,99,88,0.06)" }}
      >
        <button
          type="button"
          onClick={() => router.push("/collectives")}
          className="flex items-center gap-2.5 mb-6"
          style={{ color: "#a69e90", transition: `color 0.2s` }}
        >
          <BackIcon size={20} color="currentColor" />
          <span style={{ fontSize: 14 }}>Back to Dashboard</span>
        </button>

        {/* Collective header */}
        <div className="flex items-center gap-3.5 mb-6 p-4 rounded-2xl" style={{ background: "rgba(107,99,88,0.06)" }}>
          <CollectiveBadge initials={badgeInitials} colors={badgeColors} size={52} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e2d6", letterSpacing: "-0.02em" }}>{collectiveName}</h2>
            <p style={{ fontSize: 13, color: "#a69e90", marginTop: 2 }}>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
              <span style={{ color: "rgba(107,99,88,0.4)", margin: "0 6px" }}>·</span>
              <span style={{ color: "#3d5a96" }}>{roleText}</span>
            </p>
          </div>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto">
          <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#6b6358", marginBottom: 12 }}>Members</p>
          <div className="space-y-1">
            {members.map((member) => {
              const name = member.name || member.email
              const colors = getMemberColor(name)
              return (
                <Link
                  key={member.id}
                  href={`/user/${member.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107,99,88,0.04)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#0f0d0b",
                      boxShadow: `0 2px 8px ${colors[0]}22`,
                      flexShrink: 0,
                    }}
                  >
                    {name[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#e8e2d6" }}>{name}</p>
                    <p style={{ fontSize: 11, color: "#6b6358", textTransform: "capitalize" as const }}>{member.role}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2.5 p-3 transition-colors"
            style={{ color: "#a69e90", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <PlusIcon color="#a69e90" size={20} />
            <span style={{ fontSize: 14 }}>Invite Members</span>
          </button>
          <Link
            href={`/collectives/${collectiveId}/settings`}
            className="flex items-center gap-2.5 p-3 transition-colors"
            style={{ color: "#6b6358" }}
          >
            <Settings className="h-5 w-5" />
            <span style={{ fontSize: 14 }}>Collective Settings</span>
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Area (Desktop) ─────────────────── */}
      <main className="hidden lg:flex lg:flex-col lg:flex-1 lg:ml-[300px] lg:h-screen">
        <div style={{ borderBottom: "1px solid rgba(107,99,88,0.06)", background: "#0f0d0b" }}>
          <PillTabBar activeTab={activeTab} onTabChange={setActiveTab} iconSize={15} fontSize="15px" padding="10px 18px" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Feed Tab - Desktop */}
          {activeTab === "feed" && (
            <div className="p-8 px-12 max-w-[800px]">
              {/* Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
                {[
                  { title: "Tonight's Pick", sub: "AI-powered suggestion", color: "#3d5a96", colorLight: "#5a7cb8", icon: "search" as const, tab: "tonights-pick" as CollectiveTab },
                  { title: "Start Discussion", sub: "Share your thoughts", color: "#ff6b2d", colorLight: "#ff8f5e", icon: "chat" as const, tab: "chat" as CollectiveTab },
                ].map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(action.tab)}
                    className="text-left relative"
                    style={{
                      padding: "20px 18px",
                      borderRadius: 14,
                      background: `linear-gradient(155deg, ${action.color}14, #1a1714)`,
                      border: `1px solid ${action.color}18`,
                      transition: `all 0.4s ${EASING}`,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)"
                      e.currentTarget.style.borderColor = `${action.color}35`
                      e.currentTarget.style.boxShadow = `0 8px 24px ${action.color}14`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none"
                      e.currentTarget.style.borderColor = `${action.color}18`
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "14px 14px 0 0", background: `linear-gradient(to right, ${action.color}, ${action.colorLight}50, transparent)` }} />
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${action.color}15`, border: `1px solid ${action.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      {action.icon === "search" ? <SearchIcon color={action.color} size={14} /> : <DiscussionIcon color={action.color} size={14} />}
                    </div>
                    <div style={{ fontSize: 16, color: "#e8e2d6", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{action.title}</div>
                    <div style={{ fontSize: 12, color: "#a69e90", marginTop: 4 }}>{action.sub}</div>
                  </button>
                ))}
              </div>

              {/* Recent Activity */}
              <SectionLabel className="mb-4 block">Recent Activity</SectionLabel>
              {activityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-12 text-center" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                  <p style={{ fontSize: 14, color: "#6b6358" }}>No recent activity</p>
                  <p style={{ fontSize: 12, color: "rgba(107,99,88,0.4)", marginTop: 4 }}>Rate some films to get started</p>
                </div>
              ) : (
                <div>
                  {recentActivity.slice(0, 8).map((activity, i) => (
                    <DashboardActivityItem
                      key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                      activity={activity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tonight's Pick Tab - Desktop */}
          {activeTab === "tonights-pick" && (
            <div className="p-8 px-12 max-w-[800px]">
              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
                style={{ color: "#a69e90" }}
              >
                <BackIcon size={18} color="currentColor" />
                Back to Feed
              </button>
              <TonightsPick collectiveId={collectiveId} currentUserId={currentUserId} />
            </div>
          )}

          {/* Chat Tab - Desktop */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 max-w-[800px]">
                <GeneralDiscussion collectiveId={collectiveId} currentUserId={currentUserId} currentUserName={currentUserName} />
              </div>
            </div>
          )}

          {/* Films Tab - Desktop */}
          {activeTab === "films" && (
            <div style={{ padding: "20px 48px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <SectionLabel>Films in this Collective</SectionLabel>
                <span style={{ fontSize: 12, color: "#a69e90" }}>{movieStats.length} films</span>
              </div>
              {movieStats.length === 0 ? (
                <div className="py-12 text-center" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                  <p style={{ fontSize: 14, color: "#6b6358" }}>No films rated yet</p>
                  <p style={{ fontSize: 12, color: "rgba(107,99,88,0.4)", marginTop: 4 }}>Rate your first film to see it here</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                  {movieStats.map((movie, i) => {
                    const filmColor = FILM_COLORS[i % FILM_COLORS.length]
                    const score = (movie.avg_score / 20).toFixed(1)
                    return (
                      <Link key={movie.tmdb_id} href={`/collectives/${collectiveId}/movie/${movie.tmdb_id}/conversation`} className="block group">
                        <div
                          className="relative"
                          style={{
                            width: "100%", aspectRatio: "2/3", borderRadius: 10, overflow: "hidden",
                            border: "1px solid rgba(107,99,88,0.06)",
                            transition: `all 0.4s ${EASING}`,
                          }}
                        >
                          {/* Accent bar */}
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "10px 10px 0 0", background: `linear-gradient(to right, ${filmColor}50, transparent)`, zIndex: 2 }} />
                          {movie.poster_path ? (
                            <>
                              <Image src={getImageUrl(movie.poster_path, "w342") || ""} alt={movie.title} width={342} height={513} className="w-full h-full object-cover" />
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(10,9,8,0.85), transparent)", zIndex: 1 }} />
                            </>
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: `linear-gradient(155deg, ${filmColor}15, #1a1714 40%, #252119)`, display: "flex", flexDirection: "column" as const, justifyContent: "flex-end", padding: 10 }}>
                              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(10,9,8,0.85), transparent)" }} />
                            </div>
                          )}
                          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, zIndex: 2 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: "#e8e2d6", lineHeight: 1.25, letterSpacing: "-0.01em" }}>{movie.title}</div>
                            {movie.release_date && (
                              <div style={{ fontSize: 10, color: "#6b6358", marginTop: 2 }}>{new Date(movie.release_date).getFullYear()}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, paddingLeft: 2 }}>
                          <StarIcon filled size={10} />
                          <span style={{ fontSize: 11, color: "#a69e90", fontWeight: 600 }}>{score}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Insights Tab - Desktop */}
          {activeTab === "insights" && (
            <div className="p-8 px-12 max-w-[900px]">
              <div className="grid grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Films Rated", value: analytics.total_movies_rated },
                  { label: "Discussions", value: recentActivity.length },
                  { label: "Avg Rating", value: analytics.avg_collective_score > 0 ? (analytics.avg_collective_score / 20).toFixed(1) : "—" },
                  { label: "Active Raters", value: analytics.active_raters },
                ].map((stat, i) => (
                  <div key={i} className="p-6 text-center" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                    <p style={{ fontSize: 32, fontWeight: 600, color: "#e8e2d6", marginBottom: 4 }}>{stat.value}</p>
                    <p style={{ fontSize: 12, color: "#6b6358", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {(() => {
                const myMatches = memberSimilarity.filter(match => match.user1_id === currentUserId || match.user2_id === currentUserId)
                if (myMatches.length === 0) return null
                return (
                  <div className="mb-10">
                    <SectionLabel className="mb-4 block">Taste Compatibility</SectionLabel>
                    <div className="space-y-5 p-6" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                      {myMatches.slice(0, 5).map((match, i) => {
                        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
                        const otherUserName = match.user1_id === currentUserId ? match.user2_name : match.user1_name
                        const score = Math.round(match.similarity_score * 100)
                        const colors = getMemberColor(otherUserName || "U")
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3.5">
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0f0d0b", boxShadow: `0 2px 8px ${colors[0]}22`, flexShrink: 0 }}>
                                  {(otherUserName || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 500, color: "#e8e2d6" }}>{otherUserName}</p>
                                  <p style={{ fontSize: 13, color: "#6b6358" }}>Based on {analytics.total_movies_rated} shared films</p>
                                </div>
                              </div>
                              <span style={{ fontSize: 22, fontWeight: 600, color: "#3d5a96" }}>{score}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(107,99,88,0.08)" }}>
                              <div className="h-full rounded-full" style={{ width: `${score}%`, background: "#3d5a96" }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              <div className="[&>*]:!px-0 [&>*]:!mx-0">{insightsContent}</div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Mobile: Sticky Top Nav ─────────────────────── */}
      {activeTab !== "tonights-pick" && (
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-[500]"
          style={{
            background: scrolled ? "#0f0d0be8" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? "1px solid rgba(107,99,88,0.05)" : "1px solid transparent",
            transition: `all 0.35s ${EASING}`,
            padding: scrolled ? "10px 24px" : "14px 24px 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={() => router.push("/collectives")} style={{ padding: 4, cursor: "pointer", background: "none", border: "none" }}>
                <BackIcon size={20} color="#a69e90" />
              </button>
              {/* Slide-in badge + name when scrolled */}
              <div
                style={{
                  overflow: "hidden",
                  transition: `all 0.35s ${EASING}`,
                  maxWidth: scrolled ? 250 : 0,
                  opacity: scrolled ? 1 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CollectiveBadge initials={badgeInitials} colors={badgeColors} size="sm" />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e2d6", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                  {collectiveName}
                </span>
              </div>
            </div>
            <Link href={`/collectives/${collectiveId}/settings`} style={{ padding: 4 }}>
              <Settings className="h-5 w-5" style={{ color: "#6b6358" }} />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Mobile: Collective Header ──────────────────── */}
      {activeTab !== "tonights-pick" && (
        <div className="lg:hidden sf-reveal" style={{ padding: "60px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <CollectiveBadge initials={badgeInitials} colors={badgeColors} size={52} />
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "#e8e2d6", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  {collectiveName}
                </h1>
                <div style={{ fontSize: 13, color: "#a69e90", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                  <span style={{ color: "rgba(107,99,88,0.4)" }}>·</span>
                  <span style={{ color: "#3d5a96" }}>{roleText}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(107,99,88,0.15)",
                background: "transparent",
                color: "#a69e90",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              <PlusIcon color="#a69e90" size={14} />
              Invite
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile: Pill Tab Bar ───────────────────────── */}
      {activeTab !== "tonights-pick" && (
        <div className="lg:hidden sf-reveal sf-delay-1">
          <PillTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* ─── Mobile Tab Content ─────────────────────────── */}
      <div className={`lg:hidden sf-reveal sf-delay-2 ${activeTab === "chat" ? "fixed inset-x-0 bottom-20 top-[260px]" : activeTab === "tonights-pick" ? "flex-1 min-h-0" : ""}`}>

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div>
            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "20px 24px 0" }}>
              {[
                { title: "Tonight's Pick", sub: "AI-powered suggestion", color: "#3d5a96", colorLight: "#5a7cb8", icon: "search" as const, tab: "tonights-pick" as CollectiveTab },
                { title: "Start Discussion", sub: "Share your thoughts", color: "#ff6b2d", colorLight: "#ff8f5e", icon: "chat" as const, tab: "chat" as CollectiveTab },
              ].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  className="text-left relative"
                  style={{
                    padding: "20px 18px",
                    borderRadius: 14,
                    background: `linear-gradient(155deg, ${action.color}14, #1a1714)`,
                    border: `1px solid ${action.color}18`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "14px 14px 0 0", background: `linear-gradient(to right, ${action.color}, ${action.colorLight}50, transparent)` }} />
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${action.color}15`, border: `1px solid ${action.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    {action.icon === "search" ? <SearchIcon color={action.color} size={14} /> : <DiscussionIcon color={action.color} size={14} />}
                  </div>
                  <div style={{ fontSize: 16, color: "#e8e2d6", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: "#a69e90", marginTop: 4, lineHeight: 1.5 }}>{action.sub}</div>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "30px 24px 12px" }}>
                <SectionLabel>Recent Activity</SectionLabel>
                {recentActivity.length > 5 && (
                  <Link href={`/collectives/${collectiveId}/feed`} className="flex items-center gap-1" style={{ fontSize: 12, color: "#3d5a96" }}>
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-8 text-center mx-6" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                  <p style={{ fontSize: 14, color: "#6b6358" }}>No recent activity</p>
                  <p style={{ fontSize: 12, color: "rgba(107,99,88,0.4)", marginTop: 4 }}>Rate some films to get started</p>
                </div>
              ) : (
                <div style={{ padding: "0 24px" }}>
                  {recentActivity.slice(0, 5).map((activity, i) => (
                    <DashboardActivityItem
                      key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                      activity={activity}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Members Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "28px 24px 12px" }}>
                <SectionLabel>Members</SectionLabel>
                <button type="button" onClick={() => setShowMembersModal(true)} className="flex items-center gap-1" style={{ fontSize: 12, color: "#3d5a96", background: "none", border: "none", cursor: "pointer" }}>
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div style={{ display: "flex", gap: 16, padding: "0 24px 24px", overflowX: "auto", scrollbarWidth: "none" }} className="[&::-webkit-scrollbar]:hidden">
                {members.map((member) => {
                  const name = member.name || member.email
                  const colors = getMemberColor(name)
                  return (
                    <Link key={member.id} href={`/user/${member.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 52 }}>
                      <div style={{ position: "relative" }}>
                        <div
                          style={{
                            width: 46, height: 46, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                            boxShadow: `0 3px 12px ${colors[0]}22`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, fontWeight: 700, color: "#0f0d0b",
                          }}
                        >
                          {name[0].toUpperCase()}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "#a69e90" }}>{(name).split(" ")[0]}</span>
                    </Link>
                  )
                })}
                {/* Invite button */}
                <div onClick={() => setShowInviteModal(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 52, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px dashed rgba(107,99,88,0.19)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PlusIcon />
                  </div>
                  <span style={{ fontSize: 11, color: "#6b6358" }}>Invite</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tonight's Pick Tab */}
        {activeTab === "tonights-pick" && (
          <TonightsPick collectiveId={collectiveId} currentUserId={currentUserId} onBack={() => setActiveTab("feed")} />
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <GeneralDiscussion collectiveId={collectiveId} currentUserId={currentUserId} currentUserName={currentUserName} />
        )}

        {/* Films Tab */}
        {activeTab === "films" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 24px 14px" }}>
              <SectionLabel>Films in this Collective</SectionLabel>
              <span style={{ fontSize: 12, color: "#a69e90" }}>{movieStats.length} films</span>
            </div>

            {movieStats.length === 0 ? (
              <div className="py-8 text-center mx-6" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                <p style={{ fontSize: 14, color: "#6b6358" }}>No films rated yet</p>
                <p style={{ fontSize: 12, color: "rgba(107,99,88,0.4)", marginTop: 4 }}>Rate your first film to see it here</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 24px 24px" }}>
                {movieStats.slice(0, 12).map((movie, i) => {
                  const filmColor = FILM_COLORS[i % FILM_COLORS.length]
                  const score = (movie.avg_score / 20).toFixed(1)
                  return (
                    <Link key={movie.tmdb_id} href={`/collectives/${collectiveId}/movie/${movie.tmdb_id}/conversation`} className="block">
                      <div
                        style={{
                          width: "100%", aspectRatio: "2/3", borderRadius: 10, position: "relative", overflow: "hidden",
                          border: "1px solid rgba(107,99,88,0.06)",
                          display: "flex", flexDirection: "column", justifyContent: "flex-end",
                        }}
                      >
                        {/* Accent bar */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "10px 10px 0 0", background: `linear-gradient(to right, ${filmColor}50, transparent)`, zIndex: 2 }} />
                        {movie.poster_path ? (
                          <>
                            <Image src={getImageUrl(movie.poster_path, "w185") || ""} alt={movie.title} width={185} height={278} className="absolute inset-0 w-full h-full object-cover" />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(10,9,8,0.85), transparent)", zIndex: 1 }} />
                          </>
                        ) : (
                          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(155deg, ${filmColor}15, #1a1714 40%, #252119)` }} />
                        )}
                        <div style={{ position: "relative", zIndex: 2, padding: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: "#e8e2d6", lineHeight: 1.25, letterSpacing: "-0.01em" }}>{movie.title}</div>
                          {movie.release_date && (
                            <div style={{ fontSize: 10, color: "#6b6358", marginTop: 2 }}>{new Date(movie.release_date).getFullYear()}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, paddingLeft: 2 }}>
                        <StarIcon filled size={10} />
                        <span style={{ fontSize: 11, color: "#a69e90", fontWeight: 600 }}>{score}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {movieStats.length > 12 && (
              <div style={{ padding: "0 24px 24px" }}>
                <Link
                  href={`/collectives/${collectiveId}/movies`}
                  className="block w-full py-3 text-center"
                  style={{ fontSize: 14, fontWeight: 500, color: "#3d5a96", background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}
                >
                  View all {movieStats.length} films
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div style={{ padding: "20px 24px" }} className="space-y-6">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Films Rated", value: analytics.total_movies_rated },
                { label: "Discussions", value: recentActivity.length },
                { label: "Avg Rating", value: analytics.avg_collective_score > 0 ? (analytics.avg_collective_score / 20).toFixed(1) : "—" },
                { label: "Active Raters", value: analytics.active_raters },
              ].map((stat, i) => (
                <div key={i} className="p-4" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                  <p style={{ fontSize: 10, color: "#6b6358", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>{stat.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 600, color: "#e8e2d6" }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {(() => {
              const myMatches = memberSimilarity.filter(match => match.user1_id === currentUserId || match.user2_id === currentUserId)
              if (myMatches.length === 0) return null
              return (
                <div>
                  <SectionLabel className="mb-3.5 block">Taste Match</SectionLabel>
                  <div className="space-y-4 p-4" style={{ background: "#1a1714", borderRadius: 14, border: "1px solid rgba(107,99,88,0.04)" }}>
                    {myMatches.slice(0, 3).map((match, i) => {
                      const otherUserName = match.user1_id === currentUserId ? match.user2_name : match.user1_name
                      const score = Math.round(match.similarity_score * 100)
                      const colors = getMemberColor(otherUserName || "U")
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f0d0b", flexShrink: 0 }}>
                                {(otherUserName || "U")[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e2d6" }}>{otherUserName}</span>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 600, color: "#3d5a96" }}>{score}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(107,99,88,0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${score}%`, background: "#3d5a96" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="[&>*]:!px-0 [&>*]:!mx-0">{insightsContent}</div>
          </div>
        )}
      </div>

      {/* ─── FAB (hidden on Chat tab) ────────────────────── */}
      {activeTab !== "chat" && activeTab !== "tonights-pick" && (
        <LogFilmFAB onClick={() => setShowLogModal(true)} />
      )}

      {/* ─── Bottom Nav (hidden during Tonight's Pick) ───── */}
      {activeTab !== "tonights-pick" && <MobileBottomNav />}

      {/* ─── Members Modal ────────────────────────────────── */}
      <MembersModal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={members}
        collectiveId={collectiveId}
      />

      {/* ─── Invite Modal ──────────────────────────────────── */}
      <InviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        collectiveName={collectiveName}
        collectiveId={collectiveId}
      />

      {/* ─── Log Film Modal ─────────────────────────────────── */}
      <LogFilmModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </div>
  )
}
