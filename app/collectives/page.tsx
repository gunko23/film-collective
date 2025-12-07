"use client"

import { useUser, useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Plus, ArrowRight, Film, Crown, Shield, UserIcon } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { AuthErrorBoundary } from "@/components/auth-error-boundary"

type Collective = {
  id: string
  name: string
  description: string | null
  role: string
  member_count: number
  created_at: string
}

function CollectivesContent() {
  const user = useUser()
  const app = useStackApp()
  const router = useRouter()
  const [collectives, setCollectives] = useState<Collective[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchCollectives() {
      try {
        const res = await fetch("/api/collectives")
        if (res.ok) {
          const data = await res.json()
          setCollectives(data)
        }
      } catch (err) {
        console.error("Error fetching collectives:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectives()
  }, [user])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "admin":
        return <Shield className="h-3 w-3" />
      default:
        return <UserIcon className="h-3 w-3" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      default:
        return "Member"
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
              <Users className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Join a Collective</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Sign in to create or join collectives and share your movie taste with friends
            </p>
            <Button
              onClick={() => app.redirectToSignIn()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Sign In to Continue
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Your Collectives</h1>
              <p className="text-muted-foreground">Share your taste in movies with your groups</p>
            </div>
            <Link href="/collectives/new">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                <Plus className="h-4 w-4 mr-2" />
                Create Collective
              </Button>
            </Link>
          </div>

          {/* Collectives List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-card/50 border border-border/50 p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : collectives.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No collectives yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Create a collective to start sharing your movie ratings with friends
              </p>
              <Link href="/collectives/new">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Collective
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {collectives.map((collective) => (
                <Link
                  key={collective.id}
                  href={`/collectives/${collective.id}`}
                  className="group block rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-6 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                          {collective.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium shrink-0">
                          {getRoleIcon(collective.role)}
                          {getRoleLabel(collective.role)}
                        </span>
                      </div>
                      {collective.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{collective.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {collective.member_count} {collective.member_count === 1 ? "member" : "members"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Film className="h-4 w-4" />
                          View ratings
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Join via invite link hint */}
          <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              Have an invite link? You can join a collective by visiting the invite URL shared with you.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CollectivesPage() {
  return (
    <AuthErrorBoundary>
      <CollectivesContent />
    </AuthErrorBoundary>
  )
}
