"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAbly } from "ably/react"
import type { Types } from "ably"

interface TypingUser {
  user_id: string
  user_name: string
}

interface UseAblyPresenceOptions {
  channelName: string
  currentUserId: string
  currentUserName?: string
  enabled?: boolean
}

export function useAblyPresence({
  channelName,
  currentUserId,
  currentUserName,
  enabled = true,
}: UseAblyPresenceOptions) {
  const ably = useAbly()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const channelRef = useRef<Types.RealtimeChannelCallbacks | null>(null)

  // Derive typing users from presence set
  const updateTypingUsersFromPresence = useCallback(async (channel: Types.RealtimeChannelCallbacks) => {
    try {
      const members = await channel.presence.get()
      const typing: TypingUser[] = members
        .filter((member) => {
          const data = member.data as { isTyping?: boolean } | undefined
          return data?.isTyping && member.clientId !== currentUserId
        })
        .map((member) => {
          const data = member.data as { userName?: string }
          return {
            user_id: member.clientId,
            user_name: data?.userName || "User",
          }
        })
      setTypingUsers(typing)
    } catch {
      // Ignore errors (e.g. channel not attached yet)
    }
  }, [currentUserId])

  useEffect(() => {
    if (!enabled) {
      setTypingUsers([])
      return
    }

    const channel = ably.channels.get(channelName)
    channelRef.current = channel

    // Enter presence
    channel.presence.enter({ isTyping: false, userName: currentUserName || "User" })

    // Listen for presence changes
    const onPresenceChange = () => {
      updateTypingUsersFromPresence(channel)
    }

    channel.presence.subscribe(onPresenceChange)

    return () => {
      channel.presence.unsubscribe(onPresenceChange)
      channel.presence.leave()
      channelRef.current = null
    }
  }, [ably, channelName, enabled, currentUserName, updateTypingUsersFromPresence])

  const updatePresenceData = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return
    channelRef.current.presence.update({ isTyping, userName: currentUserName || "User" })
  }, [currentUserName])

  const startTyping = useCallback(() => {
    if (!enabled || isTypingRef.current) return
    isTypingRef.current = true
    updatePresenceData(true)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      updatePresenceData(false)
    }, 5000)
  }, [enabled, updatePresenceData])

  const stopTyping = useCallback(() => {
    if (!enabled) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    isTypingRef.current = false
    updatePresenceData(false)
  }, [enabled, updatePresenceData])

  const extendTyping = useCallback(() => {
    if (!enabled) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      updatePresenceData(true)
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      updatePresenceData(false)
    }, 5000)
  }, [enabled, updatePresenceData])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return { typingUsers, startTyping, stopTyping, extendTyping }
}
