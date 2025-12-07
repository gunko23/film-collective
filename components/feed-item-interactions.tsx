"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, MessageCircle, Flame, Sparkles, ThumbsUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

type Reaction = {
  id: string
  user_id: string
  reaction_type: string
}

type Comment = {
  id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

const REACTION_ICONS: Record<string, typeof Heart> = {
  like: ThumbsUp,
  love: Heart,
  fire: Flame,
  sparkle: Sparkles,
}

type Props = {
  ratingId: string
  currentUserId: string
}

export function FeedItemInteractions({ ratingId, currentUserId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)

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
        // Silently fail - interactions are optional
      }
    }
    fetchData()
  }, [ratingId])

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
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/feed/${ratingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment("")
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  const userReactions = reactions.filter((r) => r.user_id === currentUserId).map((r) => r.reaction_type)

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      {/* Reaction buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(REACTION_ICONS).map(([type, Icon]) => {
          const count = reactions.filter((r) => r.reaction_type === type).length
          const hasReacted = userReactions.includes(type)

          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
                hasReacted
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {count > 0 && <span>{count}</span>}
            </button>
          )
        })}

        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-muted/50 text-muted-foreground hover:bg-muted transition-colors ml-auto"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comments.length > 0 && <span>{comments.length}</span>}
          <span className="ml-1">Comments</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
            />
            <Button type="submit" size="sm" disabled={!newComment.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
