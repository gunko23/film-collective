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

  // Scroll to bottom using container's scrollTop (avoids affecting parent scroll containers)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      const target = containerRef.current.scrollHeight
      if (behavior === "smooth") {
        containerRef.current.scrollTo({ top: target, behavior: "smooth" })
      } else {
        containerRef.current.scrollTop = target
      }
    }
  }, [])

  // Auto-scroll when shouldAutoScroll is true (called externally after message changes)
  const scrollIfNeeded = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (shouldAutoScrollRef.current && containerRef.current) {
      setTimeout(() => {
        if (containerRef.current) {
          const target = containerRef.current.scrollHeight
          if (behavior === "smooth") {
            containerRef.current.scrollTo({ top: target, behavior: "smooth" })
          } else {
            containerRef.current.scrollTop = target
          }
        }
      }, 50)
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
