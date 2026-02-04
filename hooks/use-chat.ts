"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useAblyChannel } from "@/hooks/use-ably-channel"
import { useAblyPresence } from "@/hooks/use-ably-presence"
import { OPTIMISTIC_ID_PREFIX } from "@/lib/chat/constants"

export interface ChatMessage {
  id: string
  content: string
  gif_url?: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
  reactions: Array<{
    id: string
    user_id: string
    user_name?: string
    reaction_type: string
  }>
  isOptimistic?: boolean
}

export interface ChatConfig {
  fetchUrl: string
  sendUrl: string
  reactionUrl: (messageId: string) => string
  channelName: string
  newMessageEvent: string
  currentUserId: string
  currentUserName?: string
  extractMessages?: (data: unknown) => ChatMessage[]
  extractSentMessage?: (data: unknown) => ChatMessage
  buildSendBody?: (content: string, gifUrl?: string) => object
  buildReactionBody?: (reactionType: string) => object
  reactionStrategy?: "refetch" | "optimistic"
  useCursorPagination?: boolean
  cursorFetchUrl?: (cursor: string) => string
  initialMessages?: ChatMessage[]
  enabled?: boolean
}

// Default extractors / builders
const defaultExtractMessages = (data: unknown) => {
  const d = data as Record<string, unknown>
  return (d.messages ?? d) as ChatMessage[]
}
const defaultExtractSentMessage = (data: unknown) => {
  const d = data as Record<string, unknown>
  return (d.message ?? d) as ChatMessage
}
const defaultBuildSendBody = (content: string, gifUrl?: string) => ({
  content,
  gifUrl,
})
const defaultBuildReactionBody = (reactionType: string) => ({
  reactionType,
})

