"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface DiscussionStreamOptions {
  collectiveId: string
  onNewMessage?: (event: { type: string; data: unknown; timestamp: number }) => void
  onTypingUpdate?: (users: Array<{ user_id: string; user_name: string }>) => void
}

export function useDiscussionStream({ collectiveId, onNewMessage, onTypingUpdate }: DiscussionStreamOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const onNewMessageRef = useRef(onNewMessage)
  const onTypingUpdateRef = useRef(onTypingUpdate)

  // Keep refs in sync to avoid stale closures
  onNewMessageRef.current = onNewMessage
  onTypingUpdateRef.current = onTypingUpdate

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource(
        `/api/collectives/${collectiveId}/discussion/realtime`
      )
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            return
          }

          if (data.type === "typing") {
            onTypingUpdateRef.current?.(data.users || [])
            return
          }

          if (data.type === "new_message") {
            onNewMessageRef.current?.(data)
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        // Exponential backoff (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (err) {
      console.error("Failed to connect to discussion stream:", err)
    }
  }, [collectiveId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    connect()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        connect()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [connect, disconnect])

  return { isConnected, disconnect }
}
