import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { stackServerApp } from "@/stack"
// GET — fetch user's saved streaming services
export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await sql`
      SELECT provider_id, provider_name
      FROM user_streaming_services
      WHERE user_id = ${user.id}::uuid
      ORDER BY provider_name ASC
    `

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
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { providers } = body as { providers: { providerId: number; providerName: string }[] }

    if (!Array.isArray(providers)) {
      return NextResponse.json({ error: "providers must be an array" }, { status: 400 })
    }

    // Delete existing and insert new in one transaction via multiple statements
    await sql`DELETE FROM user_streaming_services WHERE user_id = ${user.id}::uuid`

    if (providers.length > 0) {
      for (const p of providers) {
        await sql`
          INSERT INTO user_streaming_services (user_id, provider_id, provider_name)
          VALUES (${user.id}::uuid, ${p.providerId}, ${p.providerName})
          ON CONFLICT (user_id, provider_id) DO NOTHING
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving streaming providers:", error)
    return NextResponse.json({ error: "Failed to save streaming providers" }, { status: 500 })
  }
}
