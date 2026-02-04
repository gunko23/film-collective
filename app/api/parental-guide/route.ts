import { NextResponse } from "next/server"
import { getParentalGuide, getParentalGuideBatch, getParentalGuideCacheStats, bulkInsertParentalGuide } from "@/lib/parental-guide/parental-guide-service"

/**
 * GET /api/parental-guide?tmdbId=123
 * 
 * Get parental guide data for a single movie from the cache
 * Returns 404 if not in cache (we don't fetch externally)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get("tmdbId")
  const stats = searchParams.get("stats")
  
  // Return cache statistics if requested
  if (stats === "true") {
    try {
      const cacheStats = await getParentalGuideCacheStats()
      return NextResponse.json(cacheStats)
    } catch (error) {
      console.error("Error fetching parental guide stats:", error)
      return NextResponse.json(
        { error: "Failed to fetch cache statistics" },
        { status: 500 }
      )
    }
  }
  
  if (!tmdbId) {
    return NextResponse.json(
      { error: "tmdbId is required" },
      { status: 400 }
    )
  }
  
  try {
    const result = await getParentalGuide(parseInt(tmdbId))
    
    if (!result) {
      return NextResponse.json(
        { error: "Parental guide data not found in cache" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching parental guide:", error)
    return NextResponse.json(
      { error: "Failed to fetch parental guide data" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/parental-guide
 * 
 * Two modes:
 * 1. Batch lookup: { movies: [{ tmdbId: 123 }, ...] }
 * 2. Import data:  { import: true, data: [{ tmdbId: 123, violence: "Moderate", ... }, ...] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Mode 1: Import parental guide data
    if (body.import && body.data) {
      const { data } = body
      
      if (!Array.isArray(data)) {
        return NextResponse.json(
          { error: "data must be an array" },
          { status: 400 }
        )
      }
      
      const result = await bulkInsertParentalGuide(data)
      
      return NextResponse.json({
        success: true,
        inserted: result.inserted,
        failed: result.failed,
      })
    }
    
    // Mode 2: Batch lookup
    const { movies } = body
    
    if (!movies || !Array.isArray(movies)) {
      return NextResponse.json(
        { error: "movies array is required" },
        { status: 400 }
      )
    }
    
    const results = await getParentalGuideBatch(movies)
    
    // Convert Map to object for JSON response
    const response: Record<number, any> = {}
    results.forEach((value, key) => {
      response[key] = value
    })
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in parental guide API:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}