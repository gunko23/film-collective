"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  LayoutDashboard,
  BarChart3,
  Activity,
  MessageSquare,
  Users,
  Film,
  Tv,
  Clapperboard,
  Star,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
  ArrowLeft,
} from "lucide-react"
import { CollectiveMoviesGrid } from "@/components/collective-movies-grid"
import { CollectiveMovieModal } from "@/components/collective-movie-modal"
import { CollectiveTVShowModal } from "@/components/collective-tv-show-modal"
import { MessageBoard } from "@/components/message-board"
import { MembersModal } from "@/components/members-modal"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { EnhancedComments } from "@/components/enhanced-comments"
import { getImageUrl } from "@/lib/tmdb/image"
import { MessageCircle } from "lucide-react"
import { GeneralDiscussion } from "@/components/general-discussion"
import { CollectiveActions } from "@/components/collective-actions"

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

type FeedItemWithEngagement = {
  rating_id: string
  user_id: string
  user_name: string | null
  user_avatar: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
  tmdb_id: string
  title: string
  poster_path: string | null
  media_type: string
  episode_name?: string
  episode_number?: number
  season_number?: number
  tv_show_name?: string
  tv_show_id?: number
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

type Section = "dashboard" | "insights" | "feed" | "messageboard" | "discussion"

const sectionConfig: { value: Section; label: string; icon: React.ReactNode; description?: string }[] = [
  { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
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
  {
    value: "messageboard",
    label: "Message Board",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Post messages to the collective",
  },
]

const REACTION_EMOJI_MAP: Record<string, string> = {
  thumbsup: "👍",
  heart: "❤️",
  laugh: "😂",
  fire: "🔥",
  sad: "😢",
  celebrate: "🎉",
}

const getReactionEmoji = (type: string): string => {
  return REACTION_EMOJI_MAP[type] || type
}

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

  const [feedItems, setFeedItems] = useState<FeedItemWithEngagement[]>([])
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
        setFeedItems(data.feedItems)
        setFeedTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching feed:", error)
    } finally {
      setFeedLoading(false)
    }
  }

  const totalFeedPages = Math.ceil(feedTotal / FEED_LIMIT)

  const getActivityConversationLink = (item: any) => {
    if (!item.tmdb_id) {
      // Fallback to old rating-based link if tmdb_id not available
      return `/collectives/${collectiveId}/conversation/${item.rating_id}`
    }
    const mediaType = item.media_type === "movie" ? "movie" : "tv"
    return `/collectives/${collectiveId}/movie/${item.tmdb_id}/conversation?type=${mediaType}`
  }

  const getConversationLink = (item: FeedItemWithEngagement) => {
    const mediaType = item.media_type === "movie" ? "movie" : "tv"
    const tmdbId = item.media_type === "movie" ? item.tmdb_id : item.tv_show_id
    return `/collectives/${collectiveId}/movie/${tmdbId}/conversation?type=${mediaType}`
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="h-3 w-3" />
      case "tv":
        return <Tv className="h-3 w-3" />
      case "episode":
        return <PlayCircle className="h-3 w-3" />
      default:
        return <Film className="h-3 w-3" />
    }
  }

  const handleMovieClick = (movie: MovieStat) => {
    setSelectedMovie(movie)
  }

  const handleTVShowClick = (show: TVShowStat) => {
    setSelectedTVShow(show)
  }

  const handleMovieClickFromFeed = (tmdbId: string) => {
    const movie = movieStats.find((m) => m.tmdb_id === tmdbId)
    if (movie) {
      setSelectedMovie(movie)
    }
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
          <div className="space-y-8">
            {/* Top Rated Movies */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Film className="h-5 w-5 text-accent" />
                  Top Movies
                </h2>
                {movieStats.length > 10 && (
                  <Link href={`/collectives/${collectiveId}/movies`} className="text-sm text-accent hover:underline">
                    View All ({movieStats.length})
                  </Link>
                )}
              </div>
              <CollectiveMoviesGrid movies={movieStats.slice(0, 10)} onMovieClick={handleMovieClick} />
            </div>

            {/* Top Rated TV Shows */}
            {tvShowStats.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Tv className="h-5 w-5 text-accent" />
                    Top TV Shows
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tvShowStats.slice(0, 10).map((show, idx) => (
                    <button
                      key={show.tv_show_id}
                      onClick={() => handleTVShowClick(show)}
                      className="group relative rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300">
                        {show.poster_path ? (
                          <img
                            src={getImageUrl(show.poster_path, "w342") || "/placeholder.svg"}
                            alt={show.name || "TV Show"}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Tv className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Rating badge - top right like movies */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                          <Star className="h-3 w-3 text-accent fill-accent" />
                          <span className="text-xs font-bold">{(Number(show.avg_score) / 20).toFixed(1)}</span>
                        </div>
                        {/* Rating count badge - bottom left like movies */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                          <span className="text-xs text-muted-foreground">
                            {show.rating_count} {Number(show.rating_count) === 1 ? "rating" : "ratings"}
                          </span>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-full bg-background/90 text-sm font-medium">
                            View Ratings
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                          {show.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {show.first_air_date ? new Date(show.first_air_date).getFullYear() : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Rated Episodes */}
            {episodeStats.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-accent" />
                    Top Episodes
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {episodeStats.slice(0, 10).map((episode, idx) => (
                    <Link
                      key={episode.episode_id}
                      href={`/tv/${episode.tv_show_id}/season/${episode.season_number}`}
                      className="block p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/50 transition-all"
                    >
                      {/* Top row: Rank + Image + Rating */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Rank */}
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-accent-foreground">{idx + 1}</span>
                        </div>
                        {/* Still/Poster */}
                        <div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                          {episode.still_path ? (
                            <img
                              src={getImageUrl(episode.still_path, "w185") || "/placeholder.svg"}
                              alt={episode.episode_name}
                              className="w-full h-full object-cover"
                            />
                          ) : episode.tv_show_poster ? (
                            <img
                              src={getImageUrl(episode.tv_show_poster, "w92") || "/placeholder.svg"}
                              alt={episode.tv_show_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Tv className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        {/* Rating */}
                        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                          <span className="text-sm font-bold text-accent">
                            {(Number(episode.avg_score) / 20).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {/* Bottom row: Title and details */}
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{episode.episode_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {episode.tv_show_name} &bull; S{episode.season_number}E{episode.episode_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {episode.rating_count} {Number(episode.rating_count) === 1 ? "rating" : "ratings"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {movieStats.length === 0 && tvShowStats.length === 0 && episodeStats.length === 0 && (
              <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
                <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No ratings yet. Start rating movies and TV shows!</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Recent Activity
                </h2>
                <button onClick={() => setActiveSection("feed")} className="text-sm text-accent hover:underline">
                  View All
                </button>
              </div>

              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-card/30 border border-border/50">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <Link
                      key={item.id}
                      href={getActivityConversationLink(item)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-all group"
                    >
                      {/* User Avatar */}
                      <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.user_avatar ? (
                          <Image
                            src={item.user_avatar || "/placeholder.svg"}
                            alt={item.user_name || "User"}
                            width={36}
                            height={36}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-accent">
                            {(item.user_name || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{item.user_name || "Someone"}</span>
                          {item.activity_type === "comment" ? (
                            <>
                              {" "}
                              commented on <span className="font-medium">{item.rating_owner_name || "a"}</span>'s review
                            </>
                          ) : (
                            <>
                              {" "}
                              reacted <span className="text-base">{getReactionEmoji(item.reaction_type)}</span> to{" "}
                              <span className="font-medium">{item.rating_owner_name || "a"}</span>'s review
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.media_title && (
                            <>
                              <span className="capitalize">{item.media_type}</span>: {item.media_title}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Activity Icon */}
                      <div className="flex-shrink-0">
                        {item.activity_type === "comment" ? (
                          <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        ) : (
                          <span className="text-base">{getReactionEmoji(item.reaction_type)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights Section */}
        {activeSection === "insights" && insightsContent}

        {/* Feed Section */}
        {activeSection === "feed" && (
          <div className="mb-8 overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
              <p className="text-sm text-muted-foreground">
                {feedTotal} rating{feedTotal !== 1 ? "s" : ""} from collective members
              </p>
            </div>

            {feedLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-16 border border-border/50 rounded-xl bg-card/30">
                <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No activity yet</p>
                <p className="text-sm text-muted-foreground/70">Be the first to rate something!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 overflow-hidden">
                  {feedItems.map((item) => {
                    const score = Number(item.overall_score) / 20
                    const posterUrl =
                      item.media_type === "episode"
                        ? getImageUrl(item.poster_path, "w300")
                        : getImageUrl(item.poster_path, "w185")
                    const year = item.rated_at ? new Date(item.rated_at).getFullYear() : null

                    return (
                      <div
                        key={`${item.media_type}-${item.rating_id}`}
                        className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm p-4 hover:border-accent/30 transition-colors overflow-hidden"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-4">
                          <Link
                            href={`/user/${item.user_id}`}
                            className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-emerald-500/30 transition-all"
                          >
                            {item.user_avatar ? (
                              <Image
                                src={item.user_avatar || "/placeholder.svg"}
                                alt={item.user_name || "User"}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-accent">
                                {(item.user_name || "U")[0].toUpperCase()}
                              </span>
                            )}
                          </Link>
                          <div className="flex-1">
                            <Link
                              href={`/user/${item.user_id}`}
                              className="font-medium text-foreground hover:text-emerald-400 transition-colors"
                            >
                              {item.user_name || "Anonymous"}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.rated_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                            {getMediaIcon(item.media_type)}
                            <span className="capitalize">{item.media_type}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex gap-4">
                          {item.media_type === "movie" ? (
                            <button
                              onClick={() =>
                                setSelectedMovie({
                                  tmdb_id: item.tmdb_id,
                                  title: item.title,
                                  poster_path: item.poster_path,
                                  release_date: item.release_date || "",
                                  avg_score: Number(item.overall_score),
                                  rating_count: 0,
                                })
                              }
                              className="flex-shrink-0 cursor-pointer"
                            >
                              {posterUrl ? (
                                <Image
                                  src={posterUrl || "/placeholder.svg"}
                                  alt={item.title}
                                  width={80}
                                  height={120}
                                  className="rounded-lg object-cover hover:ring-2 hover:ring-accent transition-all"
                                />
                              ) : (
                                <div className="w-20 h-[120px] bg-muted rounded-lg flex items-center justify-center hover:ring-2 hover:ring-accent transition-all">
                                  <span className="text-xs text-muted-foreground">No image</span>
                                </div>
                              )}
                            </button>
                          ) : (
                            <Link href={getConversationLink(item)} className="flex-shrink-0">
                              {posterUrl ? (
                                <Image
                                  src={posterUrl || "/placeholder.svg"}
                                  alt={item.title}
                                  width={item.media_type === "episode" ? 120 : 80}
                                  height={item.media_type === "episode" ? 68 : 120}
                                  className="rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className={`${item.media_type === "episode" ? "w-[120px] h-[68px]" : "w-20 h-[120px]"} bg-muted rounded-lg flex items-center justify-center`}
                                >
                                  <span className="text-xs text-muted-foreground">No image</span>
                                </div>
                              )}
                            </Link>
                          )}

                          <div className="flex-1 min-w-0">
                            {item.media_type === "movie" ? (
                              <button
                                onClick={() =>
                                  setSelectedMovie({
                                    tmdb_id: item.tmdb_id,
                                    title: item.title,
                                    poster_path: item.poster_path,
                                    release_date: item.release_date || "",
                                    avg_score: Number(item.overall_score),
                                    rating_count: 0,
                                  })
                                }
                                className="hover:text-accent transition-colors text-left"
                              >
                                <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                              </button>
                            ) : (
                              <Link href={getConversationLink(item)} className="hover:text-accent transition-colors">
                                <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                              </Link>
                            )}
                            {item.media_type === "episode" && (
                              <p className="text-sm text-muted-foreground">
                                {item.tv_show_name} - S{item.season_number}E{item.episode_number}
                              </p>
                            )}

                            {/* Rating */}
                            <div className="flex items-center gap-2 mt-2">
                              <StarRatingDisplay rating={score} size="md" />
                              <span className="text-sm font-medium text-foreground">{score.toFixed(1)}</span>
                            </div>

                            {/* Comment (movies only for now) */}
                            {item.user_comment && (
                              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">"{item.user_comment}"</p>
                            )}
                          </div>
                        </div>

                        {/* Interactions */}
                        <EnhancedComments
                          ratingId={item.rating_id}
                          currentUserId={currentUserId}
                          collectiveId={collectiveId}
                          mediaTitle={item.title}
                          mediaType={item.media_type as "movie" | "tv" | "episode"}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalFeedPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setFeedPage((p) => Math.max(0, p - 1))}
                      disabled={feedPage === 0}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {feedPage + 1} of {totalFeedPages}
                    </span>
                    <button
                      onClick={() => setFeedPage((p) => Math.min(totalFeedPages - 1, p + 1))}
                      disabled={feedPage >= totalFeedPages - 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Message Board Section */}
        {activeSection === "messageboard" && (
          <div className="mb-8">
            <MessageBoard collectiveId={collectiveId} />
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
