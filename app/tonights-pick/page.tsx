"use client"

import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
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

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="relative z-10 pt-4 lg:pt-20 px-4 sm:px-6 pb-24 lg:pb-12">
        <div className="max-w-2xl mx-auto">
          <SoloTonightsPick onBack={() => router.back()} />
        </div>
      </main>
    </div>
  )
}
