"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, MessageCircle, Heart, X, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { useNotificationStream } from "@/hooks/use-notification-stream"

interface Notification {
  id: string
  type: "comment" | "reaction" | "thread_reply" | "discussion" | "started_watching"
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  rating_id: string | null
  collective_id: string
  collective_name: string
  content: string | null
  media_type: string | null
  media_title: string | null
  media_poster: string | null
  is_read: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Emoji map for reactions
const emojiMap: Record<string, string> = {
  thumbsup: "\ud83d\udc4d",
  heart: "\u2764\ufe0f",
  laughing: "\ud83d\ude02",
  fire: "\ud83d\udd25",
  mindblown: "\ud83e\udd2f",
  party: "\ud83c\udf89",
}

const AVATAR_GRADIENTS: [string, string][] = [
  ["#ff6b2d", "#ff8f5e"],
  ["#3d5a96", "#6b8fd4"],
  ["#2a9d8f", "#5ec4b6"],
  ["#e07878", "#f0a0a0"],
  ["#7b6fa6", "#a99cd4"],
]

function getActorGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { unreadCount: streamUnreadCount, refresh: refreshStream } = useNotificationStream()

  // Only fetch full notification list when dropdown is open (no polling)
  const { data, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number; total: number }>(
    isOpen ? "/api/notifications?limit=10" : null,
    fetcher,
  )

  // Use stream count when dropdown is closed, fetched count when open
  const unreadCount = isOpen ? (data?.unreadCount ?? streamUnreadCount) : streamUnreadCount
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
      refreshStream()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "thread_reply":
        return <MessageCircle className="h-4 w-4 text-blue" />
      case "reaction":
        return <Heart className="h-4 w-4 text-rose" />
      case "discussion":
        return <MessageCircle className="h-4 w-4 text-violet-400" />
      case "started_watching":
        return <Bell className="h-4 w-4 text-green-400" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "discussion":
        return `/collectives/${notification.collective_id}?tab=chat`
      case "started_watching":
        return `/collectives/${notification.collective_id}`
      case "comment":
      case "thread_reply":
      case "reaction":
        return notification.rating_id
          ? `/collectives/${notification.collective_id}/conversation/${notification.rating_id}`
          : `/collectives/${notification.collective_id}`
      default:
        return `/collectives/${notification.collective_id}`
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "comment":
        return (
          <>
            <span className="font-medium text-cream">{notification.actor_name}</span> commented on your rating of{" "}
            <span className="font-medium text-cream">{notification.media_title}</span>
          </>
        )
      case "thread_reply":
        return (
          <>
            <span className="font-medium text-cream">{notification.actor_name}</span> replied in a thread on{" "}
            <span className="font-medium text-cream">{notification.media_title}</span>
          </>
        )
      case "reaction": {
        const emoji = emojiMap[notification.content || ""] || notification.content
        return (
          <>
            <span className="font-medium text-cream">{notification.actor_name}</span> reacted {emoji} to your rating of{" "}
            <span className="font-medium text-cream">{notification.media_title}</span>
          </>
        )
      }
      case "discussion":
        return (
          <>
            <span className="font-medium text-cream">{notification.actor_name}</span> sent a message in{" "}
            <span className="font-medium text-cream">{notification.collective_name}</span>
          </>
        )
      case "started_watching":
        return (
          <>
            <span className="font-medium text-cream">{notification.actor_name}</span> started watching{" "}
            <span className="font-medium text-cream">{notification.media_title}</span>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-9 w-9 rounded-[10px] border border-cream-faint/[0.08] hover:bg-cream/[0.03] transition-colors"
      >
        <Bell className="h-[18px] w-[18px] text-cream-faint" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-warm-black animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-cream-faint/[0.08] bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-faint/[0.06] bg-background/50">
            <h3 className="font-semibold text-cream">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-cream-faint hover:text-cream flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-cream-faint hover:text-cream">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-cream-faint">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const gradient = getActorGradient(notification.actor_name || "?")
                return (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead([notification.id])
                      }
                      setIsOpen(false)
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-cream/[0.02] transition-colors border-b border-cream-faint/[0.04] last:border-0 ${
                      !notification.is_read ? "bg-orange/[0.03]" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0" gradient={!notification.actor_avatar ? gradient : undefined}>
                      <AvatarImage src={notification.actor_avatar || undefined} />
                      <AvatarFallback>
                        {notification.actor_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-cream-muted leading-snug">{getNotificationText(notification)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getNotificationIcon(notification.type)}
                            <span className="text-xs text-cream-faint">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <span className="text-xs text-cream-faint">&middot; {notification.collective_name}</span>
                          </div>
                        </div>
                        {!notification.is_read && <div className="h-2 w-2 rounded-full bg-orange flex-shrink-0 mt-2" />}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-cream-faint/[0.06] px-4 py-2 bg-background/50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-orange hover:text-orange-light font-medium"
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
