"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface NotificationStreamState {
  unreadCount: number
  isConnected: boolean
  error: string | null
}

export function useNotificationStream() {
  const [state, setState] = useState<NotificationStreamState>({
    unreadCount: 0,
    isConnected: false,
    error: null,
  })
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    // Don't connect if already connected
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource("/api/notifications/stream")
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setState((prev) => ({ ...prev, isConnected: true, error: null }))
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "update") {
            setState((prev) => ({ ...prev, unreadCount: data.unreadCount }))
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err)
        }
      }

      eventSource.onerror = () => {
        setState((prev) => ({ ...prev, isConnected: false }))
        eventSource.close()
        eventSourceRef.current = null

        // Exponential backoff for reconnection (max 30 seconds)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (err) {
      setState((prev) => ({ ...prev, error: "Failed to connect to notification stream" }))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setState((prev) => ({ ...prev, isConnected: false }))
  }, [])

  // Manually trigger a refresh (useful after marking as read)
  const refresh = useCallback(() => {
    // Reconnect to get fresh data
    disconnect()
    connect()
  }, [connect, disconnect])

  useEffect(() => {
    connect()

    // Handle visibility change - reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        connect()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Listen for "notifications-read" events from other components
    // so the badge clears immediately without waiting for the next SSE poll
    const handleNotificationsRead = () => {
      setState((prev) => ({ ...prev, unreadCount: 0 }))
    }
    window.addEventListener("notifications-read", handleNotificationsRead)

    return () => {
      disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("notifications-read", handleNotificationsRead)
    }
  }, [connect, disconnect])

  return {
    ...state,
    refresh,
    disconnect,
  }
}
