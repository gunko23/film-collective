"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Trophy,
  ShieldAlert,
  Upload,
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

/**
 * Parse a CSV line properly, handling quoted fields that may contain commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.replace(/^["']|["']$/g, ""))
      current = ""
    } else {
      current += char
    }
  }
  
  // Don't forget the last field
  result.push(current.replace(/^["']|["']$/g, ""))
  
  return result
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [pages, setPages] = useState("1")
  const [movieId, setMovieId] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Parental guide import state
  const [pgFile, setPgFile] = useState<File | null>(null)
  const [pgProgress, setPgProgress] = useState({ current: 0, total: 0, phase: "" })
  const [pgStats, setPgStats] = useState<{ totalCached: number } | null>(null)

  // Fetch parental guide stats on mount
  const { data: pgStatsData } = useSWR<{ totalCached: number }>(
    "/api/parental-guide?stats=true",
    fetcher,
    { revalidateOnFocus: false }
  )

  // Handle parental guide CSV import
  const handleParentalGuideImport = async () => {
    if (!pgFile) return

    setIsLoading("parental-guide")
    setResult(null)
    setPgProgress({ current: 0, total: 0, phase: "Reading CSV..." })

    try {
      // Read the CSV file
      const text = await pgFile.text()
      const lines = text.split("\n")
      
      // Parse headers - trim whitespace and tabs, lowercase
      const headerLine = lines[0]
      const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase().replace(/[\t\s]+/g, ""))
      
      console.log("CSV Headers found:", headers)
      
      // Find the column indices we need
      const colIndex = {
        tconst: headers.indexOf("tconst"),
        sex: headers.indexOf("sex"),
        violence: headers.indexOf("violence"),
        profanity: headers.indexOf("profanity"),
        drugs: headers.indexOf("drugs"),
        intense: headers.indexOf("intense"),
      }
      
      console.log("Column indices:", colIndex)
      
      // Validate we found the required columns
      if (colIndex.tconst === -1) {
        throw new Error("Could not find 'tconst' column in CSV")
      }
      
      // Parse all rows first
      const allRows: Array<{
        imdbId: string
        sexNudity: string
        violence: string
        profanity: string
        alcoholDrugsSmoking: string
        frighteningIntense: string
      }> = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // Parse CSV line properly (handles quoted fields with commas)
        const values = parseCSVLine(line)
        
        // Get IMDb ID from the correct column
        const imdbId = colIndex.tconst >= 0 ? values[colIndex.tconst]?.trim() : ""
        if (!imdbId) continue
        
        const normalizedImdbId = imdbId.startsWith("tt") ? imdbId : `tt${imdbId.padStart(7, "0")}`
        
        // Get severity values from correct columns by index
        allRows.push({
          imdbId: normalizedImdbId,
          sexNudity: colIndex.sex >= 0 ? values[colIndex.sex]?.trim() || "" : "",
          violence: colIndex.violence >= 0 ? values[colIndex.violence]?.trim() || "" : "",
          profanity: colIndex.profanity >= 0 ? values[colIndex.profanity]?.trim() || "" : "",
          alcoholDrugsSmoking: colIndex.drugs >= 0 ? values[colIndex.drugs]?.trim() || "" : "",
          frighteningIntense: colIndex.intense >= 0 ? values[colIndex.intense]?.trim() || "" : "",
        })
      }

      console.log(`Parsed ${allRows.length} rows from CSV`)
      console.log("Sample row:", allRows[0])

      setPgProgress({ current: 0, total: allRows.length, phase: "Importing (server-side)..." })

      // Send to server in larger batches - server handles TMDB lookups in parallel
      const BATCH_SIZE = 200
      let totalInserted = 0
      let totalNotFound = 0
      let totalFailed = 0
      let totalSkipped = 0

      for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
        const batch = allRows.slice(i, i + BATCH_SIZE)
        
        const res = await fetch("/api/parental-guide/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch }),
        })
        
        const data = await res.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        totalInserted += data.inserted || 0
        totalNotFound += data.notFound || 0
        totalFailed += data.failed || 0
        totalSkipped += data.skipped || 0
        
        setPgProgress({ 
          current: Math.min(i + BATCH_SIZE, allRows.length), 
          total: allRows.length, 
          phase: `Importing... (${totalInserted} added, ${totalSkipped} skipped)` 
        })
      }

      setResult({
        success: true,
        message: `Import complete! Inserted: ${totalInserted}, Skipped (already exists): ${totalSkipped}, Not found in TMDB: ${totalNotFound}, Failed: ${totalFailed}`,
      })
      setPgFile(null)
      mutate("/api/parental-guide?stats=true")
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Import failed",
      })
    } finally {
      setIsLoading(null)
      setPgProgress({ current: 0, total: 0, phase: "" })
    }
  }

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

            {/* Oscar TMDB IDs */}
            <Card className="bg-card border-border/50 ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <Trophy className="h-4 w-4 text-amber-500" />
                  </div>
                  Populate Oscar TMDB IDs
                </CardTitle>
                <CardDescription className="text-sm">
                  Fetch TMDB IDs for all Oscar nominations (movies and people)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={async () => {
                    setIsLoading("oscar-tmdb")
                    setResult(null)
                    try {
                      console.log("[v0] Starting TMDB population...")
                      const response = await fetch("/api/oscar-nominations/populate-tmdb", {
                        method: "POST",
                      })
                      console.log("[v0] TMDB population response status:", response.status)
                      const data = await response.json()
                      console.log("[v0] TMDB population response:", data)
                      
                      let message = ""
                      if (response.ok && data.summary) {
                        message = `Updated: ${data.summary.updated}, Skipped: ${data.summary.skipped}, Not Found: ${data.summary.notFound}, Errors: ${data.summary.errors}`
                      } else {
                        message = data.error || "Failed to populate TMDB IDs"
                      }
                      
                      setResult({
                        success: response.ok,
                        message,
                      })
                    } catch (error) {
                      console.error("[v0] TMDB population error:", error)
                      setResult({
                        success: false,
                        message: error instanceof Error ? error.message : "Failed to populate TMDB IDs",
                      })
                    } finally {
                      setIsLoading(null)
                    }
                  }}
                  disabled={isLoading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading === "oscar-tmdb" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="mr-2 h-4 w-4" />
                  )}
                  Populate TMDB IDs
                </Button>
              </CardContent>
            </Card>

            {/* Parental Guide Import */}
            <Card className="bg-card border-border/50 ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                    <ShieldAlert className="h-4 w-4 text-purple-500" />
                  </div>
                  Import Parental Guide Data
                </CardTitle>
                <CardDescription className="text-sm">
                  Upload Kaggle IMDb Parental Guide CSV to populate content ratings
                  {pgStatsData?.totalCached ? (
                    <span className="block mt-1 text-accent">
                      Currently cached: {pgStatsData.totalCached.toLocaleString()} movies
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pgFile" className="text-sm text-muted-foreground">
                    CSV File
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="pgFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setPgFile(e.target.files?.[0] || null)}
                      className="h-10 bg-background file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                    />
                  </div>
                  {pgFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {pgFile.name} ({(pgFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                
                {isLoading === "parental-guide" && pgProgress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pgProgress.phase}</span>
                      <span>{pgProgress.current} / {pgProgress.total}</span>
                    </div>
                    <Progress value={(pgProgress.current / pgProgress.total) * 100} className="h-2" />
                  </div>
                )}
                
                <Button
                  onClick={handleParentalGuideImport}
                  disabled={isLoading !== null || !pgFile}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading === "parental-guide" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Import Parental Guide
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Get the CSV from{" "}
                  <a 
                    href="https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Kaggle IMDb Parental Guide Dataset
                  </a>
                </p>
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