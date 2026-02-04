"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

// ─── Icons ──────────────────────────────────────────────────

function BackIcon({ color = "#f8f6f1", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeedIcon({ color = "#f8f6f1", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function ChatIcon({ color = "#f8f6f1", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FilmIcon({ color = "#f8f6f1", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M2 8H22M2 16H22M6 4V20M18 4V20" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function InsightsIcon({ color = "#f8f6f1", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 20V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 20V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="8" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="10" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="4" r="2" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function TonightsPickIcon({ color = "#e07850", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
    </svg>
  )
}

function DiscussionIcon({ color = "#f8f6f1", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
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

type Activity = {
  id: string
  activity_type: "comment" | "reaction"
  user_id: string
  user_name: string | null
  user_avatar: string | null
  rating_owner_name: string | null
  media_title: string | null
  media_type: string | null
  tmdb_id: number | null
  reaction_type: string | null
  created_at: string
  rating_id: string
}

type CollectiveTab = "feed" | "chat" | "films" | "insights" | "tonights-pick"

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

const REACTION_EMOJI_MAP: Record<string, string> = {
  thumbsup: "\uD83D\uDC4D",
  heart: "\u2764\uFE0F",
  laugh: "\uD83D\uDE02",
  fire: "\uD83D\uDD25",
  sad: "\uD83D\uDE22",
  celebrate: "\uD83C\uDF89",
}

// ─── Tab Bar Component ──────────────────────────────────────

function CollectiveTabBar({
  activeTab,
  onTabChange
}: {
  activeTab: CollectiveTab
  onTabChange: (tab: CollectiveTab) => void
}) {
  const tabs: { id: CollectiveTab; label: string; Icon: typeof FeedIcon }[] = [
    { id: "feed", label: "Feed", Icon: FeedIcon },
    { id: "chat", label: "Chat", Icon: ChatIcon },
    { id: "films", label: "Films", Icon: FilmIcon },
    { id: "insights", label: "Insights", Icon: InsightsIcon },
  ]

  return (
    <div className="border-b border-foreground/[0.06]">
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors"
              style={{
                borderBottom: isActive ? "2px solid #e07850" : "2px solid transparent",
                marginBottom: "-1px",
                color: isActive ? "#f8f6f1" : "rgba(248,246,241,0.5)",
              }}
            >
              <tab.Icon color={isActive ? "#e07850" : "rgba(248,246,241,0.4)"} size={18} />
              <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

// ─── Desktop Tab Bar ─────────────────────────────────────────

function DesktopTabBar({
  activeTab,
  onTabChange
}: {
  activeTab: CollectiveTab
  onTabChange: (tab: CollectiveTab) => void
}) {
  const tabs: { id: CollectiveTab; label: string; Icon: typeof FeedIcon }[] = [
    { id: "feed", label: "Feed", Icon: FeedIcon },
    { id: "chat", label: "Chat", Icon: ChatIcon },
    { id: "films", label: "Films", Icon: FilmIcon },
    { id: "insights", label: "Insights", Icon: InsightsIcon },
  ]

  return (
    <div className="border-b border-foreground/[0.06] bg-background">
      <div className="flex gap-2 pt-6 px-12">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2 px-5 py-3.5 transition-colors"
              style={{
                borderBottom: isActive ? "2px solid #e07850" : "2px solid transparent",
                marginBottom: "-1px",
                color: isActive ? "#f8f6f1" : "rgba(248,246,241,0.5)",
              }}
            >
              <tab.Icon color={isActive ? "#e07850" : "rgba(248,246,241,0.4)"} size={20} />
              <span className={`text-[15px] ${isActive ? "font-medium" : "font-normal"}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
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
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

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

  const roleText = userRole === "owner" ? "You're the owner" : "Member"

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 lg:flex">
      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-[300px] lg:bg-surface lg:border-r lg:border-foreground/[0.06] lg:p-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/collectives")}
          className="flex items-center gap-2.5 text-foreground/60 hover:text-foreground/80 transition-colors mb-6"
        >
          <BackIcon size={20} color="currentColor" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        {/* Collective header card */}
        <div className="bg-surface-light rounded-2xl p-5 mb-6 text-center">
          <div
            className="size-[72px] rounded-[20px] flex items-center justify-center text-4xl mx-auto mb-4"
            style={{
              backgroundColor: "rgba(123, 140, 222, 0.15)",
              border: "2px solid rgba(123, 140, 222, 0.3)",
            }}
          >
            👥
          </div>
          <h2 className="text-xl font-semibold text-cream mb-1">{collectiveName}</h2>
          <p className="text-[13px] text-foreground/50">
            {memberCount} member{memberCount !== 1 ? "s" : ""} · {roleText}
          </p>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-[10px] tracking-[0.12em] uppercase text-foreground/40 mb-3">Members</p>
          <div className="space-y-1.5">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/user/${member.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-colors"
              >
                <Avatar size="md">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>{(member.name || member.email)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name || member.email}</p>
                  <p className="text-[11px] text-foreground/45 capitalize">{member.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings button */}
        <Link
          href={`/collectives/${collectiveId}/settings`}
          className="flex items-center gap-2.5 p-3 text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm">Collective Settings</span>
        </Link>
      </aside>

      {/* ─── Main Content Area (Desktop) ─────────────────── */}
      <main className="hidden lg:flex lg:flex-col lg:flex-1 lg:ml-[300px] lg:h-screen">
        {/* Desktop Tab bar */}
        <DesktopTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Desktop Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Feed Tab - Desktop */}
          {activeTab === "feed" && (
            <div className="p-8 px-12 max-w-[800px]">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <button
                  type="button"
                  onClick={() => setActiveTab("tonights-pick")}
                  className="p-6 rounded-[14px] text-left flex items-center gap-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(224, 120, 80, 0.15), rgba(224, 120, 80, 0.05))",
                    border: "1px solid rgba(224, 120, 80, 0.25)",
                  }}
                >
                  <div className="size-[52px] rounded-[14px] flex items-center justify-center bg-accent/20">
                    <TonightsPickIcon color="#e07850" size={26} />
                  </div>
                  <div>
                    <p className="text-base font-medium text-cream">Tonight's Pick</p>
                    <p className="text-[13px] text-foreground/50 mt-0.5">Find something to watch together</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="p-6 rounded-[14px] text-left flex items-center gap-4 bg-surface border border-foreground/[0.06]"
                >
                  <div className="size-[52px] rounded-[14px] flex items-center justify-center bg-surface-light">
                    <DiscussionIcon size={26} />
                  </div>
                  <div>
                    <p className="text-base font-medium text-cream">Start Discussion</p>
                    <p className="text-[13px] text-foreground/50 mt-0.5">Talk about a film you watched</p>
                  </div>
                </button>
              </div>

              {/* Recent Activity */}
              <SectionLabel className="mb-4 block">Recent Activity</SectionLabel>
              {(() => {
                const othersActivity = recentActivity.filter(item => item.user_id !== currentUserId)
                if (activityLoading) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                    </div>
                  )
                }
                if (othersActivity.length === 0) {
                  return (
                    <div className="py-12 text-center bg-surface rounded-[14px] border border-foreground/[0.04]">
                      <p className="text-sm text-foreground/50">No recent activity</p>
                      <p className="text-xs text-foreground/[0.25] mt-1">Rate some films to get started</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-3">
                    {othersActivity.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      href={`/collectives/${collectiveId}/movie/${item.tmdb_id}/conversation`}
                      className="flex items-start gap-3.5 p-5 bg-surface rounded-[14px] border border-foreground/[0.04] hover:border-foreground/[0.1] transition-colors"
                    >
                      <Avatar size="md">
                        <AvatarImage src={item.user_avatar || undefined} />
                        <AvatarFallback>{(item.user_name || "U")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] leading-[1.4]">
                          <span className="font-semibold">{item.user_name || "Someone"}</span>
                          {item.activity_type === "comment" ? (
                            <>
                              <span className="text-foreground/60"> commented on </span>
                              <span className="font-medium">{item.rating_owner_name}'s</span>
                              <span className="text-foreground/60"> review</span>
                            </>
                          ) : (
                            <>
                              <span className="text-foreground/60"> reacted </span>
                              <span>{REACTION_EMOJI_MAP[item.reaction_type || ""] || item.reaction_type}</span>
                              <span className="text-foreground/60"> to </span>
                              <span className="font-medium">{item.rating_owner_name}'s</span>
                              <span className="text-foreground/60"> review</span>
                            </>
                          )}
                        </p>
                        {item.media_title && (
                          <p className="text-[13px] text-foreground/40 mt-1 truncate">{item.media_title}</p>
                        )}
                        <p className="text-[12px] text-foreground/[0.25] mt-1">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tonight's Pick Tab - Desktop */}
          {activeTab === "tonights-pick" && (
            <div className="p-8 px-12 max-w-[800px]">
              <button
                type="button"
                onClick={() => setActiveTab("feed")}
                className="flex items-center gap-1.5 text-sm text-foreground/60 mb-6 hover:text-foreground/80 transition-colors"
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
                <GeneralDiscussion
                  collectiveId={collectiveId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </div>
            </div>
          )}

          {/* Films Tab - Desktop */}
          {activeTab === "films" && (
            <div className="p-8 px-12">
              <SectionLabel className="mb-5 block">
                Films in this collective ({movieStats.length})
              </SectionLabel>

              {movieStats.length === 0 ? (
                <div className="py-12 text-center bg-surface rounded-[14px] border border-foreground/[0.04]">
                  <p className="text-sm text-foreground/50">No films rated yet</p>
                  <p className="text-xs text-foreground/[0.25] mt-1">Rate your first film to see it here</p>
                </div>
              ) : (
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                  {movieStats.map((movie) => (
                    <Link
                      key={movie.tmdb_id}
                      href={`/collectives/${collectiveId}/movie/${movie.tmdb_id}/conversation`}
                      className="block group"
                    >
                      <div className="aspect-[2/3] rounded-[10px] overflow-hidden bg-surface-light mb-3 ring-2 ring-transparent group-hover:ring-accent/30 transition-all">
                        {movie.poster_path ? (
                          <Image
                            src={getImageUrl(movie.poster_path, "w342") || ""}
                            alt={movie.title}
                            width={342}
                            height={513}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FilmIcon color="rgba(248,246,241,0.2)" size={32} />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{movie.title}</p>
                      <div className="flex items-center gap-2">
                        {movie.release_date && (
                          <span className="text-[13px] text-foreground/45">
                            {new Date(movie.release_date).getFullYear()}
                          </span>
                        )}
                        <span className="text-[13px] text-accent">
                          ★ {(movie.avg_score / 20).toFixed(1)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insights Tab - Desktop */}
          {activeTab === "insights" && (
            <div className="p-8 px-12 max-w-[900px]">
              {/* Stats Grid - 4 columns */}
              <div className="grid grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Films Rated", value: analytics.total_movies_rated },
                  { label: "Discussions", value: recentActivity.length },
                  { label: "Avg Rating", value: analytics.avg_collective_score > 0 ? (analytics.avg_collective_score / 20).toFixed(1) : "—" },
                  { label: "Active Raters", value: analytics.active_raters },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 bg-surface rounded-[14px] border border-foreground/[0.04] text-center"
                  >
                    <p className="text-[32px] font-semibold text-cream mb-1">{stat.value}</p>
                    <p className="text-[12px] text-foreground/45 uppercase tracking-[0.1em]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Taste Compatibility */}
              {(() => {
                // Filter to only show matches involving the current user
                const myMatches = memberSimilarity.filter(
                  match => match.user1_id === currentUserId || match.user2_id === currentUserId
                )
                if (myMatches.length === 0) return null
                return (
                  <div className="mb-10">
                    <SectionLabel className="mb-4 block">Taste Compatibility</SectionLabel>
                    <div className="bg-surface rounded-[14px] border border-foreground/[0.04] p-6 space-y-5">
                      {myMatches.slice(0, 5).map((match, i) => {
                        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
                        const otherUserName = match.user1_id === currentUserId ? match.user2_name : match.user1_name
                        const member = members.find(m => m.id === otherUserId)
                        const score = Math.round(match.similarity_score * 100)

                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3.5">
                                <Avatar size="md">
                                  <AvatarImage src={member?.avatar_url || undefined} />
                                  <AvatarFallback>{(otherUserName || "U")[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-base font-medium">{otherUserName}</p>
                                  <p className="text-[13px] text-foreground/45">Based on {analytics.total_movies_rated} shared films</p>
                                </div>
                              </div>
                              <span className="text-2xl font-semibold text-cool">{score}%</span>
                            </div>
                            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-cool"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Additional Insights */}
              <div className="[&>*]:!px-0 [&>*]:!mx-0">
                {insightsContent}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Mobile Header ────────────────────────────────── */}
      <div className="lg:hidden px-5 pt-3 pb-4">
        {/* Top row: back + settings */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.push("/collectives")}
            className="p-2 -ml-2"
          >
            <BackIcon size={22} />
          </button>
          <Link
            href={`/collectives/${collectiveId}/settings`}
            className="p-2 -mr-2"
          >
            <Settings className="h-[22px] w-[22px] text-foreground/60" />
          </Link>
        </div>

        {/* Collective info */}
        <div className="flex items-center gap-3.5">
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: "rgba(123, 140, 222, 0.15)",
              border: "1px solid rgba(123, 140, 222, 0.3)",
            }}
          >
            👥
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-cream mb-1">
              {collectiveName}
            </h1>
            <p className="text-[13px] text-foreground/50">
              {memberCount} member{memberCount !== 1 ? "s" : ""} · {roleText}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Mobile Tab Bar ─────────────────────────────── */}
      <div className="lg:hidden">
        <CollectiveTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* ─── Mobile Tab Content ─────────────────────────── */}
      <div className={`lg:hidden ${activeTab === "chat" ? "fixed inset-x-0 bottom-20 top-[180px]" : "px-5 py-5"}`}>

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("tonights-pick")}
                className="p-4 rounded-xl text-left"
                style={{
                  background: "linear-gradient(135deg, rgba(224, 120, 80, 0.15), rgba(224, 120, 80, 0.05))",
                  border: "1px solid rgba(224, 120, 80, 0.25)",
                }}
              >
                <TonightsPickIcon color="#e07850" size={20} />
                <p className="text-sm font-medium text-cream mt-2.5">Tonight's Pick</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className="p-4 rounded-xl text-left bg-surface border border-foreground/[0.06]"
              >
                <DiscussionIcon size={20} />
                <p className="text-sm font-medium text-cream mt-2.5">Start Discussion</p>
              </button>
            </div>

            {/* Recent Activity - Limited to 5 */}
            {(() => {
              const othersActivity = recentActivity.filter(item => item.user_id !== currentUserId)
              return (
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <SectionLabel>Recent Activity</SectionLabel>
                    {othersActivity.length > 5 && (
                      <Link
                        href={`/collectives/${collectiveId}/feed`}
                        className="flex items-center gap-1 text-[13px] text-cool"
                      >
                        View All
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>

                  {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                    </div>
                  ) : othersActivity.length === 0 ? (
                    <div className="py-8 text-center bg-surface rounded-xl border border-foreground/[0.04]">
                      <p className="text-sm text-foreground/50">No recent activity</p>
                      <p className="text-xs text-foreground/[0.25] mt-1">Rate some films to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {othersActivity.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={`/collectives/${collectiveId}/movie/${item.tmdb_id}/conversation`}
                          className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-foreground/[0.04]"
                        >
                          <Avatar size="sm">
                            <AvatarImage src={item.user_avatar || undefined} />
                            <AvatarFallback>{(item.user_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-[1.4]">
                              <span className="font-semibold">{item.user_name || "Someone"}</span>
                              {item.activity_type === "comment" ? (
                                <>
                                  <span className="text-foreground/60"> commented on </span>
                                  <span className="font-medium">{item.rating_owner_name}'s</span>
                                  <span className="text-foreground/60"> review</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-foreground/60"> reacted </span>
                                  <span>{REACTION_EMOJI_MAP[item.reaction_type || ""] || item.reaction_type}</span>
                                  <span className="text-foreground/60"> to </span>
                                  <span className="font-medium">{item.rating_owner_name}'s</span>
                                  <span className="text-foreground/60"> review</span>
                                </>
                              )}
                            </p>
                            {item.media_title && (
                              <p className="text-xs text-foreground/40 mt-1 truncate">{item.media_title}</p>
                            )}
                            <p className="text-[11px] text-foreground/[0.25] mt-1">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <SectionLabel>Members</SectionLabel>
                <button
                  type="button"
                  onClick={() => setShowMembersModal(true)}
                  className="flex items-center gap-1 text-[13px] text-cool"
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/user/${member.id}`}
                    className="relative shrink-0 group"
                  >
                    <div className="size-12 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-accent/50 transition-all">
                      <Avatar size="lg" className="size-full">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">{(member.name || member.email)[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    {member.role === "owner" && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-cool flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">★</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tonight's Pick Tab */}
        {activeTab === "tonights-pick" && (
          <div>
            <button
              type="button"
              onClick={() => setActiveTab("feed")}
              className="flex items-center gap-1.5 text-sm text-foreground/60 mb-4"
            >
              <BackIcon size={18} color="rgba(248,246,241,0.6)" />
              Back to Feed
            </button>
            <TonightsPick collectiveId={collectiveId} currentUserId={currentUserId} />
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <GeneralDiscussion
            collectiveId={collectiveId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        )}

        {/* Films Tab */}
        {activeTab === "films" && (
          <div>
            <SectionLabel className="mb-3.5 block">Films in this collective</SectionLabel>

            {movieStats.length === 0 ? (
              <div className="py-8 text-center bg-surface rounded-xl border border-foreground/[0.04]">
                <p className="text-sm text-foreground/50">No films rated yet</p>
                <p className="text-xs text-foreground/[0.25] mt-1">Rate your first film to see it here</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {movieStats.slice(0, 12).map((movie) => (
                  <Link
                    key={movie.tmdb_id}
                    href={`/collectives/${collectiveId}/movie/${movie.tmdb_id}/conversation`}
                    className="block"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-light mb-2">
                      {movie.poster_path ? (
                        <Image
                          src={getImageUrl(movie.poster_path, "w185") || ""}
                          alt={movie.title}
                          width={185}
                          height={278}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FilmIcon color="rgba(248,246,241,0.2)" size={24} />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground/70 truncate">{movie.title}</p>
                  </Link>
                ))}
              </div>
            )}

            {movieStats.length > 12 && (
              <Link
                href={`/collectives/${collectiveId}/movies`}
                className="block w-full py-3 mt-4 text-center text-sm font-medium text-cool bg-surface rounded-xl border border-foreground/[0.04]"
              >
                View all {movieStats.length} films
              </Link>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Films Rated", value: analytics.total_movies_rated },
                { label: "Discussions", value: recentActivity.length },
                { label: "Avg Rating", value: analytics.avg_collective_score > 0 ? (analytics.avg_collective_score / 20).toFixed(1) : "—" },
                { label: "Active Raters", value: analytics.active_raters },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 bg-surface rounded-xl border border-foreground/[0.04]"
                >
                  <p className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1.5">{stat.label}</p>
                  <p className="text-2xl font-semibold text-cream">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Taste Match Section */}
            {(() => {
              // Filter to only show matches involving the current user
              const myMatches = memberSimilarity.filter(
                match => match.user1_id === currentUserId || match.user2_id === currentUserId
              )
              if (myMatches.length === 0) return null
              return (
                <div>
                  <SectionLabel className="mb-3.5 block">Taste Match</SectionLabel>
                  <div className="bg-surface rounded-xl border border-foreground/[0.04] p-4 space-y-4">
                    {myMatches.slice(0, 3).map((match, i) => {
                      // Find the other user in the pair
                      const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
                      const otherUserName = match.user1_id === currentUserId ? match.user2_name : match.user1_name
                      const member = members.find(m => m.id === otherUserId)
                      const score = Math.round(match.similarity_score * 100)

                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm">
                                <AvatarImage src={member?.avatar_url || undefined} />
                                <AvatarFallback>{(otherUserName || "U")[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{otherUserName}</span>
                            </div>
                            <span className="text-base font-semibold text-cool">{score}%</span>
                          </div>
                          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cool"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Additional Insights */}
            <div className="[&>*]:!px-0 [&>*]:!mx-0">
              {insightsContent}
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Nav ───────────────────────────────────── */}
      <MobileBottomNav />

      {/* ─── Members Modal ────────────────────────────────── */}
      <MembersModal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={members}
        collectiveId={collectiveId}
      />
    </div>
  )
}
