"use client"

import { useRef, useCallback } from "react"
import { SCROLL_BOTTOM_THRESHOLD } from "@/lib/chat/constants"

interface UseAutoScrollOptions {
  threshold?: number
}

export function useAutoScroll(options?: UseAutoScrollOptions) {
  const threshold = options?.threshold ?? SCROLL_BOTTOM_THRESHOLD
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  // Prevents handleScroll from resetting shouldAutoScroll during programmatic scrolls
  const isProgrammaticScrollRef = useRef(false)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    // Skip auto-scroll detection during programmatic scrolls
    if (isProgrammaticScrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < threshold
  }, [threshold])

  // Force scroll to bottom unconditionally (for new messages, sending, etc.)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    shouldAutoScrollRef.current = true
    isProgrammaticScrollRef.current = true

    // Wait for DOM to settle, then scroll
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const target = containerRef.current.scrollHeight
        containerRef.current.scrollTo({ top: target, behavior })
      }
      // Release the guard after scroll events have fired
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 200)
    })
  }, [])

  // Auto-scroll only if user is already near the bottom
  const scrollIfNeeded = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(behavior)
    }
  }, [scrollToBottom])

  return {
    containerRef,
    bottomRef,
    handleScroll,
    scrollToBottom,
    scrollIfNeeded,
    shouldAutoScrollRef,
  }
}
