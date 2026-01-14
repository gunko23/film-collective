import { getRecentEvents, getTypingUsers } from "@/lib/redis/client"
import type { NextRequest } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

// Real-time SSE endpoint using Redis
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: collectiveId } = await params
  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get("since")

  const encoder = new TextEncoder()
  let isActive = true
  let lastEventTime = sinceParam ? Number.parseInt(sinceParam) : Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`))

      const checkForUpdates = async () => {
        if (!isActive) return

        try {
          // Get new events from Redis since last check
          const events = await getRecentEvents(collectiveId, lastEventTime)

          for (const event of events) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            if (event.timestamp > lastEventTime) {
              lastEventTime = event.timestamp
            }
          }

          // Get typing users
          const typingUsers = await getTypingUsers(collectiveId)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "typing", users: typingUsers, timestamp: Date.now() })}\n\n`,
            ),
          )

          // Send heartbeat
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch (error) {
          console.error("[SSE] Error checking Redis:", error)
          // Don't crash on errors, just skip this cycle
        }

        // Check every 500ms for near real-time experience
        if (isActive) {
          setTimeout(checkForUpdates, 500)
        }
      }

      // Start checking for updates
      checkForUpdates()

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        isActive = false
        controller.close()
      })
    },
    cancel() {
      isActive = false
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
