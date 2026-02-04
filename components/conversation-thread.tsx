"use client"

import { useMemo } from "react"
import { getFeedChannelName } from "@/lib/ably/channel-names"
import { EMOJI_REACTIONS } from "@/lib/chat/constants"
import { ChatThread } from "@/components/chat/chat-thread"
import type { ChatConfig, ChatMessage } from "@/hooks/use-chat"

interface ConversationThreadProps {
  ratingId: string
  collectiveId: string
  currentUserId: string
  currentUserName?: string
  mediaType?: "movie" | "tv"
  initialComments?: ChatMessage[]
}

export function ConversationThread({
  collectiveId,
  ratingId,
  initialComments = [],
  currentUserId,
  currentUserName,
  mediaType = "movie",
}: ConversationThreadProps) {
  const reactionEmojis = useMemo(
    () => EMOJI_REACTIONS.map((r) => r.type),
    []
  )

  const chatConfig = useMemo<ChatConfig>(() => ({
    fetchUrl: `/api/collectives/${collectiveId}/feed/${ratingId}/comments`,
    sendUrl: `/api/collectives/${collectiveId}/feed/${ratingId}/comments`,
    reactionUrl: (messageId: string) =>
      `/api/collectives/${collectiveId}/feed/${ratingId}/comments/${messageId}/reactions`,
    channelName: getFeedChannelName(collectiveId, ratingId),
    newMessageEvent: "new_comment",
    currentUserId,
    currentUserName,
    extractMessages: (data: unknown) => {
      const d = data as { comments?: ChatMessage[] }
      return (d.comments || []).map((m) => ({ ...m, reactions: m.reactions || [] }))
    },
    extractSentMessage: (data: unknown) => {
      const d = data as { comment?: ChatMessage }
      const msg = d.comment || (d as unknown as ChatMessage)
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
    reactionStrategy: "optimistic" as const,
    initialMessages: initialComments.map((m) => ({ ...m, reactions: m.reactions || [] })),
  }), [collectiveId, ratingId, currentUserId, currentUserName, mediaType, initialComments])

  return (
    <ChatThread
      chatConfig={chatConfig}
      inputPlaceholder="Send a message..."
      pickerVariant="inline"
      reactionEmojis={reactionEmojis}
    />
  )
}
