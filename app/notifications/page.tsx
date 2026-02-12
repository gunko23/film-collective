"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"

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

const emojiMap: Record<string, string> = {
  thumbsup: "\u{1F44D}",
  heart: "\u2764\uFE0F",
  laughing: "\u{1F602}",
  fire: "\u{1F525}",
  mindblown: "\u{1F92F}",
  party: "\u{1F389}",
}

function CommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function getActionIcon(type: string) {
  switch (type) {
    case "comment":
    case "thread_reply":
    case "discussion":
      return <CommentIcon />
    case "reaction":
      return <HeartIcon />
    case "started_watching":
      return <PlayIcon />
    default:
      return <StarIcon />
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getTimeLabel(dateStr: string): "today" | "earlier" {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours < 24 ? "today" : "earlier"
}

function getPreviewText(notification: Notification): string {
  switch (notification.type) {
    case "comment":
    case "thread_reply":
      return notification.content
        ? `"${notification.content}"`
        : notification.media_title
          ? `Commented on ${notification.media_title}`
          : "Left a comment"
    case "reaction": {
      const emoji = emojiMap[notification.content || ""] || notification.content || ""
      return notification.media_title
        ? `Reacted ${emoji} to ${notification.media_title}`
        : `Reacted ${emoji}`
    }
    case "discussion":
      return notification.content
        ? `"${notification.content}"`
        : "Sent a message"
    case "started_watching":
      return notification.media_title
        ? `Started watching ${notification.media_title}`
        : "Started watching"
    default:
      return ""
  }
}

function getActionVerb(type: string): string {
  switch (type) {
    case "comment":
    case "thread_reply":
    case "discussion":
      return " in "
    case "reaction":
      return " in "
    case "started_watching":
      return " in "
    default:
      return " in "
  }
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

  // Auto-mark all as read when page loads with unread notifications
  const hasMarkedRef = useRef(false)
  useEffect(() => {
    if (unreadCount > 0 && !hasMarkedRef.current) {
      hasMarkedRef.current = true
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
        .then(() => {
          mutate()
          window.dispatchEvent(new Event("notifications-read"))
        })
        .catch((err) => console.error("Error auto-marking notifications as read:", err))
    }
  }, [unreadCount, mutate])

  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationIds ? { notificationIds } : { markAll: true }),
      })
      mutate()
      window.dispatchEvent(new Event("notifications-read"))
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }, [mutate])

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

  // Group notifications by time
  const todayNotifications = notifications.filter((n) => getTimeLabel(n.created_at) === "today")
  const earlierNotifications = notifications.filter((n) => getTimeLabel(n.created_at) === "earlier")

  const renderGroup = (label: string, items: Notification[], startIndex: number) => {
    if (items.length === 0) return null
    return (
      <div key={label}>
        {/* Group label */}
        <div className="flex items-center gap-2.5 px-6 mb-2.5" style={{ marginTop: startIndex > 0 ? 8 : 0 }}>
          <span
            className="text-[10px] uppercase font-semibold tracking-[0.14em]"
            style={{ color: "#504030" }}
          >
            {label}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.03), transparent)" }}
          />
        </div>

        {/* Notification items */}
        <div className="flex flex-col gap-0.5">
          {items.map((notification, i) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead([notification.id])
                }
              }}
              className="flex gap-3.5 px-6 py-3.5 relative transition-colors duration-200 hover:!bg-[#1a1714] sf-reveal"
              style={{
                background: !notification.is_read ? "#16120e" : "transparent",
                animationDelay: `${(startIndex + i) * 0.04}s`,
              }}
            >
              {/* Unread indicator dot */}
              {!notification.is_read && (
                <div
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#e8875a" }}
                />
              )}

              {/* Avatar with action badge */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-[42px] h-[42px] rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    background: notification.actor_avatar
                      ? "transparent"
                      : "linear-gradient(145deg, rgba(212,160,84,0.13), rgba(212,160,84,0.03))",
                    border: notification.actor_avatar
                      ? "none"
                      : "1px solid rgba(212,160,84,0.09)",
                  }}
                >
                  {notification.actor_avatar ? (
                    <img
                      src={notification.actor_avatar}
                      alt={notification.actor_name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-[13px] font-bold opacity-80"
                      style={{
                        color: "#d4a054",
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}
                    >
                      {getInitials(notification.actor_name)}
                    </span>
                  )}
                </div>

                {/* Action type badge */}
                <div
                  className="absolute -bottom-[5px] -right-[5px] w-5 h-5 rounded-md flex items-center justify-center"
                  style={{
                    background: "#0d0a08",
                    border: "1px solid rgba(255,255,255,0.04)",
                    color: "#706050",
                  }}
                >
                  {getActionIcon(notification.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <span
                    className="text-[13px] font-semibold leading-[1.35]"
                    style={{ color: !notification.is_read ? "#fff8f0" : "#b0a090" }}
                  >
                    {notification.actor_name}
                  </span>
                  <span
                    className="text-[13px] leading-[1.35]"
                    style={{ color: !notification.is_read ? "#908070" : "#605040" }}
                  >
                    {getActionVerb(notification.type)}
                  </span>
                  <span
                    className="text-[13px] font-semibold leading-[1.35]"
                    style={{ color: !notification.is_read ? "#e8875a" : "rgba(232,135,90,0.5)" }}
                  >
                    {notification.collective_name}
                  </span>
                </div>

                {/* Preview text */}
                <p
                  className="text-[12.5px] leading-[1.4] m-0 mb-1.5 truncate"
                  style={{
                    color: !notification.is_read ? "#807060" : "#504030",
                    fontStyle: (notification.type === "comment" || notification.type === "thread_reply" || notification.type === "discussion") ? "italic" : "normal",
                  }}
                >
                  {getPreviewText(notification)}
                </p>

                {/* Timestamp */}
                <span
                  className="text-[11px] tracking-[0.02em]"
                  style={{ color: "#403020" }}
                >
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: false })}
                </span>
              </div>

              {/* Chevron */}
              <div className="flex items-center self-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#302820" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[430px] mx-auto relative overflow-hidden pt-4 lg:pt-24 pb-36 lg:pb-12">
        {/* Ambient glow */}
        <div
          className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[400px] pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(232,135,90,0.02) 0%, transparent 60%)" }}
        />

        <div className="relative z-[2]">
          {/* Header */}
          <div className="px-6 pb-[18px]">
            <div className="flex items-center justify-between mb-[18px]">
              <div className="flex items-center gap-3.5">
                <Link
                  href="/"
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#706050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </Link>
                <h1
                  className="text-2xl font-bold m-0 tracking-[-0.025em]"
                  style={{
                    color: "#fff8f0",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  Notifications
                </h1>
              </div>

              {unreadCount > 0 && (
                <div
                  className="py-1 px-2.5 rounded-lg flex items-center gap-[5px]"
                  style={{
                    background: "rgba(232,135,90,0.08)",
                    border: "1px solid rgba(232,135,90,0.13)",
                  }}
                >
                  <div className="w-[5px] h-[5px] rounded-full" style={{ background: "#e8875a" }} />
                  <span
                    className="text-[11px] font-semibold tracking-[0.02em]"
                    style={{ color: "#e8875a" }}
                  >
                    {unreadCount} new
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5">
              {(["all", "unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilter(tab)
                    setPage(0)
                  }}
                  className="py-2 px-5 rounded-full text-[12px] capitalize tracking-[0.02em] transition-all duration-250"
                  style={{
                    border: filter === tab ? "1px solid rgba(232,135,90,0.19)" : "1px solid rgba(255,255,255,0.03)",
                    background: filter === tab ? "rgba(232,135,90,0.07)" : "transparent",
                    color: filter === tab ? "#e8875a" : "#605040",
                    fontWeight: filter === tab ? 600 : 500,
                  }}
                >
                  {tab}
                </button>
              ))}

              <div className="flex-1" />

              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="py-2 px-3.5 rounded-full text-[11px] font-medium tracking-[0.02em]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.03)",
                    background: "transparent",
                    color: "#504030",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px mx-6 mb-4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)" }}
          />

          {/* Notification content */}
          <div>
            {isLoading ? (
              <div className="px-6 py-16 text-center">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
                  style={{ borderColor: "rgba(232,135,90,0.3)", borderTopColor: "#e8875a" }}
                />
                <p className="text-[13px] m-0" style={{ color: "#504030" }}>
                  Loading...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#302820"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="mx-auto mb-3.5"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p
                  className="text-sm m-0"
                  style={{
                    color: "#504030",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  All caught up
                </p>
                <p className="text-[12px] m-0 mt-1.5" style={{ color: "#302820" }}>
                  {filter === "unread"
                    ? "No unread notifications"
                    : "Notifications will appear here when someone interacts with your ratings."}
                </p>
              </div>
            ) : (
              <>
                {renderGroup("Today", todayNotifications, 0)}
                {renderGroup("Earlier", earlierNotifications, todayNotifications.length)}
              </>
            )}
          </div>

          {/* Pagination */}
          {notifications.length > 0 && (total > limit) && (
            <div className="flex items-center justify-between mt-6 px-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="py-2 px-4 rounded-full text-[12px] font-medium tracking-[0.02em] disabled:opacity-30 transition-opacity"
                style={{
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "transparent",
                  color: "#706050",
                }}
              >
                Previous
              </button>
              <span className="text-[11px]" style={{ color: "#504030" }}>
                {page + 1} / {Math.ceil(total / limit) || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="py-2 px-4 rounded-full text-[12px] font-medium tracking-[0.02em] disabled:opacity-30 transition-opacity"
                style={{
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "transparent",
                  color: "#706050",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
