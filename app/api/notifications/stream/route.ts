import type { NextRequest } from "next/server"
import { sql } from "@/lib/db"
import { getSafeUser } from "@/lib/auth/auth-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { user, error } = await getSafeUser()

  if (error || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userId = user.id

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`))

      // Function to check for new notifications
      const checkNotifications = async () => {
        try {
          const result = await sql`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ${userId} AND is_read = false
          `
          const unreadCount = Number.parseInt(result[0]?.count || "0")

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "update", unreadCount })}\n\n`))
        } catch (err) {
          console.error("SSE notification check error:", err)
        }
      }

      // Check immediately
      await checkNotifications()

      // Set up interval to check every 10 seconds (server-side, more efficient than client polling)
      const interval = setInterval(checkNotifications, 10000)

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
