"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { usePresence, usePresenceListener } from "ably/react"

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
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  const { updateStatus } = usePresence(
    { channelName, skip: !enabled },
    { isTyping: false, userName: currentUserName || "User" },
  )

  const { presenceData } = usePresenceListener(
    { channelName, skip: !enabled },
  )

  // Derive typing users from presence data
  useEffect(() => {
    if (!enabled || !presenceData) {
      setTypingUsers([])
      return
    }

    const typing: TypingUser[] = presenceData
      .filter((member) => {
        const data = member.data as { isTyping?: boolean; userName?: string } | undefined
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
  }, [presenceData, currentUserId, enabled])

  const startTyping = useCallback(() => {
    if (!enabled || isTypingRef.current) return
    isTypingRef.current = true
    updateStatus({ isTyping: true, userName: currentUserName || "User" })

    // Auto-stop after 5 seconds of no calls
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      updateStatus({ isTyping: false, userName: currentUserName || "User" })
    }, 5000)
  }, [enabled, updateStatus, currentUserName])

  const stopTyping = useCallback(() => {
    if (!enabled) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    isTypingRef.current = false
    updateStatus({ isTyping: false, userName: currentUserName || "User" })
  }, [enabled, updateStatus, currentUserName])

  // Extend typing timeout on repeated calls
  const extendTyping = useCallback(() => {
    if (!enabled) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      updateStatus({ isTyping: true, userName: currentUserName || "User" })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      updateStatus({ isTyping: false, userName: currentUserName || "User" })
    }, 5000)
  }, [enabled, updateStatus, currentUserName])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return { typingUsers, startTyping, stopTyping, extendTyping }
}
