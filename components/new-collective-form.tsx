"use client"

import type React from "react"

import { useUser, useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Sparkles } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function NewCollectiveForm() {
  const user = useUser()
  const app = useStackApp()
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/collectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      })

      if (res.ok) {
        const collective = await res.json()
        router.push(`/collectives/${collective.id}`)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create collective")
      }
    } catch (err) {
      console.error("Error creating collective:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-6 lg:pt-28 pb-24 lg:pb-16">
          <div className="mx-auto max-w-md px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
              <Users className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Create a Collective</h1>
            <p className="text-muted-foreground mb-8">Sign in to create your own collective</p>
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

      <main className="relative z-10 pt-6 lg:pt-28 pb-24 lg:pb-16">
        <div className="mx-auto max-w-lg px-6">
          {/* Back button */}
          <Link
            href="/collectives"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Collectives
          </Link>

          {/* Form card */}
          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Create a Collective</h1>
                <p className="text-sm text-muted-foreground">Start sharing your movie taste</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Collective Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Movie Night Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's your collective about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={creating || !name.trim()}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/25"
              >
                {creating ? "Creating..." : "Create Collective"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
