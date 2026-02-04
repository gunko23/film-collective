"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, MessageCircle, Heart, CheckCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "comment" | "reaction"
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  rating_id: string
  collective_id: string
  collective_name: string
  content: string | null
  media_type: string
  media_title: string
  media_poster: string | null
  is_read: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const emojiMap: Record<string, string> = {
  thumbsup: "👍",
  heart: "❤️",
  laughing: "😂",
  fire: "🔥",
  mindblown: "🤯",
  party: "🎉",
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, mutate, isLoading } = useSWR<{ notifications: Notification[]; unreadCount: number; total: number }>(
    `/api/notifications?limit=${limit}&offset=${page * limit}${filter === "unread" ? "&unread=true" : ""}`,
    fetcher,
    { refreshInterval: 30000 },
  )

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const unreadCount = data?.unreadCount || 0
  const hasMore = (page + 1) * limit < total

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationIds ? { notificationIds } : { markAll: true }),
      })
      mutate()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "reaction":
        return <Heart className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    if (notification.type === "comment") {
      return (
        <>
          <span className="font-semibold">{notification.actor_name}</span> commented on your rating of{" "}
          <span className="font-semibold">{notification.media_title}</span>
          {notification.content && (
            <p className="text-muted-foreground mt-1 text-sm line-clamp-2">"{notification.content}"</p>
          )}
        </>
      )
    } else if (notification.type === "reaction") {
      const emoji = emojiMap[notification.content || ""] || notification.content
      return (
        <>
          <span className="font-semibold">{notification.actor_name}</span> reacted {emoji} to your rating of{" "}
          <span className="font-semibold">{notification.media_title}</span>
        </>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-24 pb-24 lg:pb-12">
      <Header />
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAsRead()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter("all")
              setPage(0)
            }}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter("unread")
              setPage(0)
            }}
          >
            Unread
          </Button>
        </div>

        {/* Notifications List */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {isLoading ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">No notifications</p>
              <p className="text-sm">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "Notifications will appear here when someone interacts with your ratings."}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => (
                <Link
                  key={notification.id}
                  href={`/collectives/${notification.collective_id}/conversation/${notification.rating_id}`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead([notification.id])
                    }
                  }}
                  className={`flex gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-0 ${
                    !notification.is_read ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={notification.actor_avatar || undefined} />
                      <AvatarFallback className="bg-accent/20 text-accent">
                        {notification.actor_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-card border border-border">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">{getNotificationText(notification)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-accent">{notification.collective_name}</span>
                    </div>
                  </div>
                  {!notification.is_read && <div className="h-3 w-3 rounded-full bg-accent flex-shrink-0 mt-1" />}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(total / limit) || 1}
            </span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
