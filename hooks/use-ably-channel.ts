"use client"

import { useEffect, useRef } from "react"
import { useChannel } from "ably/react"

interface UseAblyChannelOptions {
  channelName: string
  eventName: string
  onMessage: (data: unknown) => void
  enabled?: boolean
}

export function useAblyChannel({ channelName, eventName, onMessage, enabled = true }: UseAblyChannelOptions) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useChannel(
    { channelName, skip: !enabled },
    eventName,
    (message) => {
      onMessageRef.current(message.data)
    },
  )
}
