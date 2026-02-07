"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ChevronDown,
  LayoutDashboard,
  BarChart3,
  Activity,
  Users,
  MessagesSquare,
  ArrowLeft,
} from "lucide-react"
import { CollectiveMovieModal } from "@/components/collective-movie-modal"
import { CollectiveTVShowModal } from "@/components/collective-tv-show-modal"
import { MembersModal } from "@/components/members-modal"
import { Trophy } from "lucide-react"
import { GeneralDiscussion } from "@/components/general-discussion"
import { CollectiveActions } from "@/components/collective-actions"
import { OscarPredictions } from "@/components/oscar-predictions"
import { TonightsPick } from "@/components/tonights-pick"
import { Sparkles } from "lucide-react"
import { FeedSection } from "@/components/collective/feed-section"
import { DashboardSection } from "@/components/collective/dashboard-section"
import type { Activity as FeedActivity } from "@/components/dashboard/dashboard-activity-item"

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
  genres?: any
}

type TVShowStat = {
  tv_show_id: number
  name: string | null
  poster_path: string | null
  first_air_date: string | null
  avg_score: number
  rating_count: number
}

type EpisodeStat = {
  episode_id: number
  episode_name: string
  episode_number: number
  season_number: number
  still_path: string | null
  tv_show_id: number
  tv_show_name: string
  tv_show_poster: string | null
  avg_score: number
  rating_count: number
}

type Reaction = {
  type: string
  count: number
}

type Rating = {
  rating_id?: string
  user_id: string
  user_name: string | null
  user_avatar: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
  tmdb_id: string
  title: string
  poster_path: string | null
  media_type?: string
  episode_name?: string
  episode_number?: number
  season_number?: number
  tv_show_name?: string
  tv_show_id?: number
  comment_count?: number
  reactions?: Reaction[] | null
}

type Member = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
  joined_at: string
}

type Props = {
  collectiveId: string
  currentUserId: string
  currentUserName?: string
  collectiveName: string
  collectiveDescription?: string | null
  userRole: string
  movieStats: MovieStat[]
  tvShowStats: TVShowStat[]
  episodeStats: EpisodeStat[]
  members: Member[]
  insightsContent: React.ReactNode
}

type Section = "dashboard" | "tonightspick" | "insights" | "feed" | "discussion" | "predictions"

