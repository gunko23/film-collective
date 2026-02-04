"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useAblyChannel } from "@/hooks/use-ably-channel"
import { useAblyPresence } from "@/hooks/use-ably-presence"
import { getFeedChannelName } from "@/lib/ably/channel-names"
import { Send, ImageIcon, X, MessageCircle, ChevronRight, Loader2, Smile, CheckCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Expanded emoji reactions
const EMOJI_REACTIONS = [
  { emoji: "👍", type: "thumbsup", label: "Like" },
  { emoji: "❤️", type: "heart", label: "Love" },
  { emoji: "😂", type: "laugh", label: "Haha" },
  { emoji: "🔥", type: "fire", label: "Fire" },
  { emoji: "😢", type: "sad", label: "Sad" },
  { emoji: "🎉", type: "celebrate", label: "Celebrate" },
  { emoji: "😍", type: "heart_eyes", label: "Heart Eyes" },
  { emoji: "🤯", type: "mind_blown", label: "Mind Blown" },
  { emoji: "👏", type: "clap", label: "Clap" },
  { emoji: "💯", type: "hundred", label: "100" },
]

// Quick emoji insert options
const QUICK_EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "🎬", "🍿", "⭐", "😍", "🤔", "😭", "🙌"]

type CommentReaction = {
  id: string
  user_id: string
  user_name?: string
  reaction_type: string
}

type Reaction = {
  id: string
  user_id: string
  user_name?: string
  reaction_type: string
}

type Comment = {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  content: string
  gif_url?: string
  created_at: string
  reactions?: CommentReaction[]
}

type TypingUser = {
  user_id: string
  user_name: string
}

type Props = {
  ratingId: string
  currentUserId: string
  collectiveId: string
  mediaTitle?: string
  initialCommentCount?: number
  mediaType?: "movie" | "tv" | "episode"
  currentUserName?: string
  onCommentAdded?: () => void
}

