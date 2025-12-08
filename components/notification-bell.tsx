"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, MessageCircle, Heart, X, CheckCheck } from "lucide-react"
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

// Emoji map for reactions
const emojiMap: Record<string, string> = {
  thumbsup: "👍",
  heart: "❤️",
  laughing: "😂",
  fire: "🔥",
  mindblown: "🤯",
  party: "🎉",
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Poll every 30 seconds for new notifications
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number; total: number }>(
    "/api/notifications?limit=10",
    fetcher,
    { refreshInterval: 30000 },
  )

  const unreadCount = data?.unreadCount || 0
  const notifications = data?.notifications || []

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "reaction":
        return <Heart className="h-4 w-4 text-pink-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    if (notification.type === "comment") {
      return (
        <>
          <span className="font-medium">{notification.actor_name}</span> commented on your rating of{" "}
          <span className="font-medium">{notification.media_title}</span>
        </>
      )
    } else if (notification.type === "reaction") {
      const emoji = emojiMap[notification.content || ""] || notification.content
      return (
        <>
          <span className="font-medium">{notification.actor_name}</span> reacted {emoji} to your rating of{" "}
          <span className="font-medium">{notification.media_title}</span>
        </>
      )
    }
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/collectives/${notification.collective_id}/conversation/${notification.rating_id}`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead([notification.id])
                    }
                    setIsOpen(false)
                  }}
                  className={`flex gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 ${
                    !notification.is_read ? "bg-accent/5" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={notification.actor_avatar || undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent text-sm">
                      {notification.actor_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-snug">{getNotificationText(notification)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getNotificationIcon(notification.type)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <span className="text-xs text-muted-foreground">• {notification.collective_name}</span>
                        </div>
                      </div>
                      {!notification.is_read && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2 bg-secondary/30">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-accent hover:text-accent/80 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
