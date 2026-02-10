"use client"

import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SoloTonightsPick } from "@/components/solo-tonights-pick"

export default function TonightsPickPage() {
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/handler/sign-in")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return <SoloTonightsPick onBack={() => router.back()} />
}
