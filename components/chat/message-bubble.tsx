"use client"

import { useState, useMemo, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Smile, CheckCheck } from "lucide-react"
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
  reactions: MessageReaction[]
  currentUserId: string
  onReactionToggle: (messageId: string, reactionType: string) => void
  avatarLink?: (userId: string) => string
  reactionEmojis?: string[]
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
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

function hasUserReacted(reactions: MessageReaction[], reactionType: string, currentUserId: string) {
  return reactions.some(
    (r) => r.reaction_type === reactionType && r.user_id.toLowerCase() === currentUserId.toLowerCase()
  )
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

  const avatarContent = (
    <div className="h-7 w-7 rounded-full bg-emerald-600/20 flex items-center justify-center overflow-hidden">
      {userAvatar ? (
        <Image
          src={userAvatar}
          alt={userName}
          width={28}
          height={28}
          className="object-cover"
        />
      ) : (
        <span className="text-[10px] font-medium text-emerald-400">
          {userName?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        "flex group animate-in fade-in slide-in-from-bottom-2 duration-300",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-7 mr-2 flex-shrink-0">
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

      <div className={cn("max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {/* Username for others */}
        {!isOwn && showUserName && (
          <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{userName}</p>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={cn(
              "px-2.5 py-1.5 rounded-2xl",
              isOwn
                ? "bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-br-md shadow-lg"
                : "bg-card/80 border border-border/50 text-foreground rounded-bl-md"
            )}
          >
            {gifUrl ? (
              <img src={gifUrl} alt="GIF" className="max-w-[200px] rounded-lg" />
            ) : (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>
            )}
            <div className={cn("flex items-center gap-1 mt-0.5", isOwn ? "justify-end" : "justify-start")}>
              <span className="text-[9px] text-muted-foreground/70">
                {isOptimistic ? "Sending..." : formatMessageTime(createdAt)}
              </span>
              {isOwn && !isOptimistic && <CheckCheck className="h-3 w-3 text-emerald-400/70" />}
            </div>
          </div>

          {/* Reaction button */}
          {!isOptimistic && (
            <button
              type="button"
              onClick={() => setActiveReactionPicker(!activeReactionPicker)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-800/80 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 transition-all",
                isOwn ? "-left-6" : "-right-6"
              )}
            >
              <Smile className="h-3 w-3 text-zinc-400" />
            </button>
          )}

          {/* Reaction picker */}
          {activeReactionPicker && (
            <div
              className={cn(
                "absolute bottom-full mb-1 bg-zinc-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-700/50 p-1.5 z-50",
                isOwn ? "right-0" : "left-0"
              )}
            >
              <div className="grid grid-cols-4 gap-1 w-[120px]">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReactionToggle(id, emoji)
                      setActiveReactionPicker(false)
                    }}
                    className={cn(
                      "p-1 rounded hover:bg-zinc-700/50 transition-colors text-base",
                      userReactedSet.has(emoji) && "bg-zinc-700/50"
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
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(grouped).map(([type, data]) => (
              <button
                key={type}
                type="button"
                onClick={() => onReactionToggle(id, type)}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors text-xs",
                  userReactedSet.has(type)
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-zinc-800/50 hover:bg-zinc-700/50"
                )}
                title={data.users.join(", ")}
              >
                <span>{getReactionEmoji(type)}</span>
                <span className="text-zinc-400">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
