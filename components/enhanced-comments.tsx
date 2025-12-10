"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
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
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&client_key=film_collective&limit=12`,
    )
    if (!response.ok) throw new Error("Failed to fetch GIFs")
    const data = await response.json()
    return (
      data.results?.map((gif: { media_formats: { gif: { url: string }; tinygif: { url: string } } }) => ({
        url: gif.media_formats.gif?.url || gif.media_formats.tinygif?.url,
        preview: gif.media_formats.tinygif?.url || gif.media_formats.gif?.url,
      })) || []
    )
  } catch {
    return []
  }
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
  const [showPicker, setShowPicker] = useState(false)
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
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingUpdateRef = useRef<number>(0)

  const normalizedCurrentUserId = currentUserId?.toLowerCase()

  // Fetch reactions and comments
  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData()
  }, [ratingId, collectiveId])

  // Poll for typing indicators when comments are shown
  useEffect(() => {
    if (!showComments) return

    const pollTyping = async () => {
      try {
        const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/typing`)
        if (res.ok) {
          const data = await res.json()
          setTypingUsers(
            data.typingUsers?.filter((u: TypingUser) => u.user_id?.toLowerCase() !== normalizedCurrentUserId) || [],
          )
        }
      } catch {}
    }

    pollTyping()
    const interval = setInterval(pollTyping, 2000)
    return () => clearInterval(interval)
  }, [showComments, collectiveId, ratingId, normalizedCurrentUserId])

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

  // Handle typing indicator
  const updateTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      const now = Date.now()
      // Throttle typing updates to once per 2 seconds
      if (isTyping && now - lastTypingUpdateRef.current < 2000) return
      lastTypingUpdateRef.current = now

      try {
        await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping }),
        })
      } catch {}
    },
    [collectiveId, ratingId],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)

    // Update typing indicator
    updateTypingIndicator(true)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingIndicator(false)
    }, 3000)

    if (commentInputRef.current) {
      commentInputRef.current.style.height = "auto"
      const maxHeight = 96 // 4 rows * ~24px line height
      commentInputRef.current.style.height = Math.min(commentInputRef.current.scrollHeight, maxHeight) + "px"
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
    commentInputRef.current?.focus()
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && !selectedGif) || loading) return

    console.log("[v0] EnhancedComments - Submitting comment:", { newComment, selectedGif })

    setSendingMessage(true)
    setLoading(true)

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      gif_url: selectedGif,
      user_id: currentUserId,
      user_name: currentUserName || "Unknown",
      created_at: new Date().toISOString(),
      reactions: [],
    }

    setComments((prev) => [...prev, optimisticComment])

    const messageContent = newComment.trim()
    const gifContent = selectedGif
    setNewComment("")
    setSelectedGif(null)

    // Reset textarea height
    if (commentInputRef.current) {
      commentInputRef.current.style.height = "auto"
      // Keep focus on input to prevent keyboard from closing
      commentInputRef.current.focus()
    }

    try {
      console.log("[v0] EnhancedComments - Making API call")
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          gifUrl: gifContent,
          mediaType,
        }),
      })

      console.log("[v0] EnhancedComments - API response status:", res.status)

      if (res.ok) {
        const savedComment = await res.json()
        console.log("[v0] EnhancedComments - Comment saved:", savedComment)
        setComments((prev) => prev.map((c) => (c.id === optimisticComment.id ? { ...savedComment, reactions: [] } : c)))
        onCommentAdded?.()
      } else {
        const errorText = await res.text()
        console.error("[v0] EnhancedComments - Failed to save comment:", errorText)
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      }
    } catch (error) {
      console.error("[v0] EnhancedComments - Error posting comment:", error)
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
    } finally {
      setLoading(false)
      setTimeout(() => setSendingMessage(false), 200)
      requestAnimationFrame(() => {
        commentInputRef.current?.focus()
      })
    }
  }

  const selectGif = (url: string) => {
    setSelectedGif(url)
    setShowPicker(false)
    setGifSearch("")
    commentInputRef.current?.focus()
  }

  // Group reactions by type
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
    <div className="mt-4 pt-4 border-t border-border/30 overflow-hidden">
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
                const isOwnComment = comment.user_id?.toLowerCase() === normalizedCurrentUserId
                const commentReactions = comment.reactions || []
                const commentReactionCounts = commentReactions.reduce(
                  (acc, r) => {
                    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
                    return acc
                  },
                  {} as Record<string, number>,
                )
                const userCommentReactions = commentReactions
                  .filter((r) => r.user_id?.toLowerCase() === normalizedCurrentUserId)
                  .map((r) => r.reaction_type)

                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "flex gap-2 group",
                      isOwnComment ? "flex-row-reverse" : "flex-row",
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden ring-2 ring-background">
                      {comment.user_avatar ? (
                        <Image
                          src={comment.user_avatar || "/placeholder.svg"}
                          alt={comment.user_name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {comment.user_name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className="relative max-w-[75%]">
                      <div
                        className={cn(
                          "rounded-2xl px-2.5 py-1.5 transition-all duration-200",
                          isOwnComment
                            ? "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white rounded-br-md shadow-md shadow-zinc-900/20"
                            : "bg-muted/80 text-foreground rounded-bl-md shadow-sm",
                        )}
                      >
                        {!isOwnComment && (
                          <p className="text-[10px] font-semibold mb-0.5 opacity-70">{comment.user_name}</p>
                        )}
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
                          <span className={cn("text-[9px]", isOwnComment ? "text-zinc-400" : "text-muted-foreground")}>
                            {new Date(comment.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOwnComment && (
                            <span className="text-zinc-400 text-[9px]">
                              <CheckCheck className="h-2.5 w-2.5 inline" />
                            </span>
                          )}
                        </div>
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
          {showPicker && (
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
                  onClick={() => setShowPicker(false)}
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
                          setShowPicker(false)
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

          <form onSubmit={handleAddComment} className="flex items-end gap-2 w-full overflow-hidden">
            <div className="flex-1 min-w-0 flex items-end gap-1 bg-muted/50 border border-border/50 rounded-2xl pl-2 pr-1 py-1 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                  "flex-shrink-0 p-2 rounded-full transition-all duration-200 self-end mb-0.5",
                  showPicker
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Smile className="h-5 w-5" />
              </button>
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment(e)
                  }
                }}
                placeholder="Send a message..."
                rows={1}
                className="flex-1 min-w-0 w-full bg-transparent text-sm focus:outline-none py-2 resize-none overflow-y-auto"
                style={{ maxHeight: "96px" }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={(!newComment.trim() && !selectedGif) || loading}
                className={cn(
                  "flex-shrink-0 rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 transition-all duration-200 self-end mb-0.5",
                  sendingMessage && "scale-90",
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send
                    className={cn("h-4 w-4 transition-transform", sendingMessage && "translate-x-1 -translate-y-1")}
                  />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
