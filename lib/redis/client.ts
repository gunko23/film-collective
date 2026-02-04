import { Redis } from "@upstash/redis"

// Main Redis client for regular operations
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Channel names for pub/sub
export const getDiscussionChannel = (collectiveId: string) => `discussion:${collectiveId}`
export const getTypingChannel = (collectiveId: string) => `typing:${collectiveId}`
export const getFeedTypingChannel = (ratingId: string) => `typing:feed:${ratingId}`
export const getMovieTypingChannel = (tmdbId: string, mediaType: string) => `typing:movie:${tmdbId}:${mediaType}`

// Pub/sub helper - stores messages in a list for SSE to pick up
export async function publishMessage(collectiveId: string, type: string, data: unknown) {
  const channel = getDiscussionChannel(collectiveId)
  const event = JSON.stringify({ type, data, timestamp: Date.now() })

  // Push to list and trim to keep only recent events (last 100)
  await redis.lpush(`${channel}:events`, event)
  await redis.ltrim(`${channel}:events`, 0, 99)
  // Set expiry on the list to auto-cleanup
  await redis.expire(`${channel}:events`, 300) // 5 minutes
}

export async function setTypingUser(collectiveId: string, userId: string, userName: string) {
  const channel = getTypingChannel(collectiveId)
  // Store typing user with 5 second expiry
  await redis.hset(`${channel}:users`, {
    [userId]: JSON.stringify({ user_id: userId, user_name: userName, timestamp: Date.now() }),
  })
  await redis.expire(`${channel}:users`, 10)
}

export async function removeTypingUser(collectiveId: string, userId: string) {
  const channel = getTypingChannel(collectiveId)
  await redis.hdel(`${channel}:users`, userId)
}

export async function getTypingUsers(collectiveId: string) {
  const channel = getTypingChannel(collectiveId)
  const users = await redis.hgetall(`${channel}:users`)
  if (!users) return []

  const now = Date.now()
  const activeUsers = []

  for (const [, value] of Object.entries(users)) {
    try {
      const user = typeof value === "string" ? JSON.parse(value) : value
      // Only return users who typed in the last 5 seconds
      if (now - user.timestamp < 5000) {
        activeUsers.push({ user_id: user.user_id, user_name: user.user_name })
      }
    } catch {
      // Skip invalid entries
    }
  }

  return activeUsers
}

// Generic channel-based typing helpers (for feed/movie threads)
export async function setTypingUserForChannel(channelKey: string, userId: string, userName: string) {
  await redis.hset(`${channelKey}:users`, {
    [userId]: JSON.stringify({ user_id: userId, user_name: userName, timestamp: Date.now() }),
  })
  await redis.expire(`${channelKey}:users`, 10)
}

export async function removeTypingUserForChannel(channelKey: string, userId: string) {
  await redis.hdel(`${channelKey}:users`, userId)
}

export async function getTypingUsersForChannel(channelKey: string) {
  const users = await redis.hgetall(`${channelKey}:users`)
  if (!users) return []

  const now = Date.now()
  const activeUsers = []

  for (const [, value] of Object.entries(users)) {
    try {
      const user = typeof value === "string" ? JSON.parse(value) : value
      if (now - user.timestamp < 5000) {
        activeUsers.push({ user_id: user.user_id, user_name: user.user_name })
      }
    } catch {
      // Skip invalid entries
    }
  }

  return activeUsers
}

export async function getRecentEvents(collectiveId: string, since: number) {
  const channel = getDiscussionChannel(collectiveId)
  const events = await redis.lrange(`${channel}:events`, 0, 49) // Get last 50 events

  if (!events || events.length === 0) return []

  return events
    .map((e) => {
      try {
        return typeof e === "string" ? JSON.parse(e) : e
      } catch {
        return null
      }
    })
    .filter((e) => e && e.timestamp > since)
    .reverse() // Oldest first
}
