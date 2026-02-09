"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAbly } from "ably/react"

type ReasoningData = {
  tmdbId: number
  summary: string
  pairings?: {
    cocktail: { name: string; desc: string }
    zeroproof: { name: string; desc: string }
    snack: { name: string; desc: string }
  } | null
  parentalSummary?: string | null
}

/**
 * Hook that subscribes to an Ably reasoning channel and accumulates
 * LLM reasoning data as it streams in for each movie.
 *
 * Returns a map of tmdbId -> reasoning data, plus a loading flag.
 */
export function useReasoningChannel(channelName: string | null) {
  const [reasoningMap, setReasoningMap] = useState<Map<number, ReasoningData>>(new Map())
  const [isComplete, setIsComplete] = useState(false)
  const ably = useAbly()
  const channelRef = useRef<string | null>(null)

  useEffect(() => {
    if (!channelName) return

    // Reset state when channel changes
    if (channelRef.current !== channelName) {
      setReasoningMap(new Map())
      setIsComplete(false)
      channelRef.current = channelName
    }

    const channel = ably.channels.get(channelName)

    const reasoningListener = (message: { data: ReasoningData }) => {
      const data = message.data
      if (data && typeof data.tmdbId === "number") {
        setReasoningMap(prev => {
          const next = new Map(prev)
          next.set(data.tmdbId, data)
          return next
        })
      }
    }

    const completeListener = () => {
      setIsComplete(true)
    }

    channel.subscribe("reasoning", reasoningListener)
    channel.subscribe("reasoning-complete", completeListener)

    return () => {
      channel.unsubscribe("reasoning", reasoningListener)
      channel.unsubscribe("reasoning-complete", completeListener)
    }
  }, [ably, channelName])

  /**
   * Apply reasoning data to a recommendations array, returning
   * a new array with reasoning, pairings, and parentalSummary populated.
   */
  const applyReasoning = useCallback(<T extends { tmdbId: number; reasoning: string[]; pairings?: any; parentalSummary?: string | null }>(
    recommendations: T[]
  ): T[] => {
    if (reasoningMap.size === 0) return recommendations

    return recommendations.map(rec => {
      const data = reasoningMap.get(rec.tmdbId)
      if (!data) return rec
      return {
        ...rec,
        reasoning: [data.summary],
        pairings: data.pairings || rec.pairings,
        parentalSummary: data.parentalSummary || rec.parentalSummary,
      }
    })
  }, [reasoningMap])

  return {
    reasoningMap,
    isComplete,
    isLoading: !!channelName && !isComplete,
    applyReasoning,
  }
}
