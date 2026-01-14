"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Check, ImageIcon, Loader2, Send, Smile, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// TODO: These should be fetched dynamically or from a config
const MESSAGE_REACTIONS = ["👍", "❤️", "😂", "🔥", "😢", "🎉", "😍", "🤯"]
const EMOJI_LIST = [
  "😀",
  "😂",
  "❤️",
  "🔥",
  "👍",
  "🎬",
  "🍿",
  "⭐",
  "😍",
  "🤔",
  "😭",
  "🙌",
  "💀",
  "😅",
  "🥹",
  "✨",
  "🚀",
  "💡",
  "🎉",
  "💯",
  "🙏",
  "👀",
  "🤯",
  "🤷",
  "🙄",
  "👋",
  "👏",
  "💖",
  "💔",
  "💯",
  "💯",
  "💯",
]
const GIF_PREVIEWS = [
  {
    id: "1",
    title: "Celebration",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmJmNGFhMmIxN2VlYzIxNWE2YTk3NDhkMTJmNGRiYzY4N2IwMWQyYiZlcD12MV9pbnRlcm5hbCZjdD1n/3o7TKs6T66O3Zt8gTK/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmJmNGFhMmIxN2VlYzIxNWE2YTk3NDhkMTJmNGRiYzY4N2IwMWQyYiZlcD12MV9pbnRlcm5hbCZjdD1n/3o7TKs6T66O3Zt8gTK/giphy.gif",
    keywords: ["celebrate", "party", "yay"],
  },
  {
    id: "2",
    title: "Applause",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDRhYTZjNjQwMjEwZWY3OTRkMWMwMzYxNjdlYzJlODc3ZGNjNDg4MCZlcD12MV9pbnRlcm5hbCZjdD1n/3ov9jWu7aH1M0BvUHu/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDRhYTZjNjQwMjEwZWY3OTRkMWMwMzYxNjdlYzJlODc3ZGNjNDg4MCZlcD12MV9pbnRlcm5hbCZjdD1n/3ov9jWu7aH1M0BvUHu/giphy.gif",
    keywords: ["clap", "applause", "yay"],
  },
  {
    id: "3",
    title: "Thinking",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWI5NDdmZTk0ZTBlZTVmZTI2NjgxMWYyODc3ZjcwZmNhOGY4NTBiMCZlcD12MV9pbnRlcm5hbCZjdD1n/Tg0mP78LwVjKk/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWI5NDdmZTk0ZTBlZTVmZTI2NjgxMWYyODc3ZjcwZmNhOGY4NTBiMCZlcD12MV9pbnRlcm5hbCZjdD1n/Tg0mP78LwVjKk/giphy.gif",
    keywords: ["think", "thinking", "hmm"],
  },
  {
    id: "4",
    title: "Laughing",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjhmNTcxMmRiODhiYzgwNGFjMDViZGE1NDZmN2I1YzI3YzQyODk3OCZlcD12MV9pbnRlcm5hbCZjdD1n/3oKIPn3K0wXJjW3W9y/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjhmNTcxMmRiODhiYzgwNGFjMDViZGE1NDZmN2I1YzI3YzQyODk3OCZlcD12MV9pbnRlcm5hbCZjdD1n/3oKIPn3K0wXJjW3W9y/giphy.gif",
    keywords: ["laugh", "lol", "funny"],
  },
  {
    id: "5",
    title: "Mind Blown",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTE2ZWRiYjE1YTA1NjIyYTAzNDc3MDZjZjUyYjZkZTkxNjAwZjQ1OSZlcD12MV9pbnRlcm5hbCZjdD1n/1guRptf8fTKhF1WTRo/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTE2ZWRiYjE1YTA1NjIyYTAzNDc3MDZjZjUyYjZkZTkxNjAwZjQ1OSZlcD12MV9pbnRlcm5hbCZjdD1n/1guRptf8fTKhF1WTRo/giphy.gif",
    keywords: ["mind blown", "wow", "amazing"],
  },
  {
    id: "6",
    title: "Fire",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGUxN2IzNTAxZTJkMzUzYTg2MTYyZTJkOTI5Mzk3OTNiMWExZmZlYyZlcD12MV9pbnRlcm5hbCZjdD1n/3ohzdIJK1SCfH255q8/giphy.gif",
    preview:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGUxN2IzNTAxZTJkMzUzYTg2MTYyZTJkOTI5Mzk3OTNiMWExZmZlYyZlcD12MV9pbnRlcm5hbCZjdD1n/3ohzdIJK1SCfH255q8/giphy.gif",
    keywords: ["fire", "hot", "awesome"],
  },
]

type CommentReaction = {
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
  isNew?: boolean
}

type TypingUser = {
  user_id: string
  user_name: string
}

