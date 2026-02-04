"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useAblyChannel } from "@/hooks/use-ably-channel"
import { useAblyPresence } from "@/hooks/use-ably-presence"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Send, Smile, Loader2, CheckCheck, ImageIcon } from "lucide-react"

// Same emojis as movie-conversation-thread
const QUICK_EMOJIS = [
  "😀",
  "😂",
  "🥹",
  "😍",
  "🤩",
  "😎",
  "🥳",
  "😅",
  "🤔",
  "😤",
  "😭",
  "🙄",
  "😱",
  "🤯",
  "🥴",
  "😈",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "💯",
  "✨",
  "👀",
  "🎬",
  "🍿",
  "⭐",
  "💀",
  "😴",
  "🤝",
  "👏",
  "🎉",
  "💔",
]

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"]

interface Message {
  id: string
  content: string
  gif_url?: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
  reactions?: Array<{
    id: string
    user_id: string
    user_name: string
    reaction_type: string
  }>
  isOptimistic?: boolean
}

interface GeneralDiscussionProps {
  collectiveId: string
  currentUserId: string
  currentUserName?: string
}

export function GeneralDiscussion({ collectiveId, currentUserId, currentUserName }: GeneralDiscussionProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<"emoji" | "gif">("emoji")
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<Array<{ url: string; preview: string }>>([])
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Array<{ user_id: string; user_name: string }>>([])

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const lastCursorRef = useRef<string | null>(null)

  // Fetch messages with optional cursor for incremental loading
  const fetchMessages = useCallback(async (useCursor: boolean) => {
    try {
      const url = useCursor && lastCursorRef.current
        ? `/api/collectives/${collectiveId}/discussion/stream?cursor=${encodeURIComponent(lastCursorRef.current)}`
        : `/api/collectives/${collectiveId}/discussion/stream`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()

      if (data.nextCursor) {
        lastCursorRef.current = data.nextCursor
      }

      if (useCursor && lastCursorRef.current) {
        // Incremental: append only new messages, deduplicate by ID
        const newMessages = data.messages || []
        if (newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const unique = newMessages.filter((m: Message) => !existingIds.has(m.id))
            return unique.length > 0 ? [...prev, ...unique] : prev
          })
        }
      } else {
        // Initial load: replace state
        setMessages(data.messages || [])
      }

    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [collectiveId])

  // Ably real-time subscriptions
  const channelName = getDiscussionChannelName(collectiveId)

  useAblyChannel({
    channelName,
    eventName: "new_message",
    onMessage: useCallback((data: unknown) => {
      const msg = data as Message
      if (!msg?.id) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })

      if (msg.created_at) {
        lastCursorRef.current = msg.created_at
      }

      if (shouldAutoScrollRef.current && messagesEndRef.current) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    }, []),
  })

  useAblyChannel({
    channelName,
    eventName: "reaction",
    onMessage: useCallback(() => {
      fetchMessages(false)
    }, [fetchMessages]),
  })

  const { typingUsers: ablyTypingUsers, extendTyping, stopTyping } = useAblyPresence({
    channelName,
    currentUserId,
    currentUserName,
  })

  // Sync Ably presence typing to local state
  useEffect(() => {
    setTypingUsers(ablyTypingUsers)
  }, [ablyTypingUsers])

  // Initial fetch
  useEffect(() => {
    fetchMessages(false)
  }, [fetchMessages])

  // Auto-scroll
  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100
  }

  // Close pickers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (activeReactionPicker) {
        setActiveReactionPicker(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [activeReactionPicker])

  // GIF search
  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifs([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gif/search?q=${encodeURIComponent(gifSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setGifs(data.results || [])
        }
      } catch {}
    }, 300)
    return () => clearTimeout(timeout)
  }, [gifSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px"
    extendTyping()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const content = newMessage.trim()
    setNewMessage("")
    setIsSending(true)
    stopTyping()
    if (inputRef.current) inputRef.current.style.height = "auto"

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: Message = {
      id: optimisticId,
      content,
      user_id: currentUserId,
      user_name: currentUserName || "You",
      created_at: new Date().toISOString(),
      isOptimistic: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    shouldAutoScrollRef.current = true

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/discussion/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userName: currentUserName }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...data.message, isOptimistic: false } : m)))
        if (data.message?.created_at) {
          lastCursorRef.current = data.message.created_at
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiInsert = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleGifSelect = async (url: string) => {
    setShowEmojiPicker(false)
    setGifSearch("")
    setGifs([])

    const optimisticId = `optimistic-gif-${Date.now()}`
    const optimisticMsg: Message = {
      id: optimisticId,
      content: "",
      gif_url: url,
      user_id: currentUserId,
      user_name: currentUserName || "You",
      created_at: new Date().toISOString(),
      isOptimistic: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    shouldAutoScrollRef.current = true

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/discussion/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gifUrl: url, userName: currentUserName }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...data.message, isOptimistic: false } : m)))
        if (data.message?.created_at) {
          lastCursorRef.current = data.message.created_at
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    }
  }

  const handleReactionToggle = async (messageId: string, emoji: string) => {
    setActiveReactionPicker(null)
    try {
      await fetch(`/api/collectives/${collectiveId}/discussion/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userName: currentUserName }),
      })
      fetchMessages(false)
    } catch {}
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const isOwnMessage = (userId: string) => userId?.toLowerCase() === currentUserId?.toLowerCase()

  const hasUserReacted = (reactions: Message["reactions"], emoji: string) => {
    return reactions?.some((r) => r.reaction_type === emoji && r.user_id.toLowerCase() === currentUserId.toLowerCase())
  }

  const groupReactions = (reactions: Message["reactions"]) => {
    const grouped: Record<string, { count: number; users: string[] }> = {}
    reactions?.forEach((r) => {
      if (!grouped[r.reaction_type]) grouped[r.reaction_type] = { count: 0, users: [] }
      grouped[r.reaction_type].count++
      grouped[r.reaction_type].users.push(r.user_name)
    })
    return grouped
  }

  const groupedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const prevMsg = messages[index - 1]
      const showDateDivider =
        !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()
      const showAvatar = !isOwnMessage(msg.user_id) && (index === 0 || prevMsg?.user_id !== msg.user_id)
      return { msg, showDateDivider, showAvatar }
    })
  }, [messages, currentUserId])

  const otherTypingUsers = useMemo(() => {
    return typingUsers.filter((u) => u.user_id.toLowerCase() !== currentUserId.toLowerCase())
  }, [typingUsers, currentUserId])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages container - this is the ONLY scrollable area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-3"
      >
        {messages.length === 0 ? (
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
          groupedMessages.map(({ msg, showDateDivider, showAvatar }) => {
            const isOwn = isOwnMessage(msg.user_id)
            const groupedReactions = groupReactions(msg.reactions || [])

            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <span className="px-3 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {formatDateSeparator(msg.created_at)}
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
                          {msg.user_avatar ? (
                            <Image
                              src={msg.user_avatar || "/placeholder.svg"}
                              alt={msg.user_name}
                              width={28}
                              height={28}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-400">
                              {msg.user_name?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    {/* Username for others */}
                    {!isOwn && showAvatar && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.user_name}</p>
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
                        {msg.gif_url ? (
                          <img src={msg.gif_url || "/placeholder.svg"} alt="GIF" className="max-w-[200px] rounded-lg" />
                        ) : (
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className="text-[9px] text-muted-foreground/70">
                            {msg.isOptimistic ? "Sending..." : formatMessageTime(msg.created_at)}
                          </span>
                          {isOwn && !msg.isOptimistic && <CheckCheck className="h-3 w-3 text-emerald-400/70" />}
                        </div>
                      </div>

                      {/* Reaction button */}
                      <button
                        type="button"
                        onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                        className={`absolute ${isOwn ? "-left-6" : "-right-6"} top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-800/80 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 transition-all`}
                      >
                        <Smile className="h-3 w-3 text-zinc-400" />
                      </button>

                      {/* Reaction picker */}
                      {activeReactionPicker === msg.id && (
                        <div
                          className={`absolute ${isOwn ? "right-0" : "left-0"} bottom-full mb-1 bg-zinc-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-700/50 p-1.5 z-50`}
                        >
                          <div className="grid grid-cols-4 gap-1 w-[120px]">
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReactionToggle(msg.id, emoji)}
                                className={`p-1 rounded hover:bg-zinc-700/50 transition-colors text-base ${hasUserReacted(msg.reactions || [], emoji) ? "bg-zinc-700/50" : ""}`}
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
                            onClick={() => handleReactionToggle(msg.id, emoji)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors text-xs ${hasUserReacted(msg.reactions || [], emoji) ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-zinc-800/50 hover:bg-zinc-700/50"}`}
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
        {otherTypingUsers.length > 0 && (
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
                {otherTypingUsers.map((u) => u.user_name).join(", ")} {otherTypingUsers.length === 1 ? "is" : "are"}{" "}
                typing
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
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground resize-none focus:outline-none min-h-[24px] max-h-24 py-1 placeholder:text-muted-foreground/50"
            />

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex-shrink-0 disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
