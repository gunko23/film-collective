import { NextResponse } from "next/server"
import { getMovieWatchProviders } from "@/lib/tmdb/client"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tmdbId = Number.parseInt(id)

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const providers = await getMovieWatchProviders(tmdbId, "US")

    if (!providers) {
      return NextResponse.json({
        link: null,
        flatrate: [],
        rent: [],
        buy: [],
        ads: [],
      })
    }

    return NextResponse.json({
      link: providers.link || null,
      flatrate: (providers.flatrate || []).map(p => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
      })),
      rent: (providers.rent || []).map(p => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
      })),
      buy: (providers.buy || []).map(p => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
      })),
      ads: (providers.ads || []).map(p => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
      })),
    })
  } catch (error) {
    console.error("Error fetching watch providers:", error)
    return NextResponse.json({ error: "Failed to fetch watch providers" }, { status: 500 })
  }
}
