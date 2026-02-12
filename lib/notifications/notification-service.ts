import { sql } from "@/lib/db"
import { sendPushNotification } from "@/lib/push/push-service"

interface CreateNotificationParams {
  userId: string // The user who will receive the notification
  actorId: string // The user who performed the action
  type: "comment" | "reaction" | "thread_reply" | "discussion" | "started_watching"
  ratingId?: string
  collectiveId: string
  content?: string // Comment text, emoji, or message preview
  mediaType?: string
  mediaTitle?: string
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
        ${userId}, ${actorId}, ${type}, ${ratingId || null}, ${collectiveId},
        ${content || null}, ${mediaType || null}, ${mediaTitle || null}, ${mediaPoster || null}
      )
      RETURNING id
    `

    const notificationId = result[0]?.id

    let pushTitle: string
    let pushBody: string
    switch (type) {
      case "comment":
        pushTitle = "New Comment"
        pushBody = `${actorName} commented on your ${mediaTitle} rating: "${content?.substring(0, 50)}${(content?.length || 0) > 50 ? "..." : ""}"`
        break
      case "thread_reply":
        pushTitle = "New Reply"
        pushBody = `${actorName} replied in a thread on ${mediaTitle}: "${content?.substring(0, 50)}${(content?.length || 0) > 50 ? "..." : ""}"`
        break
      case "reaction":
        pushTitle = "New Reaction"
        pushBody = `${actorName} reacted ${content} to your ${mediaTitle} rating`
        break
      case "discussion":
        pushTitle = "New Message"
        pushBody = `${actorName}: ${content?.substring(0, 80)}${(content?.length || 0) > 80 ? "..." : ""}`
        break
      case "started_watching":
        pushTitle = "Now Watching"
        pushBody = `${actorName} started watching ${mediaTitle}`
        break
      default:
        pushTitle = "Notification"
        pushBody = `${actorName} did something`
    }

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

export async function notifyCollectiveMembers(
  collectiveId: string,
  actorId: string,
  params: Omit<CreateNotificationParams, "userId" | "actorId" | "collectiveId">,
) {
  try {
    const members = await sql`
      SELECT user_id FROM collective_memberships
      WHERE collective_id = ${collectiveId}::uuid AND user_id != ${actorId}::uuid
    `
    for (const member of members) {
      await createNotification({
        userId: member.user_id,
        actorId,
        collectiveId,
        ...params,
      })
    }
  } catch (error) {
    console.error("Error notifying collective members:", error)
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

export async function getUserNotifications(
  userId: string,
  options: { limit: number; offset: number; unreadOnly: boolean }
): Promise<{ notifications: any[]; unreadCount: number; totalCount: number }> {
  const { limit, offset, unreadOnly } = options

  const notifications = unreadOnly
    ? await sql`
        SELECT
          n.*,
          u.name as actor_name,
          u.avatar_url as actor_avatar,
          c.name as collective_name
        FROM notifications n
        JOIN users u ON u.id = n.actor_id
        JOIN collectives c ON c.id = n.collective_id
        WHERE n.user_id = ${userId} AND n.is_read = FALSE
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT
          n.*,
          u.name as actor_name,
          u.avatar_url as actor_avatar,
          c.name as collective_name
        FROM notifications n
        JOIN users u ON u.id = n.actor_id
        JOIN collectives c ON c.id = n.collective_id
        WHERE n.user_id = ${userId}
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

  const unreadCountResult = await sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ${userId} AND is_read = FALSE
  `

  const totalCountResult = await sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ${userId}
  `

  return {
    notifications,
    unreadCount: Number.parseInt(unreadCountResult[0]?.count || "0"),
    totalCount: Number.parseInt(totalCountResult[0]?.count || "0"),
  }
}

export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[],
  markAll?: boolean
): Promise<void> {
  if (markAll) {
    await sql`
      UPDATE notifications SET is_read = TRUE
      WHERE user_id = ${userId} AND is_read = FALSE
    `
  } else if (notificationIds && notificationIds.length > 0) {
    await sql`
      UPDATE notifications SET is_read = TRUE
      WHERE user_id = ${userId} AND id = ANY(${notificationIds}::uuid[])
    `
  }
}
