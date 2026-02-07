"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Film, Tv, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { EnhancedComments } from "@/components/enhanced-comments"
import { getImageUrl } from "@/lib/tmdb/image"

type MovieStat = {
  tmdb_id: string
  title: string
  poster_path: string | null
  release_date: string | null
  avg_score: number
  rating_count: number
  genres?: any
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
  release_date?: string
}

type FeedSectionProps = {
  feedItems: FeedItemWithEngagement[]
  feedLoading: boolean
  feedTotal: number
  feedPage: number
  totalFeedPages: number
  setFeedPage: React.Dispatch<React.SetStateAction<number>>
  collectiveId: string
  currentUserId: string
  onSelectMovie: (movie: MovieStat) => void
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

export function FeedSection({
  feedItems,
  feedLoading,
  feedTotal,
  feedPage,
  totalFeedPages,
  setFeedPage,
  collectiveId,
  currentUserId,
  onSelectMovie,
}: FeedSectionProps) {
  const getConversationLink = (item: FeedItemWithEngagement) => {
    const mediaType = item.media_type === "movie" ? "movie" : "tv"
    const tmdbId = item.media_type === "movie" ? item.tmdb_id : item.tv_show_id
    return `/collectives/${collectiveId}/movie/${tmdbId}/conversation?type=${mediaType}`
  }

  return (
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
                          onSelectMovie({
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
                            onSelectMovie({
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
  )
}
