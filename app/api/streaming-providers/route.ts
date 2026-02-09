import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { getUserStreamingProviders, setUserStreamingProviders } from "@/lib/streaming/streaming-service"

// GET — fetch user's saved streaming services
export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const rows = await getUserStreamingProviders(user.id)

    return NextResponse.json({
      providers: rows.map((r: any) => ({
        providerId: r.provider_id,
        providerName: r.provider_name,
      })),
    })
  } catch (error) {
    console.error("Error fetching streaming providers:", error)
    return NextResponse.json({ error: "Failed to fetch streaming providers" }, { status: 500 })
  }
}

// PUT — replace user's streaming services with a new set
export async function PUT(request: Request) {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Auth temporarily unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { providers } = body as { providers: { providerId: number; providerName: string }[] }

    if (!Array.isArray(providers)) {
      return NextResponse.json({ error: "providers must be an array" }, { status: 400 })
    }

    await setUserStreamingProviders(user.id, providers)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving streaming providers:", error)
    return NextResponse.json({ error: "Failed to save streaming providers" }, { status: 500 })
  }
}
