"use client"

import { useUser } from "@stackframe/stack"
import { Header } from "@/components/header"
import { UserDashboard } from "@/components/user-dashboard"
import { DiscoverPage } from "@/components/discover-page"

export default function HomePage() {
  const user = useUser()

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="relative z-10 pt-16 sm:pt-20">{user ? <UserDashboard /> : <DiscoverPage />}</main>
    </div>
  )
}
