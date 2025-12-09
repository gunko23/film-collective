import { NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"

// GET - Fetch current user data safely
export async function GET() {
  try {
    const { user, isRateLimited, error } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json(
        { user: null, isRateLimited: true, error: "Rate limited" },
        { status: 200 }, // Return 200 so client doesn't throw
      )
    }

    if (!user) {
      return NextResponse.json({ user: null, isRateLimited: false, error: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        primaryEmail: user.primaryEmail,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
      },
      isRateLimited: false,
      error: null,
    })
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    return NextResponse.json({ user: null, isRateLimited: false, error: "Auth error" }, { status: 200 })
  }
}
