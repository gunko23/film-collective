import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createTMDBClient } from "@/lib/tmdb/client"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("[v0] Starting TMDB population process...")
    const client = createTMDBClient()
    if (!client) {
      console.error("[v0] TMDB client not configured")
      return NextResponse.json({ error: "TMDB API not configured" }, { status: 500 })
    }

    // Get all nominations that need TMDB IDs or image paths
    const nominations = await sql`
      SELECT id, work_title, nominee, film_nomination, tmdb_movie_id, tmdb_person_id, poster_path, profile_path
      FROM oscar_nominations
      WHERE award_year = 2026
    `

    console.log(`[v0] Found ${nominations.length} nominations to process`)
    const results: { id: string; status: string; tmdb_id?: number }[] = []

    for (const nom of nominations) {
      const isFilm = nom.film_nomination as boolean
      const workTitle = nom.work_title as string
      const nominee = nom.nominee as string | null

      try {
        if (isFilm) {
          // If has movie ID but no poster path, fetch details to get the poster
          if (nom.tmdb_movie_id && !nom.poster_path) {
            console.log(`[v0] Fetching poster for existing movie ID: ${nom.tmdb_movie_id}`)
            const movieDetails = await client.getMovie(nom.tmdb_movie_id as number)
            await sql`
              UPDATE oscar_nominations 
              SET poster_path = ${movieDetails.poster_path}
              WHERE id = ${nom.id}
            `
            results.push({ id: nom.id as string, status: "updated", tmdb_id: nom.tmdb_movie_id as number })
            continue
          }
          
          // Skip if already has movie ID and poster path
          if (nom.tmdb_movie_id && nom.poster_path) {
            results.push({ id: nom.id as string, status: "skipped", tmdb_id: nom.tmdb_movie_id as number })
            continue
          }

          // Search for the movie
          console.log(`[v0] Searching TMDB for film: ${workTitle}`)
          const searchResult = await client.searchMovies(workTitle)
          
          if (searchResult.results.length > 0) {
            // Find best match - prefer 2024/2025 releases for Oscar 2026
            const match = searchResult.results.find(m => {
              const year = m.release_date ? new Date(m.release_date).getFullYear() : 0
              return year >= 2024 && year <= 2025
            }) || searchResult.results[0]

            console.log(`[v0] Found movie: ${match.title} (${match.id}) with poster: ${match.poster_path}`)
            await sql`
              UPDATE oscar_nominations 
              SET tmdb_movie_id = ${match.id},
                  poster_path = ${match.poster_path}
              WHERE id = ${nom.id}
            `
            results.push({ id: nom.id as string, status: "updated", tmdb_id: match.id })
          } else {
            console.log(`[v0] No TMDB results found for: ${workTitle}`)
            results.push({ id: nom.id as string, status: "not_found" })
          }
        } else {
          // If has person ID but no profile path, fetch details to get the profile
          if (nom.tmdb_person_id && !nom.profile_path) {
            console.log(`[v0] Fetching profile for existing person ID: ${nom.tmdb_person_id}`)
            const personDetails = await client.getPerson(nom.tmdb_person_id as number)
            await sql`
              UPDATE oscar_nominations 
              SET profile_path = ${personDetails.profile_path}
              WHERE id = ${nom.id}
            `
            results.push({ id: nom.id as string, status: "updated", tmdb_id: nom.tmdb_person_id as number })
            continue
          }
          
          // Skip if already has person ID and profile path
          if (nom.tmdb_person_id && nom.profile_path) {
            results.push({ id: nom.id as string, status: "skipped", tmdb_id: nom.tmdb_person_id as number })
            continue
          }

          // Search for the person
          if (nominee) {
            console.log(`[v0] Searching TMDB for person: ${nominee}`)
            const searchResult = await client.searchPerson(nominee)
            
            if (searchResult.results.length > 0) {
              // Get the most popular match
              const match = searchResult.results.sort((a, b) => b.popularity - a.popularity)[0]
              console.log(`[v0] Found person: ${match.name} (${match.id}) with profile: ${match.profile_path}`)

              await sql`
                UPDATE oscar_nominations 
                SET tmdb_person_id = ${match.id},
                    profile_path = ${match.profile_path}
                WHERE id = ${nom.id}
              `
              results.push({ id: nom.id as string, status: "updated", tmdb_id: match.id })
            } else {
              console.log(`[v0] No TMDB results found for person: ${nominee}`)
              results.push({ id: nom.id as string, status: "not_found" })
            }
          } else {
            results.push({ id: nom.id as string, status: "no_nominee" })
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250))
      } catch (error) {
        console.error(`Error processing nomination ${nom.id}:`, error)
        results.push({ id: nom.id as string, status: "error" })
      }
    }

    const updated = results.filter(r => r.status === "updated").length
    const skipped = results.filter(r => r.status === "skipped").length
    const notFound = results.filter(r => r.status === "not_found").length
    const errors = results.filter(r => r.status === "error").length

    console.log(`[v0] TMDB population complete: ${updated} updated, ${skipped} skipped, ${notFound} not found, ${errors} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        total: nominations.length,
        updated,
        skipped,
        notFound,
        errors
      },
      results
    })
  } catch (error) {
    console.error("Error populating TMDB IDs:", error)
    return NextResponse.json(
      { error: "Failed to populate TMDB IDs" },
      { status: 500 }
    )
  }
}
