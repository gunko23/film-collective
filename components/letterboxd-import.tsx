"use client"

import { useState } from "react"
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type ImportResult = {
  success: boolean
  type: string
  summary: {
    total: number
    imported: number
    skipped: number
    notFound: number
    failed: number
  }
  errors?: string[]
}

export function LetterboxdImport() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [ratingsFile, setRatingsFile] = useState<File | null>(null)
  const [watchlistFile, setWatchlistFile] = useState<File | null>(null)
  const [importing, setImporting] = useState<"ratings" | "watchlist" | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (content: string): Array<Record<string, string>> => {
    const lines = content.split("\n")
    if (lines.length < 2) return []

    // Parse header row
    const headers = lines[0].split(",").map(h => 
      h.trim().replace(/^["']|["']$/g, "").toLowerCase().replace(/\s+/g, "")
    )

    const rows: Array<Record<string, string>> = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle CSV with quoted values
      const values: string[] = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ""))
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ""))

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }

    return rows
  }

  const handleImport = async (type: "ratings" | "watchlist") => {
    const file = type === "ratings" ? ratingsFile : watchlistFile
    if (!file) return

    setImporting(type)
    setError(null)
    setResult(null)
    setProgress({ current: 0, total: 0 })

    try {
      const content = await file.text()
      const rows = parseCSV(content)

      if (rows.length === 0) {
        throw new Error("No data found in CSV file")
      }

      setProgress({ current: 0, total: rows.length })

      // Map Letterboxd CSV columns to our format
      const data = rows.map(row => {
        if (type === "ratings") {
          return {
            name: row.name || row.title || row.film || "",
            year: row.year || row.releaseyear || "",
            letterboxdUri: row.letterboxduri || row.uri || "",
            rating: row.rating || row.yourrating || "",
            watchedDate: row.watcheddate || row.date || "",
            rewatch: row.rewatch || "",
          }
        } else {
          return {
            name: row.name || row.title || row.film || "",
            year: row.year || row.releaseyear || "",
            letterboxdUri: row.letterboxduri || row.uri || "",
          }
        }
      }).filter(item => item.name) // Filter out empty rows

      // Send to API in batches
      const BATCH_SIZE = 50
      let totalImported = 0
      let totalSkipped = 0
      let totalNotFound = 0
      let totalFailed = 0
      const allErrors: string[] = []

      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE)

        const res = await fetch("/api/user/import/letterboxd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data: batch }),
        })

        const batchResult = await res.json()

        if (!res.ok) {
          throw new Error(batchResult.error || "Import failed")
        }

        totalImported += batchResult.summary.imported
        totalSkipped += batchResult.summary.skipped
        totalNotFound += batchResult.summary.notFound
        totalFailed += batchResult.summary.failed
        
        if (batchResult.errors) {
          allErrors.push(...batchResult.errors)
        }

        setProgress({ current: Math.min(i + BATCH_SIZE, data.length), total: data.length })
      }

      setResult({
        success: true,
        type,
        summary: {
          total: data.length,
          imported: totalImported,
          skipped: totalSkipped,
          notFound: totalNotFound,
          failed: totalFailed,
        },
        errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined,
      })

      // Clear the file input
      if (type === "ratings") {
        setRatingsFile(null)
      } else {
        setWatchlistFile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden">
      {/* Header - Clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D735]/10">
            <svg viewBox="0 0 500 500" className="h-5 w-5" fill="#00D735">
              <path d="M250 500C111.929 500 0 388.071 0 250S111.929 0 250 0s250 111.929 250 250-111.929 250-250 250zm0-100c82.843 0 150-67.157 150-150S332.843 100 250 100s-150 67.157-150 150 67.157 150 150 150z"/>
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Import from Letterboxd</h3>
            <p className="text-sm text-muted-foreground">Sync your ratings and watchlist</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-6 border-t border-border/50 pt-4">
          {/* Instructions */}
          <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">How to export from Letterboxd:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to your Letterboxd profile</li>
              <li>Click Settings → Import & Export</li>
              <li>Click "Export Your Data"</li>
              <li>Download and unzip the file</li>
              <li>Upload <code className="px-1.5 py-0.5 rounded bg-background text-xs">ratings.csv</code> or <code className="px-1.5 py-0.5 rounded bg-background text-xs">watchlist.csv</code> below</li>
            </ol>
            <a
              href="https://letterboxd.com/settings/data/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent hover:underline mt-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Letterboxd Export Settings
            </a>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success message */}
          {result && (
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-sm space-y-2">
              <div className="flex items-center gap-2 text-accent font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Import Complete!
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>Total processed: <span className="text-foreground">{result.summary.total}</span></div>
                <div>Imported: <span className="text-accent">{result.summary.imported}</span></div>
                <div>Already existed: <span className="text-foreground">{result.summary.skipped}</span></div>
                <div>Not found: <span className="text-amber-500">{result.summary.notFound}</span></div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show movies not found ({result.errors.length})
                  </summary>
                  <ul className="mt-2 text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Import sections */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Ratings import */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Import Ratings
              </h4>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setRatingsFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-accent/10 file:text-accent
                    hover:file:bg-accent/20 file:cursor-pointer
                    file:transition-colors"
                />
                {ratingsFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {ratingsFile.name}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleImport("ratings")}
                disabled={!ratingsFile || importing !== null}
                className="w-full gap-2"
                variant="outline"
              >
                {importing === "ratings" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Ratings
                  </>
                )}
              </Button>
            </div>

            {/* Watchlist import */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Import Watchlist
              </h4>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setWatchlistFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-accent/10 file:text-accent
                    hover:file:bg-accent/20 file:cursor-pointer
                    file:transition-colors"
                />
                {watchlistFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {watchlistFile.name}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleImport("watchlist")}
                disabled={!watchlistFile || importing !== null}
                className="w-full gap-2"
                variant="outline"
              >
                {importing === "watchlist" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Watchlist
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {importing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing {importing}...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Note: Letterboxd ratings (0.5-5 stars) are converted to our 0-100 scale. 
            Movies not found on TMDB will be skipped.
          </p>
        </div>
      )}
    </div>
  )
}