"use client"

import { useMemo } from "react"
import { getMovieChannelName } from "@/lib/ably/channel-names"
import { REACTION_EMOJIS } from "@/lib/chat/constants"
import { ChatThread } from "@/components/chat/chat-thread"
import type { ChatConfig, ChatMessage } from "@/hooks/use-chat"

type MovieConversationThreadProps = {
  collectiveId: string
  tmdbId: number
  mediaType: "movie" | "tv"
  currentUserId: string
  initialComments?: ChatMessage[]
}

export function MovieConversationThread({
  collectiveId,
  tmdbId,
  mediaType,
  currentUserId,
  initialComments = [],
}: MovieConversationThreadProps) {
  const chatConfig = useMemo<ChatConfig>(() => ({
    fetchUrl: `/api/collectives/${collectiveId}/movie/${tmdbId}/comments?mediaType=${mediaType}`,
    sendUrl: `/api/collectives/${collectiveId}/movie/${tmdbId}/comments`,
    reactionUrl: (messageId: string) =>
      `/api/collectives/${collectiveId}/movie/${tmdbId}/comments/${messageId}/reactions`,
    channelName: getMovieChannelName(collectiveId, String(tmdbId), mediaType),
    newMessageEvent: "new_comment",
    currentUserId,
    extractMessages: (data: unknown) => {
      const arr = data as ChatMessage[]
      return arr.map((m) => ({ ...m, reactions: m.reactions || [] }))
    },
    extractSentMessage: (data: unknown) => {
      const d = data as ChatMessage
      return { ...d, reactions: d.reactions || [] }
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
    initialMessages: initialComments.map((m) => ({ ...m, reactions: m.reactions || [] })),
  }), [collectiveId, tmdbId, mediaType, currentUserId, initialComments])

  return (
    <ChatThread
      chatConfig={chatConfig}
      inputPlaceholder="Type a message..."
      reactionEmojis={REACTION_EMOJIS}
    />
  )
}