async function searchGifs(query: string): Promise<{ url: string; preview: string }[]> {
  try {
    const response = await fetch(`/api/gif/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error("Failed to fetch GIFs")
    const data = await response.json()
    return data.results || []
  } catch {
    return []
  }
}

// Safe date formatting helper function
function formatCommentTime(dateString: string | undefined | null): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

// Date formatting helper for date dividers
const formatMessageDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
    }
  } catch {
    return ""
  }
}

const shouldShowDateDivider = (currentComment: Comment, previousComment: Comment | undefined) => {
  if (!previousComment) return true
  try {
    const currentDate = new Date(currentComment.created_at).toDateString()
    const previousDate = new Date(previousComment.created_at).toDateString()
    return currentDate !== previousDate
  } catch {
    return false
  }
}

// Group reactions by type
const groupReactions = (
  reactions: CommentReaction[],
  currentUserId?: string,
): { type: string; emoji: string; count: number; userReacted: boolean }[] => {
  const normalizedUserId = currentUserId?.toLowerCase()
  return EMOJI_REACTIONS.map((reaction) => {
    const matchingReactions = reactions.filter((r) => r.reaction_type === reaction.type)
    const count = matchingReactions.length
    const userReacted = normalizedUserId
      ? matchingReactions.some((r) => r.user_id?.toLowerCase() === normalizedUserId)
      : false
    return { ...reaction, count, userReacted }
  }).filter((r) => r.count > 0) // Only return reactions that have been used
}

export function EnhancedComments({
  ratingId,
  currentUserId,
  collectiveId,
  mediaTitle,
  initialCommentCount = 0,
  mediaType,
  currentUserName,
  onCommentAdded,
}: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEmojiGifPicker, setShowEmojiGifPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif">("emoji")
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([])
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [searchingGifs, setSearchingGifs] = useState(false)
  const [showCommentReactions, setShowCommentReactions] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const normalizedCurrentUserId = currentUserId?.toLowerCase()

  // Fetch reactions and comments
  const fetchData = useCallback(async () => {
    try {
      const [reactionsRes, commentsRes] = await Promise.all([
        fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/reactions`),
        fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`),
      ])

      if (reactionsRes.ok) {
        const data = await reactionsRes.json()
        setReactions(data.reactions || [])
      }

      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      // Silently fail
    }
  }, [collectiveId, ratingId])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Ably real-time subscriptions
  const channelName = getFeedChannelName(collectiveId, ratingId)

  useAblyChannel({
    channelName,
    eventName: "new_comment",
    enabled: showComments,
    onMessage: useCallback((data: unknown) => {
      const comment = data as Comment
      if (!comment?.id) return
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev
        return [...prev, comment]
      })
    }, []),
  })

  const { typingUsers: ablyTypingUsers, extendTyping, stopTyping } = useAblyPresence({
    channelName,
    currentUserId,
    currentUserName: currentUserName || undefined,
    enabled: showComments,
  })

  useEffect(() => {
    setTypingUsers(ablyTypingUsers)
  }, [ablyTypingUsers])

  // Search GIFs with debounce
  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifs([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingGifs(true)
      const results = await searchGifs(gifSearch)
      setGifs(results)
      setSearchingGifs(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [gifSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    extendTyping()

    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      const maxHeight = 96
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, maxHeight) + "px"
    }
  }

  const handleReaction = async (type: string) => {
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type, mediaType }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.action === "added") {
          setReactions((prev) => [...prev, { id: data.id, user_id: currentUserId, reaction_type: type }])
        } else {
          setReactions((prev) =>
            prev.filter((r) => !(r.user_id?.toLowerCase() === normalizedCurrentUserId && r.reaction_type === type)),
          )
        }
      }
    } catch (error) {
      // Silently fail
    }
    setShowReactionPicker(false)
  }

  const handleCommentReaction = async (commentId: string, type: string) => {
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id !== commentId) return comment

            const reactions = comment.reactions || []
            if (data.action === "added") {
              return {
                ...comment,
                reactions: [...reactions, { id: data.id, user_id: currentUserId, reaction_type: type }],
              }
            } else {
              return {
                ...comment,
                reactions: reactions.filter(
                  (r) => !(r.user_id?.toLowerCase() === normalizedCurrentUserId && r.reaction_type === type),
                ),
              }
            }
          }),
        )
      }
    } catch {}
    setShowCommentReactions(null)
  }

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const handleSendComment = async () => {
    if ((!newComment.trim() && !selectedGif) || loading) return

    setSendingMessage(true)
    setLoading(true)

    const currentTimestamp = new Date().toISOString()

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      gif_url: selectedGif || undefined,
      user_id: currentUserId,
      user_name: currentUserName || "Unknown",
      created_at: currentTimestamp,
      reactions: [], // Ensure reactions is empty array, not undefined
    }

    setComments((prev) => [...prev, optimisticComment])

    const messageContent = newComment.trim()
    const gifContent = selectedGif
    setNewComment("")
    setSelectedGif(null)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    // Keep keyboard open
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          gifUrl: gifContent,
          mediaType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const savedComment = data.comment

        if (savedComment) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === optimisticComment.id
                ? {
                    ...savedComment,
                    created_at: savedComment.created_at || currentTimestamp,
                    reactions: savedComment.reactions || [], // Ensure reactions array
                  }
                : c,
            ),
          )
        }
        onCommentAdded?.()
      } else {
        console.error("Failed to save comment, status:", res.status)
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      // Keep optimistic comment visible
    } finally {
      setLoading(false)
      setTimeout(() => setSendingMessage(false), 200)
    }
  }

  const selectGif = (url: string) => {
    setSelectedGif(url)
    setShowEmojiGifPicker(false)
    setGifSearch("")
    inputRef.current?.focus()
  }

  const reactionCounts = reactions.reduce(
    (acc, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const userReactions = reactions
    .filter((r) => r.user_id?.toLowerCase() === normalizedCurrentUserId)
    .map((r) => r.reaction_type)
  const hasEnoughForConversation = comments.length >= 3
  const displayedComments = hasEnoughForConversation ? comments.slice(-3) : comments

  return (
    <div className="space-y-3 overflow-hidden">
      {/* Reaction bar */}
      <div className="flex items-center gap-3 flex-wrap overflow-x-auto">
        {/* Quick reactions display */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {Object.entries(reactionCounts).map(([type, count]) => {
            const reactionData = EMOJI_REACTIONS.find((r) => r.type === type)
            const hasReacted = userReactions.includes(type)
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all duration-200 flex-shrink-0",
                  hasReacted
                    ? "bg-blue-500/20 border border-blue-500/40 scale-105"
                    : "bg-muted/50 hover:bg-muted border border-transparent hover:scale-105",
                )}
              >
                <span className="text-base">{reactionData?.emoji || "👍"}</span>
                <span className={cn("text-xs font-medium", hasReacted ? "text-blue-400" : "text-muted-foreground")}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Add reaction button */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-110"
          >
            <span className="text-lg">+</span>
          </button>

          {/* Reaction picker popup */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 grid grid-cols-5 gap-0.5 w-[150px]">
              {EMOJI_REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all duration-200 hover:scale-110 hover:bg-muted",
                    userReactions.includes(reaction.type) && "bg-zinc-500/20",
                  )}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ml-auto",
            showComments ? "bg-blue-500/20 text-blue-400" : "bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length || initialCommentCount}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* View all link for 3+ comments */}
          {hasEnoughForConversation && (
            <Link
              href={`/collectives/${collectiveId}/conversation/${ratingId}`}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  View full conversation ({comments.length} messages)
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
            </Link>
          )}

          {/* Comments list - premium chat bubble style */}
          {displayedComments.length > 0 && (
            <div className="space-y-2">
              {displayedComments.map((comment, index) => {
                const isOwnComment = comment.user_id === currentUserId
                const groupedReactions = groupReactions(comment.reactions || [], currentUserId)
                const showDateDivider = shouldShowDateDivider(comment, displayedComments[index - 1])
                const showAvatar =
                  !isOwnComment && (index === 0 || displayedComments[index - 1]?.user_id !== comment.user_id)

                return (
                  <div key={comment.id}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="px-3 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          {formatMessageDate(comment.created_at)}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex gap-2 group",
                        isOwnComment ? "justify-end" : "justify-start",
                        "animate-in fade-in duration-300",
                        index === displayedComments.length - 1 && "slide-in-from-bottom-2",
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onMouseEnter={() => setHoveredCommentId(comment.id)}
                      onMouseLeave={() => {
                        setHoveredCommentId(null)
                        setShowCommentReactions(null)
                      }}
                    >
                      {/* Avatar */}
                      {!isOwnComment && (
                        <div className="w-7 flex-shrink-0">
                          {showAvatar && (
                            <Link
                              href={`/user/${comment.user_id}`}
                              className="block h-7 w-7 rounded-full bg-emerald-600/20 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-emerald-500/30 transition-all"
                            >
                              {comment.user_avatar ? (
                                <Image
                                  src={comment.user_avatar || "/placeholder.svg"}
                                  alt={comment.user_name}
                                  width={28}
                                  height={28}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-400">
                                  {comment.user_name?.[0]?.toUpperCase() || "?"}
                                </span>
                              )}
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`max-w-[75%] ${isOwnComment ? "items-end" : "items-start"}`}>
                        {!isOwnComment && showAvatar && (
                          <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{comment.user_name}</p>
                        )}

                        <div className="relative">
                          <div
                            className={cn(
                              "rounded-2xl px-2.5 py-1.5 transition-all duration-200",
                              isOwnComment
                                ? "bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-br-md shadow-lg"
                                : "bg-card/80 border border-border/50 text-foreground rounded-bl-md",
                            )}
                          >
                            {comment.gif_url && (
                              <div className="mb-1.5 rounded-lg overflow-hidden">
                                <Image
                                  src={comment.gif_url || "/placeholder.svg"}
                                  alt="GIF"
                                  width={200}
                                  height={150}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            {comment.content && (
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                            )}
                            <div
                              className={cn(
                                "flex items-center gap-1 mt-0.5",
                                isOwnComment ? "justify-end" : "justify-start",
                              )}
                            >
                              <span
                                className={cn("text-[9px]", isOwnComment ? "text-zinc-400" : "text-muted-foreground")}
                              >
                                {formatCommentTime(comment.created_at)}
                              </span>
                              {isOwnComment && <CheckCheck className="h-3 w-3 text-emerald-400/70" />}
                            </div>
                          </div>

                          {/* Reaction button */}
                          <button
                            onClick={() =>
                              setShowCommentReactions(showCommentReactions === comment.id ? null : comment.id)
                            }
                            className={cn(
                              "absolute -right-1 top-1/2 -translate-y-1/2 p-1 rounded-full",
                              "bg-zinc-800/90 text-zinc-400 hover:text-white",
                              "opacity-0 group-hover:opacity-100 transition-all duration-200",
                              "shadow-lg hover:scale-110",
                            )}
                          >
                            <Smile className="h-3 w-3" />
                          </button>

                          {/* Reaction picker */}
                          {showCommentReactions === comment.id && (
                            <div className="absolute -top-10 right-0 bg-zinc-800/95 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-zinc-700/50 z-10 grid grid-cols-5 gap-1 w-[140px]">
                              {EMOJI_REACTIONS.slice(0, 10).map((reaction) => (
                                <button
                                  key={reaction.type}
                                  onClick={() => handleCommentReaction(comment.id, reaction.type)}
                                  className="p-1 hover:bg-zinc-700/50 rounded transition-colors text-base hover:scale-125"
                                  title={reaction.label}
                                >
                                  {reaction.emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Display reactions */}
                        {groupedReactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {groupedReactions.map((reaction) => (
                              <button
                                key={reaction.type}
                                onClick={() => handleCommentReaction(comment.id, reaction.type)}
                                className={cn(
                                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                                  "bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors",
                                  reaction.userReacted && "ring-1 ring-emerald-500/50",
                                )}
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-zinc-400">{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center gap-1 px-3 py-2 bg-muted/50 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {typingUsers.length === 1
                  ? `${typingUsers[0].user_name} is typing...`
                  : `${typingUsers.length} people typing...`}
              </span>
            </div>
          )}

          {/* Combined Emoji & GIF Picker */}
          {showEmojiGifPicker && (
            <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-xl">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-3 border-b border-border/50 pb-2">
                <button
                  type="button"
                  onClick={() => setPickerTab("emoji")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    pickerTab === "emoji"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Smile className="h-4 w-4" />
                  Emoji
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTab("gif")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    pickerTab === "gif"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <ImageIcon className="h-4 w-4" />
                  GIF
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiGifPicker(false)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Emoji Tab */}
              {pickerTab === "emoji" && (
                <div className="flex flex-wrap gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-muted hover:scale-110 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* GIF Tab */}
              {pickerTab === "gif" && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      placeholder="Search GIFs..."
                      className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {searchingGifs && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {gifs.map((gif, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedGif(gif.url)
                          setShowEmojiGifPicker(false)
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                      >
                        <Image
                          src={gif.preview || "/placeholder.svg"}
                          alt="GIF"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                    {gifs.length === 0 && !searchingGifs && (
                      <p className="col-span-3 text-center text-sm text-muted-foreground py-4">Search for GIFs above</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected GIF preview */}
          {selectedGif && (
            <div className="relative inline-block animate-in fade-in zoom-in-95 duration-200">
              <Image
                src={selectedGif || "/placeholder.svg"}
                alt="Selected GIF"
                width={120}
                height={80}
                className="rounded-lg shadow-lg"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setSelectedGif(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendComment} className="w-full overflow-hidden">
            <div className="relative flex-1 flex items-center gap-1 bg-muted/50 rounded-full px-3 border border-transparent focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all min-w-0">
              <button
                type="button"
                onClick={() => setShowEmojiGifPicker(!showEmojiGifPicker)}
                className={cn(
                  "p-1.5 rounded-full transition-colors flex-shrink-0",
                  showEmojiGifPicker
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Smile className="h-5 w-5" />
              </button>

              <textarea
                ref={inputRef}
                placeholder="Write a message..."
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  // Auto-resize
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendComment()
                  }
                }}
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm py-2 leading-5 resize-none min-h-[36px] max-h-[96px] overflow-y-auto placeholder:text-muted-foreground/60"
                rows={1}
              />

              <Button
                type="submit"
                size="icon"
                disabled={(!newComment.trim() && !selectedGif) || loading}
                className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex-shrink-0 transition-all duration-200 active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
