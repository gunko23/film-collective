import { sql } from "@/lib/db"
import { sendPushNotification } from "@/lib/push/push-service"

interface CreateNotificationParams {
  userId: string // The user who will receive the notification
  actorId: string // The user who performed the action
  type: "comment" | "reaction"
  ratingId: string
  collectiveId: string
  content?: string // Comment text or emoji
  mediaType: string
  mediaTitle: string
  mediaPoster?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, actorId, type, ratingId, collectiveId, content, mediaType, mediaTitle, mediaPoster } = params

  // Don't notify yourself
  if (userId === actorId) {
    return null
  }

  try {
    // Get actor name for push notification
    const actorResult = await sql`SELECT name FROM users WHERE id = ${actorId}`
    const actorName = actorResult[0]?.name || "Someone"

    const result = await sql`
      INSERT INTO notifications (
        user_id, actor_id, type, rating_id, collective_id, 
        content, media_type, media_title, media_poster
      )
      VALUES (
        ${userId}, ${actorId}, ${type}, ${ratingId}, ${collectiveId},
        ${content || null}, ${mediaType}, ${mediaTitle}, ${mediaPoster || null}
      )
      RETURNING id
    `

    const notificationId = result[0]?.id

    const pushTitle = type === "comment" ? "New Comment" : "New Reaction"
    const pushBody =
      type === "comment"
        ? `${actorName} commented on your ${mediaTitle} rating: "${content?.substring(0, 50)}${(content?.length || 0) > 50 ? "..." : ""}"`
        : `${actorName} reacted ${content} to your ${mediaTitle} rating`

    // Send push notification (fire and forget - don't block)
    sendPushNotification(userId, {
      title: pushTitle,
      body: pushBody,
      url: `/collectives/${collectiveId}`,
      tag: `notification-${notificationId}`,
      notificationId,
    }).catch((err) => console.error("Push notification failed:", err))

    return result[0]
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

export async function getRatingOwner(ratingId: string, mediaType: string): Promise<string | null> {
  try {
    let result

    if (mediaType === "movie") {
      result = await sql`
        SELECT user_id FROM user_movie_ratings WHERE id = ${ratingId}
      `
    } else if (mediaType === "tv") {
      result = await sql`
        SELECT user_id FROM user_tv_show_ratings WHERE id = ${ratingId}
      `
    } else if (mediaType === "episode") {
      result = await sql`
        SELECT user_id FROM user_episode_ratings WHERE id = ${ratingId}
      `
    }

    return result?.[0]?.user_id || null
  } catch (error) {
    console.error("Error getting rating owner:", error)
    return null
  }
}

export async function getRatingMediaInfo(
  ratingId: string,
  mediaType: string,
): Promise<{ title: string; poster: string | null } | null> {
  try {
    if (mediaType === "movie") {
      const result = await sql`
        SELECT m.title, m.poster_path as poster
        FROM user_movie_ratings r
        JOIN movies m ON m.id = r.movie_id
        WHERE r.id = ${ratingId}
      `
      return result[0] || null
    } else if (mediaType === "tv") {
      const result = await sql`
        SELECT t.name as title, t.poster_path as poster
        FROM user_tv_show_ratings r
        JOIN tv_shows t ON t.id = r.tv_show_id
        WHERE r.id = ${ratingId}
      `
      return result[0] || null
    } else if (mediaType === "episode") {
      const result = await sql`
        SELECT CONCAT(t.name, ' - ', e.name) as title, e.still_path as poster
        FROM user_episode_ratings r
        JOIN tv_episodes e ON e.id = r.episode_id
        JOIN tv_shows t ON t.id = e.tv_show_id
        WHERE r.id = ${ratingId}
      `
      return result[0] || null
    }

    return null
  } catch (error) {
    console.error("Error getting rating media info:", error)
    return null
  }
}
