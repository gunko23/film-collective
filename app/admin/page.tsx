"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  RefreshCw,
  Database,
  Film,
  Tags,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Clapperboard,
} from "lucide-react"
import type { SyncLogEntry } from "@/lib/db"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    console.warn("Failed to parse response:", text.substring(0, 100))
    return { history: [] }
  }
}

type SyncHistoryResponse = {
  history: SyncLogEntry[]
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [pages, setPages] = useState("1")
  const [movieId, setMovieId] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const { data: historyData, isLoading: historyLoading } = useSWR<SyncHistoryResponse>("/api/tmdb/sync", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  })

  const handleSync = async (action: string, extraParams: Record<string, unknown> = {}) => {
    setIsLoading(action)
    setResult(null)
    try {
      const response = await fetch("/api/tmdb/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraParams }),
      })
      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { success: false, message: text.substring(0, 200) || "Unknown error" }
      }
      setResult(data)
      mutate("/api/tmdb/sync")
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-accent/10 text-accent ring-1 ring-accent/20">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Done
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      case "running":
        return (
          <Badge variant="secondary" className="bg-card ring-1 ring-border">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="ring-1 ring-border">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
              <Clapperboard className="h-4 w-4 text-accent" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Film Collective</span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage TMDB synchronization and data imports</p>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm ring-1 ${
              result.success
                ? "bg-accent/10 text-accent ring-accent/20"
                : "bg-destructive/10 text-destructive ring-destructive/20"
            }`}
          >
            {result.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Actions */}
          <div className="space-y-4">
            {/* Genres */}
            <Card className="bg-card border-border/50 ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Tags className="h-4 w-4 text-accent" />
                  </div>
                  Sync Genres
                </CardTitle>
                <CardDescription className="text-sm">Fetch all genres from TMDB</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSync("genres")}
                  disabled={isLoading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading === "genres" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Genres
                </Button>
              </CardContent>
            </Card>

            {/* Popular */}
            <Card className="bg-card border-border/50 ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Film className="h-4 w-4 text-accent" />
                  </div>
                  Sync Popular Films
                </CardTitle>
                <CardDescription className="text-sm">Fetch popular films (20 per page)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pages" className="text-sm text-muted-foreground">
                    Number of pages
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    min="1"
                    max="10"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>
                <Button
                  onClick={() => handleSync("popular", { pages: Math.min(10, Number.parseInt(pages) || 1) })}
                  disabled={isLoading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading === "popular" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Popular
                </Button>
              </CardContent>
            </Card>

            {/* Single */}
            <Card className="bg-card border-border/50 ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Database className="h-4 w-4 text-accent" />
                  </div>
                  Sync Single Film
                </CardTitle>
                <CardDescription className="text-sm">Fetch a specific film by TMDB ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="movieId" className="text-sm text-muted-foreground">
                    TMDB ID
                  </Label>
                  <Input
                    id="movieId"
                    type="number"
                    value={movieId}
                    onChange={(e) => setMovieId(e.target.value)}
                    placeholder="e.g., 550"
                    className="h-10 bg-background"
                  />
                </div>
                <Button
                  onClick={() => handleSync("movie", { movieId: Number.parseInt(movieId) })}
                  disabled={isLoading !== null || !movieId}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading === "movie" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Film
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card className="h-fit bg-card border-border/50 ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                Sync History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : historyData?.history && historyData.history.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {historyData.history.map((entry) => (
                    <div key={entry.id} className="rounded-lg bg-muted/50 p-4 ring-1 ring-border/50">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium capitalize text-foreground">{entry.syncType}</span>
                        {getStatusBadge(entry.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.startedAt)}</p>
                      {entry.itemsProcessed !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Processed: {entry.itemsProcessed}
                          {entry.totalItems ? ` / ${entry.totalItems}` : ""}
                        </p>
                      )}
                      {entry.errorMessage && (
                        <p className="text-xs text-destructive mt-2 line-clamp-2">{entry.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">No sync history yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
