import { type NextRequest, NextResponse } from "next/server"
import { getSafeUser } from "@/lib/auth/auth-utils"
import { savePushSubscription, removePushSubscription } from "@/lib/push/push-service"

export async function POST(request: NextRequest) {
  const { user, error } = await getSafeUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 })
    }

    const result = await savePushSubscription(user.id, subscription)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in push subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getSafeUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 })
    }

    const result = await removePushSubscription(user.id, endpoint)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in push unsubscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
