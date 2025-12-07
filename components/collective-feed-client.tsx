"use client"

import { useState, useEffect } from "react"
import { useUser } from "@stackframe/stack"
import {
  Star,
  Film,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Flame,
  ThumbsUp,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/tmdb/image"
import Link from "next/link"

type Reaction = {
  type: string
  count: number
}

type FeedItem = {
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
  reactions: Reaction[] | null
  comment_count: number
}

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name: string | null
  user_avatar: string | null
}

const REACTION_TYPES = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "love", icon: Heart, label: "Love" },
  { type: "fire", icon: Flame, label: "Fire" },
  { type: "sparkle", icon: Sparkles, label: "Amazing" },
]

type Props = {
  collectiveId: string
}

export function CollectiveFeedClient({ collectiveId }: Props) {
  const user = useUser()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [userReactions, setUserReactions] = useState<{ rating_id: string; reaction_type: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [ratingId: string]: Comment[] }>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchFeed()
  }, [collectiveId, page])

  const fetchFeed = async () => {
    console.log("[v0] CollectiveFeedClient fetching feed for:", collectiveId, "page:", page)
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/collectives/${collectiveId}/feed?page=${page}&limit=10`)
      console.log("[v0] Feed response status:", res.status)

      const text = await res.text()
      console.log("[v0] Feed response text:", text)

      if (!res.ok) {
        try {
          const errorData = JSON.parse(text)
          setError(`Failed to load feed: ${errorData.details || errorData.error || res.status}`)
        } catch {
          setError(`Failed to load feed: ${text || res.status}`)
        }
        return
      }

      const data = JSON.parse(text)
      console.log("[v0] Feed data received:", data)
      setFeed(data.feed || [])
      setUserReactions(data.userReactions || [])
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      console.error("[v0] Error fetching feed:", err)
      setError("Failed to load feed")
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (ratingId: string, reactionType: string) => {
    try {
      const res = await fetch(`/api/feed/${ratingId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      })

      if (res.ok) {
        const { added } = await res.json()

        // Update local state
        if (added) {
          setUserReactions((prev) => [...prev, { rating_id: ratingId, reaction_type: reactionType }])
        } else {
          setUserReactions((prev) =>
            prev.filter((r) => !(r.rating_id === ratingId && r.reaction_type === reactionType)),
          )
        }

        // Update feed item reactions
        setFeed((prev) =>
          prev.map((item) => {
            if (item.rating_id === ratingId) {
              const reactions = item.reactions || []
              const existingIdx = reactions.findIndex((r) => r.type === reactionType)

              if (added) {
                if (existingIdx >= 0) {
                  reactions[existingIdx].count++
                } else {
                  reactions.push({ type: reactionType, count: 1 })
                }
              } else {
                if (existingIdx >= 0) {
                  reactions[existingIdx].count--
                  if (reactions[existingIdx].count <= 0) {
                    reactions.splice(existingIdx, 1)
                  }
                }
              }

              return { ...item, reactions: [...reactions] }
            }
            return item
          }),
        )
      }
    } catch (error) {
      console.error("Error toggling reaction:", error)
    }
  }

  const toggleComments = async (ratingId: string) => {
    if (expandedComments === ratingId) {
      setExpandedComments(null)
      return
    }

    setExpandedComments(ratingId)

    if (!comments[ratingId]) {
      try {
        setLoadingComments(ratingId)
        const res = await fetch(`/api/feed/${ratingId}/comments`)
        if (res.ok) {
          const data = await res.json()
          setComments((prev) => ({ ...prev, [ratingId]: data.comments }))
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoadingComments(null)
      }
    }
  }

  const handleSubmitComment = async (ratingId: string) => {
    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      const res = await fetch(`/api/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => ({
          ...prev,
          [ratingId]: [
            ...(prev[ratingId] || []),
            { ...data.comment, user_name: user?.displayName, user_avatar: user?.profileImageUrl },
          ],
        }))
        setFeed((prev) =>
          prev.map((item) => (item.rating_id === ratingId ? { ...item, comment_count: item.comment_count + 1 } : item)),
        )
        setNewComment("")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const hasUserReacted = (ratingId: string, reactionType: string) => {
    return userReactions.some((r) => r.rating_id === ratingId && r.reaction_type === reactionType)
  }

  const getReactionCount = (reactions: Reaction[] | null, type: string) => {
    return reactions?.find((r) => r.type === type)?.count || 0
  }

  if (loading && feed.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
        <p className="text-muted-foreground">Loading feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
        <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-destructive mb-2">{error}</p>
        <Button variant="outline" onClick={fetchFeed}>
          Try Again
        </Button>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
        <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No activity yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Rate some movies to see activity in the feed!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feed.map((item) => (
        <div key={item.rating_id} className="rounded-xl bg-card/50 border border-border/50 overflow-hidden">
          {/* Main content */}
          <div className="flex items-start gap-4 p-4">
            {/* User avatar */}
            {item.user_avatar ? (
              <img
                src={item.user_avatar || "/placeholder.svg"}
                alt={item.user_name || "User"}
                className="h-10 w-10 rounded-full shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 shrink-0">
                <span className="text-sm font-semibold text-accent">
                  {(item.user_name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Movie poster */}
            <Link href={`/movies/${item.tmdb_id}`} className="shrink-0 hover:opacity-80 transition-opacity">
              <div className="w-14 h-20 rounded-lg overflow-hidden bg-muted">
                {item.poster_path ? (
                  <img
                    src={getImageUrl(item.poster_path, "w92") || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Film className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{item.user_name || "Someone"}</span>
                {" rated "}
                <Link href={`/movies/${item.tmdb_id}`} className="font-medium hover:text-accent transition-colors">
                  {item.title}
                </Link>
              </p>
              {item.user_comment && <p className="text-sm text-muted-foreground mt-1">"{item.user_comment}"</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(item.rated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 shrink-0">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-sm font-bold text-accent">{(Number(item.overall_score) / 20).toFixed(1)}</span>
            </div>
          </div>

          {/* Reactions and comments bar */}
          <div className="px-4 py-3 border-t border-border/50 bg-card/30">
            <div className="flex items-center justify-between gap-4">
              {/* Reaction buttons */}
              <div className="flex items-center gap-1">
                {REACTION_TYPES.map(({ type, icon: Icon, label }) => {
                  const count = getReactionCount(item.reactions, type)
                  const hasReacted = hasUserReacted(item.rating_id, type)

                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(item.rating_id, type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                        hasReacted
                          ? "bg-accent/20 text-accent"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={label}
                    >
                      <Icon className={`h-3.5 w-3.5 ${hasReacted ? "fill-current" : ""}`} />
                      {count > 0 && <span>{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Comment button */}
              <button
                onClick={() => toggleComments(item.rating_id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all ${
                  expandedComments === item.rating_id
                    ? "bg-accent/20 text-accent"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{item.comment_count || 0} Comments</span>
              </button>
            </div>
          </div>

          {/* Expanded comments section */}
          {expandedComments === item.rating_id && (
            <div className="px-4 py-3 border-t border-border/50 bg-background/50">
              {loadingComments === item.rating_id ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Comments list */}
                  <div className="space-y-3 mb-4">
                    {(comments[item.rating_id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                    ) : (
                      (comments[item.rating_id] || []).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          {comment.user_avatar ? (
                            <img
                              src={comment.user_avatar || "/placeholder.svg"}
                              alt={comment.user_name || "User"}
                              className="h-7 w-7 rounded-full shrink-0"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 shrink-0">
                              <span className="text-xs font-semibold text-accent">
                                {(comment.user_name || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {comment.user_name || "Someone"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitComment(item.rating_id)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(item.rating_id)}
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
