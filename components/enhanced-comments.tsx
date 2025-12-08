"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Send, ImageIcon, X, MessageCircle, ChevronRight, Loader2, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Emoji reactions with better variety
const EMOJI_REACTIONS = [
  { emoji: "👍", type: "thumbsup", label: "Like" },
  { emoji: "❤️", type: "heart", label: "Love" },
  { emoji: "😂", type: "laugh", label: "Haha" },
  { emoji: "🔥", type: "fire", label: "Fire" },
  { emoji: "😢", type: "sad", label: "Sad" },
  { emoji: "🎉", type: "celebrate", label: "Celebrate" },
]

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
}

type Props = {
  ratingId: string
  currentUserId: string
  collectiveId: string
  mediaTitle?: string
  initialCommentCount?: number
}

async function searchGifs(query: string): Promise<{ url: string; preview: string }[]> {
  try {
    // Using Tenor's public API
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
    // Fallback: return some placeholder trending GIFs
    return []
  }
}

export function EnhancedComments({
  ratingId,
  currentUserId,
  collectiveId,
  mediaTitle,
  initialCommentCount = 0,
}: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([])
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [searchingGifs, setSearchingGifs] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  // Fetch reactions and comments
  useEffect(() => {
    async function fetchData() {
      try {
        const [reactionsRes, commentsRes] = await Promise.all([
          fetch(`/api/feed/${ratingId}/reactions`),
          fetch(`/api/feed/${ratingId}/comments`),
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
  }, [ratingId])

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

  const handleReaction = async (type: string) => {
    try {
      const res = await fetch(`/api/feed/${ratingId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.action === "added") {
          setReactions((prev) => [...prev, { id: data.id, user_id: currentUserId, reaction_type: type }])
        } else {
          setReactions((prev) => prev.filter((r) => !(r.user_id === currentUserId && r.reaction_type === type)))
        }
      }
    } catch (error) {
      // Silently fail
    }
    setShowReactionPicker(false)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newComment.trim() && !selectedGif) || loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          gifUrl: selectedGif,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment("")
        setSelectedGif(null)
        setShowGifPicker(false)
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  const selectGif = (url: string) => {
    setSelectedGif(url)
    setShowGifPicker(false)
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

  const userReactions = reactions.filter((r) => r.user_id === currentUserId).map((r) => r.reaction_type)
  const hasEnoughForConversation = comments.length >= 3
  const displayedComments = hasEnoughForConversation ? comments.slice(-3) : comments

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      {/* Reaction bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick reactions display */}
        <div className="flex items-center gap-1">
          {Object.entries(reactionCounts).map(([type, count]) => {
            const reactionData = EMOJI_REACTIONS.find((r) => r.type === type)
            const hasReacted = userReactions.includes(type)
            return (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all",
                  hasReacted
                    ? "bg-accent/20 border border-accent/40 scale-105"
                    : "bg-muted/50 hover:bg-muted border border-transparent hover:scale-105",
                )}
              >
                <span className="text-base">{reactionData?.emoji || "👍"}</span>
                <span className={cn("text-xs font-medium", hasReacted ? "text-accent" : "text-muted-foreground")}>
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
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <span className="text-lg">+</span>
          </button>

          {/* Reaction picker popup */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border/50 rounded-xl shadow-xl flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {EMOJI_REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-125 hover:bg-muted",
                    userReactions.includes(reaction.type) && "bg-accent/20",
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
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ml-auto",
            showComments ? "bg-accent/20 text-accent" : "bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length || initialCommentCount}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* View all link for 3+ comments */}
          {hasEnoughForConversation && (
            <Link
              href={`/collectives/${collectiveId}/conversation/${ratingId}`}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">
                  View full conversation ({comments.length} messages)
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Comments list - chat bubble style */}
          {displayedComments.length > 0 && (
            <div className="space-y-2">
              {displayedComments.map((comment) => {
                const isOwnComment = comment.user_id === currentUserId
                return (
                  <div key={comment.id} className={cn("flex gap-2", isOwnComment ? "flex-row-reverse" : "flex-row")}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                      {comment.user_avatar ? (
                        <Image
                          src={comment.user_avatar || "/placeholder.svg"}
                          alt={comment.user_name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-accent">
                          {comment.user_name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl p-3",
                        isOwnComment
                          ? "bg-accent text-accent-foreground rounded-br-md"
                          : "bg-muted/70 text-foreground rounded-bl-md",
                      )}
                    >
                      {!isOwnComment && <p className="text-xs font-medium mb-1 opacity-70">{comment.user_name}</p>}
                      {comment.gif_url && (
                        <div className="mb-2 rounded-lg overflow-hidden">
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
                      {comment.content && <p className="text-sm">{comment.content}</p>}
                      <p className={cn("text-[10px] mt-1", isOwnComment ? "opacity-70" : "text-muted-foreground")}>
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* GIF picker */}
          {showGifPicker && (
            <div className="bg-card border border-border/50 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Search GIFs</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker(false)
                    setGifSearch("")
                    setGifs([])
                  }}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  placeholder="Search GIFs..."
                  className="w-full bg-muted/50 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent/50"
                  autoFocus
                />
              </div>

              {searchingGifs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : gifs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {gifs.map((gif, i) => (
                    <button
                      key={i}
                      onClick={() => selectGif(gif.url)}
                      className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 ring-accent transition-all"
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
                </div>
              ) : gifSearch ? (
                <p className="text-center text-sm text-muted-foreground py-4">No GIFs found. Try another search!</p>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Search for GIFs above</p>
              )}
            </div>
          )}

          {/* Selected GIF preview */}
          {selectedGif && (
            <div className="relative inline-block">
              <Image
                src={selectedGif || "/placeholder.svg"}
                alt="Selected GIF"
                width={120}
                height={90}
                className="rounded-lg"
                unoptimized
              />
              <button
                onClick={() => setSelectedGif(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Add comment form - messaging style */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-full pl-3 pr-1 py-1">
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={cn(
                  "flex-shrink-0 p-1.5 rounded-full transition-colors",
                  showGifPicker
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none py-2"
              />
              <Button
                type="submit"
                size="icon"
                disabled={(!newComment.trim() && !selectedGif) || loading}
                className="flex-shrink-0 rounded-full h-9 w-9"
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
