"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Send, ImageIcon, X, Loader2, Search } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const EMOJI_REACTIONS = [
  { emoji: "👍", type: "thumbsup" },
  { emoji: "❤️", type: "heart" },
  { emoji: "😂", type: "laugh" },
  { emoji: "🔥", type: "fire" },
  { emoji: "😢", type: "sad" },
  { emoji: "🎉", type: "celebrate" },
]

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
}

async function searchGifs(query: string): Promise<{ url: string; preview: string }[]> {
  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=12&rating=pg`,
    )
    if (!response.ok) throw new Error("Failed to fetch GIFs")
    const data = await response.json()
    return data.data.map((gif: { images: { fixed_height: { url: string }; fixed_height_small: { url: string } } }) => ({
      url: gif.images.fixed_height.url,
      preview: gif.images.fixed_height_small.url,
    }))
  } catch {
    return []
  }
}

export function ConversationThread({ ratingId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<{ url: string; preview: string }[]>([])
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [searchingGifs, setSearchingGifs] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/feed/${ratingId}/comments`)
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
    fetchComments()
  }, [ratingId])

  // Scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

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
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  const selectGif = (url: string) => {
    setSelectedGif(url)
    setShowGifPicker(false)
    setGifSearch("")
    inputRef.current?.focus()
  }

  // Group messages by date
  const groupedComments = comments.reduce(
    (groups, comment) => {
      const date = new Date(comment.created_at).toLocaleDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(comment)
      return groups
    },
    {} as Record<string, Comment[]>,
  )

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-4">
        {Object.entries(groupedComments).map(([date, dayComments]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground font-medium px-2">{date}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {dayComments.map((comment, i) => {
                const isOwnComment = comment.user_id === currentUserId
                const prevComment = dayComments[i - 1]
                const showAvatar = !prevComment || prevComment.user_id !== comment.user_id

                return (
                  <div key={comment.id} className={cn("flex gap-2", isOwnComment ? "flex-row-reverse" : "flex-row")}>
                    {/* Avatar placeholder or actual avatar */}
                    <div className={cn("flex-shrink-0 w-8", !showAvatar && "invisible")}>
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
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
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className="max-w-[75%]">
                      {showAvatar && !isOwnComment && (
                        <p className="text-xs font-medium text-muted-foreground mb-1 ml-3">{comment.user_name}</p>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl p-3",
                          isOwnComment
                            ? "bg-accent text-accent-foreground rounded-br-md"
                            : "bg-muted/70 text-foreground rounded-bl-md",
                        )}
                      >
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
                        {comment.content && <p className="text-sm whitespace-pre-wrap">{comment.content}</p>}
                        <p className={cn("text-[10px] mt-1", isOwnComment ? "opacity-70" : "text-muted-foreground")}>
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Start the conversation!</p>
          </div>
        )}
      </div>

      {/* GIF picker */}
      {showGifPicker && (
        <div className="bg-card border border-border/50 rounded-xl p-3 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                  <Image src={gif.preview || "/placeholder.svg"} alt="GIF" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          ) : gifSearch ? (
            <p className="text-center text-sm text-muted-foreground py-4">No GIFs found</p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Search for GIFs</p>
          )}
        </div>
      )}

      {/* Selected GIF preview */}
      {selectedGif && (
        <div className="relative inline-block mb-3">
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

      {/* Input area */}
      <form onSubmit={handleAddComment} className="flex items-end gap-2 pt-2 border-t border-border/30">
        <div className="flex-1 flex items-end gap-2 bg-muted/50 border border-border/50 rounded-2xl px-3 py-2">
          <button
            type="button"
            onClick={() => setShowGifPicker(!showGifPicker)}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-lg transition-colors",
              showGifPicker ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0 py-1"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={(!newComment.trim() && !selectedGif) || loading}
          className="flex-shrink-0 rounded-full h-10 w-10"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
