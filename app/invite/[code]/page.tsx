"use client"

import { useUser, useStackApp } from "@stackframe/stack"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"

type InviteInfo = {
  collectiveId: string
  collectiveName: string
  collectiveDescription: string | null
}

export default function InvitePage() {
  const user = useUser()
  const app = useStackApp()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${code}`)
        if (res.ok) {
          const data = await res.json()
          setInviteInfo(data)
        } else {
          const data = await res.json()
          setError(data.error || "Invalid invite")
        }
      } catch (err) {
        console.error("Error fetching invite:", err)
        setError("Failed to load invite")
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [code])

  const handleJoin = async () => {
    if (!user) {
      app.redirectToSignIn()
      return
    }

    setJoining(true)
    setError(null)

    try {
      const res = await fetch(`/api/invites/${code}`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setJoined(true)
        setTimeout(() => {
          router.push(`/collectives/${data.collectiveId}`)
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to join collective")
      }
    } catch (err) {
      console.error("Error joining collective:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setJoining(false)
    }
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
        <div className="mx-auto max-w-md px-6">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading invite...</p>
            </div>
          ) : joined ? (
            <div className="text-center py-20 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to the collective!</h1>
              <p className="text-muted-foreground">Redirecting you now...</p>
            </div>
          ) : error && !inviteInfo ? (
            <div className="text-center py-20 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite</h1>
              <p className="text-muted-foreground mb-8">{error}</p>
              <Link href="/collectives">
                <Button variant="outline" className="rounded-xl bg-transparent">
                  Browse Collectives
                </Button>
              </Link>
            </div>
          ) : inviteInfo ? (
            <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">You're Invited!</h1>
              <p className="text-muted-foreground mb-6">You've been invited to join a collective</p>

              <div className="rounded-xl bg-secondary/50 p-4 mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">{inviteInfo.collectiveName}</h2>
                {inviteInfo.collectiveDescription && (
                  <p className="text-sm text-muted-foreground">{inviteInfo.collectiveDescription}</p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {user ? (
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/25"
                >
                  {joining ? "Joining..." : "Join Collective"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => app.redirectToSignIn()}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/25"
                  >
                    Sign In to Join
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Don't have an account? You can create one after signing in.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
