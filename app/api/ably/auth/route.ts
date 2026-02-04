import { NextResponse } from "next/server"
import Ably from "ably"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"

export async function GET() {
  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail, user.displayName, user.profileImageUrl)

    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY! })
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: dbUser.id,
    })

    return NextResponse.json(tokenRequest)
  } catch (error) {
    console.error("Ably auth error:", error)
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 })
  }
}
