import { NextResponse } from "next/server"
import { bulkInsertParentalGuide } from "@/lib/parental-guide/parental-guide-service"
import { sql } from "@/lib/db"

const TMDB_API_KEY = process.env.TMDB_API_KEY

type ImportRow = {
  imdbId: string
  sexNudity: string
  violence: string
  profanity: string
  alcoholDrugsSmoking: string
  frighteningIntense: string
}

/**
 * POST /api/parental-guide/import
 * 
 * Accepts parsed CSV rows, looks up TMDB IDs server-side, and imports to database.
 * Skips any entries that already exist in the cache.
 */
export async function POST(request: Request) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured" },
      { status: 500 }
    )
  }

  try {
    const { rows } = await request.json() as { rows: ImportRow[] }

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "rows array is required" },
        { status: 400 }
      )
    }

    // First, check which IMDb IDs already exist in the cache
    const imdbIds = rows.map(r => r.imdbId).filter(Boolean)
    
    let existingImdbIds = new Set<string>()
    try {
      const existing = await sql`
        SELECT imdb_id FROM parental_guide_cache 
        WHERE imdb_id = ANY(${imdbIds})
      `
      existingImdbIds = new Set(existing.map((r: { imdb_id: string }) => r.imdb_id))
    } catch (e) {
      // Table might not exist yet, continue with empty set
    }

    // Filter out rows that already exist
    const newRows = rows.filter(r => !existingImdbIds.has(r.imdbId))
    const skipped = rows.length - newRows.length

    if (newRows.length === 0) {
      return NextResponse.json({
        success: true,
        processed: rows.length,
        skipped,
        found: 0,
        notFound: 0,
        inserted: 0,
        failed: 0,
      })
    }

    // Process only new rows - look up TMDB IDs in parallel (batches of 20)
    const LOOKUP_BATCH_SIZE = 20
    const entries: Array<{
      tmdbId: number
      imdbId: string
      sexNudity: string
      violence: string
      profanity: string
      alcoholDrugsSmoking: string
      frighteningIntense: string
    }> = []
    
    let notFound = 0
    let lookupErrors = 0

    for (let i = 0; i < newRows.length; i += LOOKUP_BATCH_SIZE) {
      const batch = newRows.slice(i, i + LOOKUP_BATCH_SIZE)
      
      // Parallel TMDB lookups for this batch
      const lookupPromises = batch.map(async (row) => {
        const imdbId = row.imdbId
        if (!imdbId) return null

        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
          )
          
          if (!res.ok) {
            if (res.status === 429) {
              // Rate limited - wait and retry once
              await new Promise(r => setTimeout(r, 1000))
              const retry = await fetch(
                `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
              )
              if (!retry.ok) return null
              const retryData = await retry.json()
              const movie = retryData.movie_results?.[0]
              return movie ? { ...row, tmdbId: movie.id } : null
            }
            return null
          }

          const data = await res.json()
          const movie = data.movie_results?.[0]
          return movie ? { ...row, tmdbId: movie.id } : null
        } catch {
          return null
        }
      })

      const results = await Promise.all(lookupPromises)
      
      for (const result of results) {
        if (result && result.tmdbId) {
          entries.push({
            tmdbId: result.tmdbId,
            imdbId: result.imdbId,
            sexNudity: result.sexNudity,
            violence: result.violence,
            profanity: result.profanity,
            alcoholDrugsSmoking: result.alcoholDrugsSmoking,
            frighteningIntense: result.frighteningIntense,
          })
        } else {
          notFound++
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + LOOKUP_BATCH_SIZE < newRows.length) {
        await new Promise(r => setTimeout(r, 100))
      }
    }

    // Now bulk insert all entries
    let inserted = 0
    let failed = 0
    
    if (entries.length > 0) {
      const result = await bulkInsertParentalGuide(entries)
      inserted = result.inserted
      failed = result.failed
    }

    return NextResponse.json({
      success: true,
      processed: rows.length,
      skipped,
      found: entries.length,
      notFound,
      inserted,
      failed,
    })
  } catch (error) {
    console.error("Error in parental guide import:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    )
  }
}