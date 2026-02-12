"use client"

import { useState, useMemo, memo } from "react"
import Link from "next/link"
import { Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import { REACTION_EMOJIS, getReactionEmoji } from "@/lib/chat/constants"

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
  isGroupStart?: boolean
  isGroupEnd?: boolean
  reactions: MessageReaction[]
  currentUserId: string
  onReactionToggle: (messageId: string, reactionType: string) => void
  avatarLink?: (userId: string) => string
  reactionEmojis?: string[]
}

const SENDER_COLORS: [string, string][] = [
  ["#c4616a", "#d88088"], // rose
  ["#ff6b2d", "#ff8f5e"], // orange
  ["#4a9e8e", "#6bc4b4"], // teal
  ["#3d5a96", "#5a7cb8"], // blue
  ["#2e4470", "#5a7cb8"], // muted blue
]

function getSenderColor(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length]
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

function getBubbleRadius(isOwn: boolean, isGroupStart: boolean, isGroupEnd: boolean): string {
  if (isOwn) {
    if (!isGroupEnd) return "18px 6px 6px 18px"
    if (isGroupStart) return "18px 18px 6px 18px"
    return "18px 6px 18px 18px"
  } else {
    if (!isGroupEnd) return "6px 18px 18px 6px"
    if (isGroupStart) return "18px 18px 18px 6px"
    return "6px 18px 18px 18px"
  }
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
  isGroupStart = true,
  isGroupEnd = true,
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
  const senderColors = useMemo(() => getSenderColor(userName), [userName])
  const initial = userName?.[0]?.toUpperCase() || "?"

  const avatarEl = userAvatar ? (
    <img
      src={userAvatar}
      alt={userName}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${senderColors[0]}, ${senderColors[0]}80)`,
        boxShadow: `0 2px 8px ${senderColors[0]}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "#0f0d0b",
      }}
    >
      {initial}
    </div>
  )

  return (
    <div
      className="group"
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginTop: isGroupStart ? 14 : 3,
      }}
    >
      {/* Avatar — only for others, only on group start */}
      {!isOwn && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {isGroupStart && (
            avatarLink ? (
              <Link href={avatarLink(userId)} className="block">
                {avatarEl}
              </Link>
            ) : (
              avatarEl
            )
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: "75%" }}>
        {/* Sender name — only on group start, only for others */}
        {isGroupStart && !isOwn && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: senderColors[0],
              marginBottom: 3,
              paddingLeft: 2,
            }}
          >
            {userName}
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            style={{
              padding: "10px 16px",
              borderRadius: getBubbleRadius(isOwn, isGroupStart, isGroupEnd),
              background: isOwn
                ? "linear-gradient(135deg, rgba(61, 90, 150, 0.22), rgba(61, 90, 150, 0.13))"
                : "#1a1714",
              border: isOwn
                ? "1px solid rgba(61, 90, 150, 0.13)"
                : "1px solid rgba(107, 99, 88, 0.05)",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#e8e2d6",
            }}
          >
            {gifUrl ? (
              <img src={gifUrl} alt="GIF" className="max-w-[200px] rounded-lg" />
            ) : (
              <p
                style={{
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
                "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                isOwn ? "-left-8" : "-right-8"
              )}
              style={{
                background: "#1a1714",
                border: "1px solid rgba(107, 99, 88, 0.1)",
              }}
            >
              <Smile className="h-3.5 w-3.5" style={{ color: "#6b6358" }} />
            </button>
          )}

          {/* Reaction picker */}
          {activeReactionPicker && (
            <div
              className={cn(
                "absolute bottom-full mb-2 backdrop-blur-sm rounded-xl shadow-xl p-2 z-50",
                isOwn ? "right-0" : "left-0"
              )}
              style={{
                background: "#1a1714",
                border: "1px solid rgba(107, 99, 88, 0.12)",
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
                    className="p-1.5 rounded-lg transition-colors text-lg"
                    style={{
                      background: userReactedSet.has(emoji) ? "rgba(61, 90, 150, 0.15)" : "transparent",
                    }}
                  >
                    {getReactionEmoji(emoji)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time — only on last message in group */}
        {isGroupEnd && (
          <div
            style={{
              fontSize: 10,
              color: "#6b6358",
              marginTop: 3,
              textAlign: isOwn ? "right" : "left",
              padding: "0 2px",
            }}
          >
            {timeDisplay}
          </div>
        )}

        {/* Reactions display */}
        {Object.keys(grouped).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {Object.entries(grouped).map(([type, data]) => (
              <button
                key={type}
                type="button"
                onClick={() => onReactionToggle(id, type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 99,
                  fontSize: 13,
                  border: userReactedSet.has(type)
                    ? "1px solid rgba(61, 90, 150, 0.2)"
                    : "1px solid rgba(107, 99, 88, 0.06)",
                  background: userReactedSet.has(type)
                    ? "rgba(61, 90, 150, 0.12)"
                    : "rgba(107, 99, 88, 0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={data.users.join(", ")}
              >
                <span>{getReactionEmoji(type)}</span>
                <span style={{ fontSize: 11, color: "rgba(232, 226, 214, 0.5)" }}>{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