export function useChat(config: ChatConfig) {
  const {
    fetchUrl,
    sendUrl,
    reactionUrl,
    channelName,
    newMessageEvent,
    currentUserId,
    currentUserName,
    extractMessages = defaultExtractMessages,
    extractSentMessage = defaultExtractSentMessage,
    buildSendBody = defaultBuildSendBody,
    buildReactionBody = defaultBuildReactionBody,
    reactionStrategy = "refetch",
    useCursorPagination = false,
    cursorFetchUrl,
    initialMessages,
    enabled = true,
  } = config

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || [])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const lastCursorRef = useRef<string | null>(null)
  const onNewMessageRef = useRef<(() => void) | null>(null)

  // Allow ChatThread to hook into new-message events for scroll
  const setOnNewMessage = useCallback((fn: () => void) => {
    onNewMessageRef.current = fn
  }, [])

  const fetchMessages = useCallback(async (useCursor = false) => {
    try {
      let url = fetchUrl
      if (useCursor && useCursorPagination && lastCursorRef.current && cursorFetchUrl) {
        url = cursorFetchUrl(lastCursorRef.current)
      }
      const res = await fetch(url)
      if (!res.ok) return

      const data = await res.json()

      // Handle cursor pagination metadata
      if (useCursorPagination && data.nextCursor) {
        lastCursorRef.current = data.nextCursor
      }

      const incoming = extractMessages(data)

      if (useCursor && useCursorPagination && lastCursorRef.current) {
        // Append new messages, deduplicate
        if (incoming.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const unique = incoming.filter((m) => !existingIds.has(m.id))
            return unique.length > 0 ? [...prev, ...unique] : prev
          })
        }
      } else {
        // Normalize: ensure reactions array exists
        setMessages(incoming.map((m) => ({ ...m, reactions: m.reactions || [] })))
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchUrl, extractMessages, useCursorPagination, cursorFetchUrl])

  // Subscribe to new messages via Ably
  useAblyChannel({
    channelName,
    eventName: newMessageEvent,
    enabled,
    onMessage: useCallback((data: unknown) => {
      const msg = data as ChatMessage
      if (!msg?.id) return

      setMessages((prev) => {
        // Deduplicate and replace optimistic messages
        const withoutOptimistic = prev.filter(
          (m) => !(m.isOptimistic && m.user_id === msg.user_id && m.content === msg.content)
        )
        if (withoutOptimistic.some((m) => m.id === msg.id)) return withoutOptimistic
        return [...withoutOptimistic, { ...msg, reactions: msg.reactions || [] }]
      })

      if (msg.created_at && useCursorPagination) {
        lastCursorRef.current = msg.created_at
      }

      onNewMessageRef.current?.()
    }, [useCursorPagination]),
  })

  // Subscribe to reactions via Ably (refetch strategy)
  useAblyChannel({
    channelName,
    eventName: "reaction",
    enabled: enabled && reactionStrategy === "refetch",
    onMessage: useCallback(() => {
      fetchMessages(false)
    }, [fetchMessages]),
  })

  // Typing presence
  const { typingUsers, extendTyping, stopTyping } = useAblyPresence({
    channelName,
    currentUserId,
    currentUserName,
    enabled,
  })

  // Initial fetch
  useEffect(() => {
    if (enabled && (!initialMessages || initialMessages.length === 0)) {
      fetchMessages(false)
    } else {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return
    const trimmed = content.trim()

    setIsSending(true)
    stopTyping()

    const optimisticId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}`
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      content: trimmed,
      user_id: currentUserId,
      user_name: currentUserName || "You",
      created_at: new Date().toISOString(),
      reactions: [],
      isOptimistic: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    onNewMessageRef.current?.()

    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSendBody(trimmed, undefined)),
      })
      if (res.ok) {
        const data = await res.json()
        const saved = extractSentMessage(data)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...saved, reactions: saved.reactions || [], isOptimistic: false }
              : m
          )
        )
        if (saved.created_at && useCursorPagination) {
          lastCursorRef.current = saved.created_at
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    } finally {
      setIsSending(false)
    }
  }, [isSending, sendUrl, buildSendBody, extractSentMessage, currentUserId, currentUserName, stopTyping, useCursorPagination])

  const sendGif = useCallback(async (gifUrl: string) => {
    const optimisticId = `${OPTIMISTIC_ID_PREFIX}gif-${Date.now()}`
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      content: "",
      gif_url: gifUrl,
      user_id: currentUserId,
      user_name: currentUserName || "You",
      created_at: new Date().toISOString(),
      reactions: [],
      isOptimistic: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    onNewMessageRef.current?.()

    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSendBody("", gifUrl)),
      })
      if (res.ok) {
        const data = await res.json()
        const saved = extractSentMessage(data)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...saved, reactions: saved.reactions || [], isOptimistic: false }
              : m
          )
        )
        if (saved.created_at && useCursorPagination) {
          lastCursorRef.current = saved.created_at
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    }
  }, [sendUrl, buildSendBody, extractSentMessage, currentUserId, currentUserName, useCursorPagination])

  const toggleReaction = useCallback(async (messageId: string, reactionType: string) => {
    try {
      const res = await fetch(reactionUrl(messageId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReactionBody(reactionType)),
      })

      if (res.ok && reactionStrategy === "optimistic") {
        const data = await res.json()
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg
            const reactions = msg.reactions || []
            if (data.action === "added") {
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  { id: data.id, user_id: currentUserId, reaction_type: reactionType },
                ],
              }
            } else {
              return {
                ...msg,
                reactions: reactions.filter(
                  (r) =>
                    !(
                      r.user_id?.toLowerCase() === currentUserId.toLowerCase() &&
                      r.reaction_type === reactionType
                    )
                ),
              }
            }
          })
        )
      } else if (res.ok && reactionStrategy === "refetch") {
        fetchMessages(false)
      }
    } catch {
      // silently fail
    }
  }, [reactionUrl, buildReactionBody, reactionStrategy, currentUserId, fetchMessages])

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    sendGif,
    toggleReaction,
    refetchMessages: fetchMessages,
    typingUsers,
    extendTyping,
    stopTyping,
    setOnNewMessage,
  }
}
