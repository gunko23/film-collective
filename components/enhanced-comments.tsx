"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useAblyChannel } from "@/hooks/use-ably-channel"
import { useAblyPresence } from "@/hooks/use-ably-presence"
import { getFeedChannelName } from "@/lib/ably/channel-names"
import { Send, MessageCircle, ChevronRight, Loader2, Smile, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EMOJI_REACTIONS } from "@/lib/chat/constants"
import { DateDivider, shouldShowDateDivider } from "@/components/chat/date-divider"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { MessageBubble, type MessageReaction } from "@/components/chat/message-bubble"
import { EmojiGifPicker } from "@/components/chat/emoji-gif-picker"

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
  reactions?: MessageReaction[]
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
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
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
    } catch {
      // Silently fail
    }
  }, [collectiveId, ratingId])

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

  const { typingUsers, extendTyping, stopTyping } = useAblyPresence({
    channelName,
    currentUserId,
    currentUserName: currentUserName || undefined,
    enabled: showComments,
  })

  // Rating-level reactions
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
    } catch {
      // Silently fail
    }
    setShowReactionPicker(false)
  }

  // Comment-level reactions
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
    } catch {
      // Silently fail
    }
  }

  const handleSendComment = async () => {
    if ((!newComment.trim() && !selectedGif) || loading) return

    setSendingMessage(true)
    setLoading(true)
    stopTyping()

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      gif_url: selectedGif || undefined,
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

    if (inputRef.current) inputRef.current.style.height = "auto"
    requestAnimationFrame(() => inputRef.current?.focus())

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent, gifUrl: gifContent, mediaType }),
      })

      if (res.ok) {
        const data = await res.json()
        const savedComment = data.comment
        if (savedComment) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === optimisticComment.id
                ? { ...savedComment, created_at: savedComment.created_at || optimisticComment.created_at, reactions: savedComment.reactions || [] }
                : c,
            ),
          )
        }
        onCommentAdded?.()
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setLoading(false)
      setTimeout(() => setSendingMessage(false), 200)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    extendTyping()
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + "px"
    }
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

  const reactionEmojis = EMOJI_REACTIONS.map((r) => r.type)

  return (
    <div className="space-y-3 overflow-hidden">
      {/* Reaction bar */}
      <div className="flex items-center gap-3 flex-wrap overflow-x-auto">
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

          {/* Comments list using shared MessageBubble */}
          {displayedComments.length > 0 && (
            <div className="space-y-2">
              {displayedComments.map((comment, index) => {
                const isOwnComment = comment.user_id === currentUserId
                const prevComment = displayedComments[index - 1]
                const showDate = shouldShowDateDivider(comment.created_at, prevComment?.created_at)
                const showAvatar = !isOwnComment && (index === 0 || prevComment?.user_id !== comment.user_id)

                return (
                  <div key={comment.id}>
                    {showDate && <DateDivider dateString={comment.created_at} />}
                    <MessageBubble
                      id={comment.id}
                      content={comment.content}
                      gifUrl={comment.gif_url}
                      userId={comment.user_id}
                      userName={comment.user_name}
                      userAvatar={comment.user_avatar}
                      createdAt={comment.created_at}
                      isOptimistic={comment.id.startsWith("temp-")}
                      isOwn={isOwnComment}
                      showAvatar={showAvatar}
                      showUserName={showAvatar}
                      reactions={comment.reactions || []}
                      currentUserId={currentUserId}
                      onReactionToggle={handleCommentReaction}
                      avatarLink={(userId) => `/user/${userId}`}
                      reactionEmojis={reactionEmojis}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Typing indicator */}
          <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />

          {/* Emoji/GIF picker */}
          {showEmojiGifPicker && (
            <EmojiGifPicker
              isOpen={showEmojiGifPicker}
              onClose={() => setShowEmojiGifPicker(false)}
              onEmojiSelect={(emoji) => {
                setNewComment((prev) => prev + emoji)
                inputRef.current?.focus()
              }}
              onGifSelect={(url) => {
                setSelectedGif(url)
                setShowEmojiGifPicker(false)
              }}
              variant="inline"
            />
          )}

          {/* Selected GIF preview */}
          {selectedGif && (
            <div className="relative inline-block animate-in fade-in zoom-in-95 duration-200">
              <Image
                src={selectedGif}
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

          <form onSubmit={(e) => { e.preventDefault(); handleSendComment() }} className="w-full overflow-hidden">
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
                onChange={handleInputChange}
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
