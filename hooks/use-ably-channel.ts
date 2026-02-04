"use client"

import { useEffect, useRef } from "react"
import { useAbly } from "ably/react"

interface UseAblyChannelOptions {
  channelName: string
  eventName: string
  onMessage: (data: unknown) => void
  enabled?: boolean
}

export function useAblyChannel({ channelName, eventName, onMessage, enabled = true }: UseAblyChannelOptions) {
  const ably = useAbly()
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!enabled) return

    const channel = ably.channels.get(channelName)

    const listener = (message: { data: unknown }) => {
      onMessageRef.current(message.data)
    }

    channel.subscribe(eventName, listener)

    return () => {
      channel.unsubscribe(eventName, listener)
    }
  }, [ably, channelName, eventName, enabled])
}
