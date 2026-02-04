"use client"

import { type ReactNode, useMemo } from "react"
import * as Ably from "ably"
import { AblyProvider } from "ably/react"

export function AblyClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new Ably.Realtime({
        authUrl: "/api/ably/auth",
        autoConnect: true,
      }),
    [],
  )

  return <AblyProvider client={client}>{children}</AblyProvider>
}
