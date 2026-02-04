"use client"

import { useMemo } from "react"
import { getDiscussionChannelName } from "@/lib/ably/channel-names"
import { REACTION_EMOJIS } from "@/lib/chat/constants"
import { ChatThread } from "@/components/chat/chat-thread"
import type { ChatConfig, ChatMessage } from "@/hooks/use-chat"

interface GeneralDiscussionProps {
  collectiveId: string
  currentUserId: string
  currentUserName?: string
}

export function GeneralDiscussion({ collectiveId, currentUserId, currentUserName }: GeneralDiscussionProps) {
  const chatConfig = useMemo<ChatConfig>(() => ({
    fetchUrl: `/api/collectives/${collectiveId}/discussion/stream`,
    sendUrl: `/api/collectives/${collectiveId}/discussion/messages`,
    reactionUrl: (messageId: string) =>
      `/api/collectives/${collectiveId}/discussion/messages/${messageId}/reactions`,
    channelName: getDiscussionChannelName(collectiveId),
    newMessageEvent: "new_message",
    currentUserId,
    currentUserName,
    extractMessages: (data: unknown) => {
      const d = data as { messages?: ChatMessage[] }
      return (d.messages || []).map((m) => ({ ...m, reactions: m.reactions || [] }))
    },
    extractSentMessage: (data: unknown) => {
      const d = data as { message?: ChatMessage }
      const msg = d.message || (d as unknown as ChatMessage)
      return { ...msg, reactions: msg.reactions || [] }
    },
    buildSendBody: (content: string, gifUrl?: string) => ({
      content,
      gifUrl,
    }),
    buildReactionBody: (reactionType: string) => ({
      reactionType,
    }),
    reactionStrategy: "refetch" as const,
    useCursorPagination: true,
    cursorFetchUrl: (cursor: string) =>
      `/api/collectives/${collectiveId}/discussion/stream?cursor=${encodeURIComponent(cursor)}`,
  }), [collectiveId, currentUserId, currentUserName])

  return (
    <ChatThread
      chatConfig={chatConfig}
      inputPlaceholder="Message"
      reactionEmojis={REACTION_EMOJIS}
    />
  )
}