const sectionConfig: { value: Section; label: string; icon: React.ReactNode; description?: string }[] = [
  { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  {
    value: "tonightspick",
    label: "Tonight's Pick",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Find the perfect film for your group",
  },
  {
    value: "predictions",
    label: "Predictions",
    icon: <Trophy className="h-4 w-4" />,
    description: "Oscar predictions for 2026",
  },
  {
    value: "discussion",
    label: "Discussion",
    icon: <MessagesSquare className="h-4 w-4" />,
    description: "General Discussion",
  },
  {
    value: "insights",
    label: "Insights",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "View insights about the collective",
  },
  { value: "feed", label: "Feed", icon: <Activity className="h-4 w-4" />, description: "View recent activity feed" },
]

export function CollectivePageClient({
  collectiveId,
  currentUserId,
  currentUserName,
  collectiveName,
  collectiveDescription,
  userRole,
  movieStats,
  tvShowStats,
  episodeStats,
  members,
  insightsContent,
}: Props) {
  const [selectedMovie, setSelectedMovie] = useState<MovieStat | null>(null)
  const [selectedTVShow, setSelectedTVShow] = useState<TVShowStat | null>(null)
  const [activeSection, setActiveSection] = useState<Section>("dashboard")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [feedActivities, setFeedActivities] = useState<FeedActivity[]>([])
  const [feedPage, setFeedPage] = useState(0)
  const [feedTotal, setFeedTotal] = useState(0)
  const [feedLoading, setFeedLoading] = useState(false)
  const FEED_LIMIT = 10

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchRecentActivity()
    }
  }, [activeSection, collectiveId])

  const fetchRecentActivity = async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/activity?limit=5`)
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

  useEffect(() => {
    if (activeSection === "feed") {
      fetchFeed()
    }
  }, [activeSection, feedPage])

  const fetchFeed = async () => {
    setFeedLoading(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/feed?page=${feedPage}&limit=${FEED_LIMIT}`)
      if (res.ok) {
        const data = await res.json()
        setFeedActivities(data.activities || [])
        setFeedTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching feed:", error)
    } finally {
      setFeedLoading(false)
    }
  }

  const totalFeedPages = Math.ceil(feedTotal / FEED_LIMIT)

  const handleMovieClick = (movie: MovieStat) => {
    setSelectedMovie(movie)
  }

  const handleTVShowClick = (show: TVShowStat) => {
    setSelectedTVShow(show)
  }

  const currentSection = sectionConfig.find((s) => s.value === activeSection)

  if (activeSection === "discussion") {
    return (
      <>
        {/* Section dropdown - fixed at top below main header */}
        <div
          className="fixed top-20 left-0 right-0 z-20 px-3 py-2 bg-background/95 backdrop-blur-sm border-b border-border/30"
          ref={dropdownRef}
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-all"
          >
            {currentSection && currentSection.icon}
            <span className="font-semibold text-foreground">{currentSection?.label || "Discussion"}</span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-3 mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden">
              {sectionConfig.map((section) => (
                <button
                  key={section.value}
                  onClick={() => {
                    setActiveSection(section.value)
                    setDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeSection === section.value ? "bg-accent/10 text-accent" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {section.icon}
                  <div>
                    <div className="font-medium">{section.label}</div>
                    {section.description && <div className="text-xs text-muted-foreground">{section.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 top-[104px] z-10">
          <GeneralDiscussion
            collectiveId={collectiveId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>

        {/* Members Modal */}
        <MembersModal
          open={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          members={members}
          collectiveId={collectiveId}
        />
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-3">
        <Link
          href="/collectives"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          All Collectives
        </Link>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{collectiveName}</h1>
            {collectiveDescription && <p className="text-muted-foreground">{collectiveDescription}</p>}
          </div>
          <CollectiveActions collectiveId={collectiveId} collectiveName={collectiveName} userRole={userRole} />
        </div>

        {/* Section Dropdown and Member Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-all"
            >
              {currentSection?.icon}
              <span className="font-medium text-foreground">{currentSection?.label}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {sectionConfig.map((section) => (
                    <button
                      key={section.value}
                      onClick={() => {
                        setActiveSection(section.value)
                        setDropdownOpen(false)
                      }}
                      className={`flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors ${
                        activeSection === section.value ? "bg-accent/10 text-accent" : "text-foreground"
                      }`}
                    >
                      {section.icon}
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-all"
          >
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">{members.length} Members</span>
          </button>
        </div>

        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <DashboardSection
            movieStats={movieStats}
            tvShowStats={tvShowStats}
            episodeStats={episodeStats}
            collectiveId={collectiveId}
            onMovieClick={handleMovieClick}
            onTVShowClick={handleTVShowClick}
            recentActivity={recentActivity}
            activityLoading={activityLoading}
            onViewAllFeed={() => setActiveSection("feed")}
          />
        )}

        {/* Insights Section */}
        {activeSection === "insights" && insightsContent}

        {/* Feed Section */}
        {activeSection === "feed" && (
          <FeedSection
            activities={feedActivities}
            feedLoading={feedLoading}
            feedTotal={feedTotal}
            feedPage={feedPage}
            totalFeedPages={totalFeedPages}
            setFeedPage={setFeedPage}
          />
        )}

        {/* Tonight's Pick Section */}
        {activeSection === "tonightspick" && (
          <div className="mb-8">
            <TonightsPick collectiveId={collectiveId} currentUserId={currentUserId} />
          </div>
        )}

        {/* Predictions Section */}
        {activeSection === "predictions" && (
          <div className="mb-8">
            <OscarPredictions collectiveId={collectiveId} />
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <CollectiveMovieModal
          movie={selectedMovie}
          collectiveId={collectiveId}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* TV Show Modal */}
      {selectedTVShow && (
        <CollectiveTVShowModal
          show={selectedTVShow}
          collectiveId={collectiveId}
          onClose={() => setSelectedTVShow(null)}
        />
      )}

      {/* Members Modal */}
      <MembersModal
        open={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        collectiveId={collectiveId}
      />
    </>
  )
}