import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { ensureUserExists } from "@/lib/db/user-service"
import {
  getMovieTypingChannel,
  setTypingUserForChannel,
  removeTypingUserForChannel,
  getTypingUsersForChannel,
} from "@/lib/redis/client"

type Props = {
  params: Promise<{ id: string; tmdbId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { tmdbId } = await params
  const { searchParams } = new URL(request.url)
  const mediaType = searchParams.get("mediaType") || "movie"

  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json([])
    }

    const channel = getMovieTypingChannel(tmdbId, mediaType)
    const allTypingUsers = await getTypingUsersForChannel(channel)

    // Exclude current user
    const typingUsers = allTypingUsers.filter(
      (u) => u.user_id.toLowerCase() !== user.id.toLowerCase()
    )

    return NextResponse.json(typingUsers)
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const { tmdbId } = await params

  try {
    const { user, isRateLimited } = await getSafeUser()

    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const body = await request.json()
    const { mediaType = "movie" } = body

    const channel = getMovieTypingChannel(tmdbId, mediaType)
    await setTypingUserForChannel(channel, dbUser.id, dbUser.name || "Someone")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing indicator:", error)
    return NextResponse.json({ error: "Failed to update typing" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { tmdbId } = await params

  try {
    const { user } = await getSafeUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get("mediaType") || "movie"

    const dbUser = await ensureUserExists(user.id, user.primaryEmail || "", user.displayName, user.profileImageUrl)

    const channel = getMovieTypingChannel(tmdbId, mediaType)
    await removeTypingUserForChannel(channel, dbUser.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing typing indicator:", error)
    return NextResponse.json({ error: "Failed to remove typing" }, { status: 500 })
  }
}
