import { sql } from "@/lib/db"
import webpush from "web-push"

// Configure web-push with VAPID keys
// You need to generate these using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:notifications@filmcollective.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function savePushSubscription(userId: string, subscription: PushSubscriptionData) {
  try {
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (user_id, endpoint) 
      DO UPDATE SET 
        p256dh = ${subscription.keys.p256dh},
        auth = ${subscription.keys.auth},
        updated_at = NOW()
    `
    return { success: true }
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return { success: false, error }
  }
}

export async function removePushSubscription(userId: string, endpoint: string) {
  try {
    await sql`
      DELETE FROM push_subscriptions
      WHERE user_id = ${userId} AND endpoint = ${endpoint}
    `
    return { success: true }
  } catch (error) {
    console.error("Error removing push subscription:", error)
    return { success: false, error }
  }
}

export async function removeAllPushSubscriptions(userId: string) {
  try {
    await sql`
      DELETE FROM push_subscriptions WHERE user_id = ${userId}
    `
    return { success: true }
  } catch (error) {
    console.error("Error removing all push subscriptions:", error)
    return { success: false, error }
  }
}

export async function getUserPushSubscriptions(userId: string) {
  try {
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
    `
    return subscriptions
  } catch (error) {
    console.error("Error getting push subscriptions:", error)
    return []
  }
}

export async function sendPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    url?: string
    tag?: string
    notificationId?: string
  },
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping push notification")
    return { success: false, reason: "VAPID keys not configured" }
  }

  try {
    const subscriptions = await getUserPushSubscriptions(userId)

    if (subscriptions.length === 0) {
      return { success: false, reason: "No push subscriptions found" }
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
          return { success: true, endpoint: sub.endpoint }
        } catch (error: unknown) {
          // If subscription is expired/invalid, remove it
          const webPushError = error as { statusCode?: number }
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            await removePushSubscription(userId, sub.endpoint)
          }
          throw error
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    return { success: successful > 0, sent: successful, total: subscriptions.length }
  } catch (error) {
    console.error("Error sending push notification:", error)
    return { success: false, error }
  }
}

export async function sendPushNotificationToCollectiveMembers(
  collectiveId: string,
  senderUserId: string,
  payload: {
    title: string
    body: string
    url?: string
    tag?: string
  },
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping push notifications")
    return { success: false, reason: "VAPID keys not configured" }
  }

  try {
    // Get all collective members except the sender who have push subscriptions
    const subscriptions = await sql`
      SELECT DISTINCT ps.endpoint, ps.p256dh, ps.auth, ps.user_id
      FROM push_subscriptions ps
      JOIN collective_memberships cm ON cm.user_id = ps.user_id
      WHERE cm.collective_id = ${collectiveId}::uuid
        AND ps.user_id != ${senderUserId}::uuid
    `

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, reason: "No subscribers" }
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string; user_id: string }) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
          return { success: true, endpoint: sub.endpoint }
        } catch (error: unknown) {
          const webPushError = error as { statusCode?: number }
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            await removePushSubscription(sub.user_id, sub.endpoint)
          }
          throw error
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    return { success: true, sent: successful, total: subscriptions.length }
  } catch (error) {
    console.error("Error sending push notifications to collective:", error)
    return { success: false, error }
  }
}