interface ConversationThreadProps {
  ratingId: string
  collectiveId: string
  currentUserId: string
  mediaType?: "movie" | "tv"
  initialComments?: Comment[]
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

type PickerTab = "emoji" | "gif"

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😢", "🎉", "😍", "🤯"]
const EMOJI_REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "funny", emoji: "😂", label: "Funny" },
  { type: "hot", emoji: "🔥", label: "Hot" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "party", emoji: "🎉", label: "Party" },
  { type: "love", emoji: "😍", label: "Love" },
  { type: "amazed", emoji: "🤯", label: "Amazed" },
]

export function ConversationThread({
  collectiveId,
  ratingId,
  initialComments = [],
  currentUserId,
  currentUserName,
  mediaType = "movie",
}: ConversationThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<PickerTab>("emoji")
  const [gifSearchQuery, setGifSearchQuery] = useState("")
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [searchingGifs, setSearchingGifs] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [reactingToComment, setReactingToComment] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingUpdateRef = useRef<number>(0)
  const pickerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([])
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false)

  const normalizedCurrentUserId = currentUserId?.toLowerCase()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch {
        // Silently fail
      } finally {
        setInitialLoading(false)
      }
    }
    if (!initialComments || initialComments.length === 0) {
      fetchComments()
    } else {
      setInitialLoading(false)
    }
  }, [ratingId, collectiveId, initialComments])

  useEffect(() => {
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
    const interval = setInterval(pollTyping, 10000)
    return () => clearInterval(interval)
  }, [collectiveId, ratingId, normalizedCurrentUserId])

  useEffect(() => {
    if (!hasInitiallyScrolled && comments.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "instant",
      })
      setHasInitiallyScrolled(true)
    }
  }, [comments.length, hasInitiallyScrolled])

  useEffect(() => {
    if (!gifSearchQuery.trim()) {
      setGifs([]) // Clear previous GIFs if search query is empty
      return
    }

    const timer = setTimeout(async () => {
      setSearchingGifs(true)
      const results = await searchGifs(gifSearchQuery)
      setGifs(results)
      setSearchingGifs(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [gifSearchQuery])

  const updateTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      const now = Date.now()
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
    updateTypingIndicator(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingIndicator(false)
    }, 3000)

    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      const maxHeight = 96 // Corresponds to roughly 4 lines of text
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, maxHeight) + "px"
    }
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
              // Add reaction
              return {
                ...comment,
                reactions: [...reactions, { id: data.id, user_id: currentUserId, reaction_type: type }],
              }
            } else {
              // Remove reaction
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
    setReactingToComment(null) // Close the picker after reacting
  }

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && !selectedGif) || loading) {
      return
    }

    console.log("[v0] Submitting comment:", { newComment, selectedGif, collectiveId, ratingId })

    updateTypingIndicator(false) // Stop typing indicator when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    setLoading(true)
    setSendingMessage(true)
    setShowPicker(false) // Close picker on send

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      gif_url: selectedGif || undefined, // Ensure gif_url is undefined if null
      user_id: currentUserId,
      user_name: currentUserName,
      created_at: new Date().toISOString(),
      reactions: [],
      isNew: true, // Mark as new for animation
    }

    setComments((prev) => [...prev, optimisticComment])

    const messageContent = newComment.trim()
    const gifContent = selectedGif
    setNewComment("")
    setSelectedGif(null)

    // Reset textarea height and keep focus
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.focus() // Keep focus on input
    }

    try {
      console.log("[v0] Making API call to:", `/api/collectives/${collectiveId}/feed/${ratingId}/comments`)
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          gifUrl: gifContent,
          mediaType,
        }),
      })

      console.log("[v0] API response status:", res.status)

      if (res.ok) {
        const savedComment = await res.json()
        console.log("[v0] Comment saved:", savedComment)
        // Replace optimistic comment with real one
        setComments((prev) =>
          prev.map((c) => (c.id === optimisticComment.id ? { ...savedComment.comment, isNew: true } : c)),
        ) // Ensure isNew is preserved if needed for animation
      } else {
        const errorText = await res.text()
        console.error("[v0] Failed to save comment:", errorText)
        // Remove optimistic comment on error
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      }
    } catch (error) {
      console.error("[v0] Error posting comment:", error)
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
    } finally {
      setLoading(false)
      setTimeout(() => setSendingMessage(false), 200)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      if (isNearBottom) {
        scrollToBottomIfNeeded()
      }
    }
  }

  const selectGif = (url: string) => {
    setSelectedGif(url)
    setShowPicker(false)
    setGifSearchQuery("") // Clear search query
    inputRef.current?.focus()
  }

  const scrollToBottomIfNeeded = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const threshold = 100
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold)
    }
  }, [])

  const groupedComments = comments.reduce(
    (groups, comment) => {
      const date = new Date(comment.created_at).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(comment)
      return groups
    },
    {} as Record<string, Comment[]>,
  )

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-6 scroll-smooth px-2 py-4"
        style={{ minHeight: 0 }}
      >
        {Object.entries(groupedComments).map(([date, dayComments]) => (
          <div key={date}>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted/50">
                {date}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            </div>

            <div className="space-y-3">
              {dayComments.map((comment, i) => {
                const isOwnComment = comment.user_id?.toLowerCase() === normalizedCurrentUserId
                const prevComment = dayComments[i - 1]
                const showAvatar = !isOwnComment && (!prevComment || prevComment.user_id !== comment.user_id)
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
                      comment.isNew && "animate-in fade-in slide-in-from-bottom-3 duration-300",
                    )}
                    onMouseEnter={() => setHoveredCommentId(comment.id)}
                    onMouseLeave={() => {
                      setHoveredCommentId(null)
                      if (reactingToComment !== comment.id) {
                        setReactingToComment(null)
                      }
                    }}
                  >
                    {!isOwnComment && (
                      <div className={cn("flex-shrink-0 w-8", !showAvatar && "invisible")}>
                        {showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center overflow-hidden ring-2 ring-background shadow-sm">
                            {comment.user_avatar ? (
                              <Image
                                src={comment.user_avatar || "/placeholder.svg"}
                                alt={comment.user_name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-emerald-400">
                                {comment.user_name?.[0]?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="max-w-[75%] relative">
                      {showAvatar && !isOwnComment && (
                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 ml-2">
                          {comment.user_name}
                        </p>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-2.5 py-1.5 transition-all duration-200",
                          isOwnComment
                            ? "bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-br-md shadow-lg"
                            : "bg-card/80 border border-border/50 text-foreground rounded-bl-md",
                        )}
                      >
                        {comment.gif_url && (
                          <div className="mb-1.5 rounded-xl overflow-hidden">
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
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOwnComment && <Check className={cn("h-3 w-3", "text-emerald-400/70")} />}
                        </div>
                      </div>

                      {Object.keys(commentReactionCounts).length > 0 && (
                        <div
                          className={cn(
                            "absolute -bottom-2 flex gap-0.5 px-1.5 py-0.5 bg-card/95 backdrop-blur-sm rounded-full border border-border/50 shadow-sm",
                            isOwnComment ? "left-2" : "right-2",
                          )}
                        >
                          {Object.entries(commentReactionCounts)
                            .slice(0, 4)
                            .map(([type, count]) => {
                              const emoji = EMOJI_REACTIONS.find((r) => r.type === type)?.emoji || "👍"
                              return (
                                <span key={type} className="text-xs flex items-center gap-0.5">
                                  {emoji}
                                  {count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                                </span>
                              )
                            })}
                        </div>
                      )}

                      {hoveredCommentId === comment.id && !comment.id.startsWith("temp-") && (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 z-10",
                            isOwnComment ? "-left-8" : "-right-8",
                          )}
                        >
                          <button
                            onClick={() => setReactingToComment(reactingToComment === comment.id ? null : comment.id)}
                            className="w-6 h-6 rounded-full bg-card/95 backdrop-blur-sm border border-border/50 shadow-md flex items-center justify-center text-xs hover:scale-110 transition-all duration-200"
                          >
                            😊
                          </button>

                          {reactingToComment === comment.id && (
                            <div
                              className={cn(
                                "absolute top-full mt-1 p-1.5 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200",
                                "grid grid-cols-4 gap-0.5 w-[120px]",
                                isOwnComment ? "right-0" : "left-0",
                              )}
                            >
                              {EMOJI_REACTIONS.map((reaction) => (
                                <button
                                  key={reaction.type}
                                  onClick={() => handleCommentReaction(comment.id, reaction.type)}
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:scale-110 hover:bg-muted transition-all duration-200",
                                    userCommentReactions.includes(reaction.type) && "bg-zinc-500/20",
                                  )}
                                  title={reaction.label}
                                >
                                  {reaction.emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-border/30">
            {typingUsers.map((user) => (
              <div key={user.user_id} className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">{user.user_name}</span>
                <span className="text-sm text-muted-foreground">is typing...</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPicker && (
        <div className="flex-shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-sm p-3">
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

          {pickerTab === "emoji" && (
            <div className="flex flex-wrap gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-muted hover:scale-110 transition-all duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {pickerTab === "gif" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={gifSearchQuery}
                  onChange={(e) => {
                    setGifSearchQuery(e.target.value)
                    // No need to call searchGifs here, useEffect handles it
                  }}
                  placeholder="Search GIFs..."
                  className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
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
                    onClick={() => selectGif(gif.url)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
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

      <form
        onSubmit={handleAddComment}
        className="flex-shrink-0 flex items-end gap-2 p-3 border-t border-border/30 w-full overflow-hidden bg-background/80 backdrop-blur-sm"
      >
        <div className="flex-1 min-w-0 flex items-end gap-1 bg-muted/50 border border-border/50 rounded-2xl pl-2 pr-1 py-1 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              "flex-shrink-0 p-2 rounded-full transition-all duration-200 self-end mb-0.5",
              showPicker
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
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
              "flex-shrink-0 rounded-full h-9 w-9 bg-zinc-700 hover:bg-zinc-600 transition-all duration-200 self-end mb-0.5",
              sendingMessage && "scale-90",
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className={cn("h-4 w-4 transition-transform", sendingMessage && "translate-x-1 -translate-y-1")} />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
