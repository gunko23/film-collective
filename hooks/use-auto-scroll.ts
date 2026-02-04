"use client"

import { useRef, useEffect, useCallback } from "react"
import { SCROLL_BOTTOM_THRESHOLD } from "@/lib/chat/constants"

interface UseAutoScrollOptions {
  threshold?: number
}

export function useAutoScroll(options?: UseAutoScrollOptions) {
  const threshold = options?.threshold ?? SCROLL_BOTTOM_THRESHOLD
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < threshold
  }, [threshold])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Auto-scroll when shouldAutoScroll is true (called externally after message changes)
  const scrollIfNeeded = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (shouldAutoScrollRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
    }
  }, [])

  return {
    containerRef,
    bottomRef,
    handleScroll,
    scrollToBottom,
    scrollIfNeeded,
    shouldAutoScrollRef,
  }
}
