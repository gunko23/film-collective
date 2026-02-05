"use client"

import { useState, useMemo, memo } from "react"
import Link from "next/link"
import { Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import { REACTION_EMOJIS, getReactionEmoji } from "@/lib/chat/constants"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface MessageReaction {
  id: string
  user_id: string
  user_name?: string
  reaction_type: string
}

interface MessageBubbleProps {
  id: string
  content: string
  gifUrl?: string
  userId: string
  userName: string
  userAvatar?: string
  createdAt: string
  isOptimistic?: boolean
  isOwn: boolean
  showAvatar: boolean
  showUserName: boolean
  reactions: MessageReaction[]
  currentUserId: string
  onReactionToggle: (messageId: string, reactionType: string) => void
  avatarLink?: (userId: string) => string
  reactionEmojis?: string[]
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ""

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function groupReactions(reactions: MessageReaction[]) {
  const grouped: Record<string, { count: number; users: string[] }> = {}
  reactions.forEach((r) => {
    const key = r.reaction_type
    if (!grouped[key]) grouped[key] = { count: 0, users: [] }
    grouped[key].count++
    if (r.user_name) grouped[key].users.push(r.user_name)
  })
  return grouped
}

export const MessageBubble = memo(function MessageBubble({
  id,
  content,
  gifUrl,
  userId,
  userName,
  userAvatar,
  createdAt,
  isOptimistic,
  isOwn,
  showAvatar,
  showUserName,
  reactions,
  currentUserId,
  onReactionToggle,
  avatarLink,
  reactionEmojis = REACTION_EMOJIS,
}: MessageBubbleProps) {
  const [activeReactionPicker, setActiveReactionPicker] = useState(false)

  const grouped = useMemo(() => groupReactions(reactions), [reactions])

  const userReactedSet = useMemo(() => {
    const set = new Set<string>()
    const normalizedId = currentUserId.toLowerCase()
    for (const r of reactions) {
      if (r.user_id.toLowerCase() === normalizedId) {
        set.add(r.reaction_type)
      }
    }
    return set
  }, [reactions, currentUserId])

  const timeDisplay = isOptimistic ? "Sending..." : formatRelativeTime(createdAt)

  const avatarContent = (
    <Avatar size="md">
      <AvatarImage src={userAvatar} alt={userName} />
      <AvatarFallback>{userName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
    </Avatar>
  )

  return (
    <div
      className="group animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4"
      style={{
        display: "flex",
        gap: "12px",
        flexDirection: isOwn ? "row-reverse" : "row",
      }}
    >
      {/* Avatar - ONLY for other users */}
      {!isOwn && (
        <div className="flex-shrink-0" style={{ width: "40px", height: "40px" }}>
          {showAvatar && (
            avatarLink ? (
              <Link href={avatarLink(userId)} className="block">
                {avatarContent}
              </Link>
            ) : (
              avatarContent
            )
          )}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          maxWidth: isOwn ? "80%" : "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {/* Header: Username + Time - only for other users */}
        {!isOwn && showUserName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#f8f6f1",
              }}
            >
              {userName}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "rgba(248, 246, 241, 0.35)",
              }}
            >
              {timeDisplay}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            style={{
              backgroundColor: isOwn
                ? "rgba(224, 120, 80, 0.18)"
                : "#0f0f12",
              padding: "12px 16px",
              borderRadius: "16px",
              borderTopLeftRadius: isOwn ? "16px" : "4px",
              borderTopRightRadius: isOwn ? "4px" : "16px",
              border: isOwn
                ? "1px solid rgba(224, 120, 80, 0.25)"
                : "1px solid rgba(248, 246, 241, 0.06)",
            }}
          >
            {gifUrl ? (
              <img src={gifUrl} alt="GIF" className="max-w-[200px] rounded-lg" />
            ) : (
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#f8f6f1",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {content}
              </p>
            )}
          </div>

          {/* Reaction button */}
          {!isOptimistic && (
            <button
              type="button"
              onClick={() => setActiveReactionPicker(!activeReactionPicker)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-surface opacity-0 group-hover:opacity-100 hover:bg-surface-hover transition-all",
                isOwn ? "-left-8" : "-right-8"
              )}
              style={{
                border: "1px solid rgba(248, 246, 241, 0.1)",
              }}
            >
              <Smile className="h-4 w-4 text-foreground/50" />
            </button>
          )}

          {/* Reaction picker */}
          {activeReactionPicker && (
            <div
              className={cn(
                "absolute bottom-full mb-2 bg-surface backdrop-blur-sm rounded-xl shadow-xl p-2 z-50",
                isOwn ? "right-0" : "left-0"
              )}
              style={{
                border: "1px solid rgba(248, 246, 241, 0.1)",
              }}
            >
              <div className="grid grid-cols-4 gap-1 w-[140px]">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReactionToggle(id, emoji)
                      setActiveReactionPicker(false)
                    }}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-lg",
                      userReactedSet.has(emoji) && "bg-accent/20"
                    )}
                  >
                    {getReactionEmoji(emoji)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(grouped).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(grouped).map(([type, data]) => (
              <button
                key={type}
                type="button"
                onClick={() => onReactionToggle(id, type)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full transition-colors text-sm",
                  userReactedSet.has(type)
                    ? "bg-accent/20 border border-accent/30"
                    : "bg-surface hover:bg-surface-hover border border-foreground/[0.06]"
                )}
                title={data.users.join(", ")}
              >
                <span>{getReactionEmoji(type)}</span>
                <span className="text-foreground/60 text-xs">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
