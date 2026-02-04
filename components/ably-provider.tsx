"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import * as Ably from "ably"
import { AblyProvider } from "ably/react"

export function AblyClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Ably.Realtime | null>(null)
  const clientRef = useRef<Ably.Realtime | null>(null)

  useEffect(() => {
    const ablyClient = new Ably.Realtime({
      authCallback: async (_data, callback) => {
        try {
          const res = await fetch("/api/ably/auth")
          if (!res.ok) {
            callback(new Error(`Auth failed: ${res.status}`), null)
            return
          }
          const tokenRequest = await res.json()
          callback(null, tokenRequest)
        } catch (err) {
          callback(err as Error, null)
        }
      },
      autoConnect: true,
    })

    clientRef.current = ablyClient
    setClient(ablyClient)

    return () => {
      ablyClient.close()
      clientRef.current = null
    }
  }, [])

  if (!client) {
    return <>{children}</>
  }

  return <AblyProvider client={client}>{children}</AblyProvider>
}
