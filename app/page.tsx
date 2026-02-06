"use client"

import { useUser } from "@stackframe/stack"
import { Header } from "@/components/header"
import { UserDashboard } from "@/components/user-dashboard"
import { LandingPage } from "@/components/landing-page"
import { LightLeaks } from "@/components/soulframe/light-leaks"

export default function HomePage() {
  const user = useUser()

  if (!user) {
    return <LandingPage />
  }

  return (
    <div className="relative min-h-screen bg-background">
      <LightLeaks />
      <Header />
      <main className="relative z-10 pt-2 lg:pt-16">
        <UserDashboard />
      </main>
    </div>
  )
}
