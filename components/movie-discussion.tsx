"use client"

import { useMemo } from "react"
import { getMovieChannelName } from "@/lib/ably/channel-names"
import { REACTION_EMOJIS } from "@/lib/chat/constants"
import { ChatThread } from "@/components/chat/chat-thread"
import type { ChatConfig, ChatMessage } from "@/hooks/use-chat"

interface MovieDiscussionProps {
  collectiveId: string
  tmdbId: string | number
  mediaType: "movie" | "tv"
  currentUserId: string
  currentUserName?: string
  stickyInput?: boolean
  stickyInputBottomOffset?: number
}

export function MovieDiscussion({
  collectiveId,
  tmdbId,
  mediaType,
  currentUserId,
  currentUserName,
  stickyInput,
  stickyInputBottomOffset,
}: MovieDiscussionProps) {
  const chatConfig = useMemo<ChatConfig>(() => ({
    fetchUrl: `/api/collectives/${collectiveId}/movie/${tmdbId}/comments?mediaType=${mediaType}`,
    sendUrl: `/api/collectives/${collectiveId}/movie/${tmdbId}/comments?mediaType=${mediaType}`,
    reactionUrl: (messageId: string) =>
      `/api/collectives/${collectiveId}/movie/${tmdbId}/comments/${messageId}/reactions`,
    channelName: getMovieChannelName(collectiveId, tmdbId, mediaType),
    newMessageEvent: "new_comment",
    currentUserId,
    currentUserName,
    // Movie comments API returns array directly, not { messages: [...] }
    extractMessages: (data: unknown) => {
      const messages = Array.isArray(data) ? data : []
      return messages.map((m: any) => ({ ...m, reactions: m.reactions || [] }))
    },
    // Movie comments POST returns single comment, not { message: {...} }
    extractSentMessage: (data: unknown) => {
      const msg = data as ChatMessage
      return { ...msg, reactions: msg.reactions || [] }
    },
    buildSendBody: (content: string, gifUrl?: string) => ({
      content,
      gifUrl,
      mediaType,
    }),
    buildReactionBody: (reactionType: string) => ({
      reactionType,
    }),
    reactionStrategy: "refetch" as const,
  }), [collectiveId, tmdbId, mediaType, currentUserId, currentUserName])

  return (
    <ChatThread
      chatConfig={chatConfig}
      inputPlaceholder="Discuss this film..."
      emptyStateMessage="No messages yet"
      emptyStateIcon="🎬"
      reactionEmojis={REACTION_EMOJIS}
      stickyInput={stickyInput}
      stickyInputBottomOffset={stickyInputBottomOffset}
    />
  )
}
