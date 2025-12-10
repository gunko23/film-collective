"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Smile, CheckCheck, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Comment = {
  id: string
  content: string
  gif_url?: string
  created_at: string
  user_id: string
  user_name: string
  user_avatar?: string
  reactions: {
    id: string
    reaction_type: string
    user_id: string
    user_name: string
  }[]
}

type TypingUser = {
  user_id: string
  user_name: string
}

type MovieConversationThreadProps = {
  collectiveId: string
  tmdbId: number
  mediaType: "movie" | "tv"
  currentUserId: string
  initialComments?: Comment[]
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏", "💯", "🎬"]

const QUICK_EMOJIS = ["😀", "😂", "❤️", "🔥", "👏", "🎬", "🍿", "⭐", "💯", "😮", "😢", "🤔", "👀", "✨", "🎉", "👍"]

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

export function MovieConversationThread({
  collectiveId,
  tmdbId,
  mediaType,
  currentUserId,
  initialComments = [],
}: MovieConversationThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<"emoji" | "gif">("emoji")
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasScrolledInitially = useRef(false)

  // Handle clicking outside emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Initial scroll to bottom
  useEffect(() => {
    if (!hasScrolledInitially.current && comments.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      hasScrolledInitially.current = true
    }
  }, [comments.length])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/comments?mediaType=${mediaType}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }, [collectiveId, tmdbId, mediaType])

  // Poll for new comments
  useEffect(() => {
    fetchComments()
    const interval = setInterval(fetchComments, 5000)
    return () => clearInterval(interval)
  }, [fetchComments])

  // Poll for typing indicators
  useEffect(() => {
    const fetchTyping = async () => {
      try {
        const res = await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/typing?mediaType=${mediaType}`)
        if (res.ok) {
          const data = await res.json()
          setTypingUsers(data)
        }
      } catch (error) {
        // Silently fail
      }
    }

    const interval = setInterval(fetchTyping, 2000)
    return () => clearInterval(interval)
  }, [collectiveId, tmdbId, mediaType])

  // Handle scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100)
    }
  }

  // Update typing indicator
  const updateTypingIndicator = useCallback(async () => {
    try {
      await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType }),
      })
    } catch (error) {
      // Silently fail
    }
  }, [collectiveId, tmdbId, mediaType])

  // Clear typing indicator
  const clearTypingIndicator = useCallback(async () => {
    try {
      await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/typing?mediaType=${mediaType}`, {
        method: "DELETE",
      })
    } catch (error) {
      // Silently fail
    }
  }, [collectiveId, tmdbId, mediaType])

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)

    // Auto-resize textarea
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"

    // Update typing indicator
    updateTypingIndicator()

    // Clear typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      clearTypingIndicator()
    }, 3000)
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Format time
  const formatCommentTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    const content = newComment.trim()

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user_name: "You",
      reactions: [],
    }

    setComments((prev) => [...prev, optimisticComment])
    setNewComment("")

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)

    // Keep keyboard open
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mediaType }),
      })

      if (res.ok) {
        const savedComment = await res.json()
        setComments((prev) =>
          prev.map((c) =>
            c.id === optimisticComment.id
              ? {
                  ...savedComment,
                  reactions: savedComment.reactions || [],
                  created_at: savedComment.created_at || optimisticComment.created_at,
                }
              : c,
          ),
        )
      }
    } catch (error) {
      console.error("Error sending comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle GIF send
  const handleGifSelect = async (gifUrl: string) => {
    setIsSubmitting(true)
    setShowEmojiPicker(false)

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: "",
      gif_url: gifUrl,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user_name: "You",
      reactions: [],
    }

    setComments((prev) => [...prev, optimisticComment])

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 50)

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", gifUrl, mediaType }),
      })

      if (res.ok) {
        const savedComment = await res.json()
        setComments((prev) =>
          prev.map((c) =>
            c.id === optimisticComment.id
              ? { ...savedComment, reactions: [], created_at: savedComment.created_at || optimisticComment.created_at }
              : c,
          ),
        )
      } else {
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      }
    } catch (error) {
      console.error("Error sending GIF:", error)
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Search GIFs (using Tenor)
  useEffect(() => {
    if (activeTab !== "gif" || !gifSearch.trim()) {
      setGifs([])
      return
    }

    const searchGifs = async () => {
      try {
        // Using a simple placeholder for demo - in production you'd use Tenor/Giphy API
        const mockGifs = [{ url: `https://media.tenor.com/search?q=${encodeURIComponent(gifSearch)}`, preview: "" }]
        setGifs(mockGifs)
      } catch (error) {
        console.error("Error searching GIFs:", error)
      }
    }

    const timeout = setTimeout(searchGifs, 300)
    return () => clearTimeout(timeout)
  }, [gifSearch, activeTab])

  // Handle emoji insert
  const handleEmojiInsert = (emoji: string) => {
    setNewComment((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  // Handle reaction toggle
  const handleReactionToggle = async (commentId: string, reactionType: string) => {
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/movie/${tmdbId}/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      })

      if (res.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error("Error toggling reaction:", error)
    }
    setActiveReactionPicker(null)
  }

  // Check if current user reacted
  const hasUserReacted = (reactions: Comment["reactions"], reactionType: string) => {
    return reactions.some(
      (r) => r.reaction_type === reactionType && r.user_id.toLowerCase() === currentUserId?.toLowerCase(),
    )
  }

  // Group reactions by type
  const groupReactions = (reactions: Comment["reactions"]) => {
    const grouped: { [key: string]: { count: number; users: string[] } } = {}
    reactions.forEach((r) => {
      if (!grouped[r.reaction_type]) {
        grouped[r.reaction_type] = { count: 0, users: [] }
      }
      grouped[r.reaction_type].count++
      grouped[r.reaction_type].users.push(r.user_name)
    })
    return grouped
  }

  const isOwnMessage = (userId: string) => {
    return userId?.toLowerCase() === currentUserId?.toLowerCase()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages container - this is the ONLY scrollable area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-3"
      >
        {comments.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          comments.map((comment, index) => {
            const isOwn = isOwnMessage(comment.user_id)
            const showAvatar = !isOwn && (index === 0 || comments[index - 1]?.user_id !== comment.user_id)
            const groupedReactions = groupReactions(comment.reactions)
            const previousComment = comments[index - 1]
            const showDateDivider = shouldShowDateDivider(comment, previousComment)

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
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* Avatar for others */}
                  {!isOwn && (
                    <div className="w-7 mr-2 flex-shrink-0">
                      {showAvatar && (
                        <div className="h-7 w-7 rounded-full bg-emerald-600/20 flex items-center justify-center overflow-hidden">
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
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    {/* Username for others */}
                    {!isOwn && showAvatar && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{comment.user_name}</p>
                    )}

                    {/* Message bubble */}
                    <div className="relative">
                      <div
                        className={`px-2.5 py-1.5 rounded-2xl ${
                          isOwn
                            ? "bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-br-md shadow-lg"
                            : "bg-card/80 border border-border/50 text-foreground rounded-bl-md"
                        }`}
                      >
                        {comment.gif_url ? (
                          <img
                            src={comment.gif_url || "/placeholder.svg"}
                            alt="GIF"
                            className="max-w-[200px] rounded-lg"
                          />
                        ) : (
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-muted-foreground/70">
                            {formatCommentTime(comment.created_at)}
                          </span>
                          {isOwn && <CheckCheck className="h-3 w-3 text-emerald-400/70" />}
                        </div>
                      </div>

                      {/* Reaction button */}
                      <button
                        type="button"
                        onClick={() => setActiveReactionPicker(activeReactionPicker === comment.id ? null : comment.id)}
                        className={`absolute ${isOwn ? "-left-6" : "-right-6"} top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-800/80 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 transition-all`}
                      >
                        <Smile className="h-3 w-3 text-zinc-400" />
                      </button>

                      {/* Reaction picker */}
                      {activeReactionPicker === comment.id && (
                        <div
                          className={`absolute ${isOwn ? "right-0" : "left-0"} bottom-full mb-1 bg-zinc-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-700/50 p-1.5 z-50`}
                        >
                          <div className="grid grid-cols-4 gap-1 w-[120px]">
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReactionToggle(comment.id, emoji)}
                                className="p-1 rounded hover:bg-zinc-700/50 transition-colors text-base"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reactions display */}
                    {Object.keys(groupedReactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(groupedReactions).map(([emoji, data]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReactionToggle(comment.id, emoji)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-xs"
                            title={data.users.join(", ")}
                          >
                            <span>{emoji}</span>
                            <span className="text-zinc-400">{data.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-card/50 border border-border/30">
              <div className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground ml-1">
                {typingUsers.map((u) => u.user_name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed at bottom, never scrolls */}
      <div className="flex-shrink-0 p-3 border-t border-border/30 bg-background">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-end gap-2 bg-card/50 border border-border/50 rounded-2xl px-3 py-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
            {/* Emoji/GIF button */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
                  showEmojiPicker
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Smile className="h-5 w-5" />
              </button>

              {/* Emoji/GIF Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-zinc-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-zinc-700/50 overflow-hidden w-[260px] z-50">
                  {/* Tabs */}
                  <div className="flex border-b border-zinc-700/50">
                    <button
                      type="button"
                      onClick={() => setActiveTab("emoji")}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        activeTab === "emoji"
                          ? "text-emerald-400 border-b-2 border-emerald-400"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("gif")}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        activeTab === "gif"
                          ? "text-emerald-400 border-b-2 border-emerald-400"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      GIF
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-2 max-h-[200px] overflow-y-auto">
                    {activeTab === "emoji" ? (
                      <div className="grid grid-cols-8 gap-1">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiInsert(emoji)}
                            className="p-1.5 rounded hover:bg-zinc-700/50 transition-colors text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={gifSearch}
                          onChange={(e) => setGifSearch(e.target.value)}
                          placeholder="Search GIFs..."
                          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                        />
                        {gifs.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1 max-h-[150px] overflow-y-auto">
                            {gifs.map((gif, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleGifSelect(gif.url)}
                                className="rounded overflow-hidden hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={gif.preview || "/placeholder.svg"}
                                  alt="GIF"
                                  className="w-full h-16 object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-zinc-500 text-xs">
                            <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            Search for GIFs
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none py-1 leading-5 max-h-24 overflow-y-auto"
              style={{ minHeight: "24px" }}
            />

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={(!newComment.trim() && !isSubmitting) || isSubmitting}
              className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex-shrink-0 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
