"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useNotificationStream } from "@/hooks/use-notification-stream"

function HomeIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function SearchIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M16 16L20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CollectiveIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="10" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="15" cy="10" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M5 20C5 16.5 7 14 9 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 20C19 16.5 17 14 15 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21C13.37 21.62 12.71 22 12 22C11.29 22 10.63 21.62 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ProfileIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M5 20C5 16.13 8.13 13 12 13C15.87 13 19 16.13 19 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

type NavRoute = "home" | "search" | "collectives" | "notifications" | "profile"

const navItems: { route: NavRoute; label: string; href: string; Icon: typeof HomeIcon }[] = [
  { route: "home", label: "Home", href: "/", Icon: HomeIcon },
  { route: "search", label: "Search", href: "/discover", Icon: SearchIcon },
  { route: "collectives", label: "Collectives", href: "/collectives", Icon: CollectiveIcon },
  { route: "notifications", label: "Alerts", href: "/notifications", Icon: BellIcon },
  { route: "profile", label: "Profile", href: "/profile", Icon: ProfileIcon },
]

const ACTIVE_COLOR = "#e07850"
const INACTIVE_COLOR = "rgba(248,246,241,0.25)"

function getActiveRoute(pathname: string): NavRoute {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/discover")) return "search"
  if (pathname.startsWith("/collectives")) return "collectives"
  if (pathname.startsWith("/notifications")) return "notifications"
  if (pathname.startsWith("/profile")) return "profile"
  return "home"
}

export function MobileBottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { unreadCount } = useNotificationStream()
  const currentRoute = getActiveRoute(pathname)
  const [isTonightsPickActive, setIsTonightsPickActive] = useState(false)

  // Watch for Tonight's Pick tab activation via data attribute
  useEffect(() => {
    const checkTonightsPick = () => {
      setIsTonightsPickActive(document.body.hasAttribute("data-tonights-pick-active"))
    }

    // Check initially
    checkTonightsPick()

    // Use MutationObserver to watch for attribute changes
    const observer = new MutationObserver(checkTonightsPick)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-tonights-pick-active"]
    })

    return () => observer.disconnect()
  }, [])

  // Hide on Tonight's Pick flow and film details pages for fullscreen experience
  const shouldHide =
    pathname.includes("/tonights-pick") ||
    pathname.match(/^\/movies\/\d+$/) ||
    isTonightsPickActive

  if (shouldHide) {
    return null
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-foreground/[0.08] lg:hidden",
        className,
      )}
      style={{ padding: "12px 20px 28px" }}
    >
      <div className="flex justify-around">
        {navItems.map(({ route, label, href, Icon }) => {
          const isActive = currentRoute === route
          return (
            <Link
              key={route}
              href={href}
              className="relative flex flex-col items-center gap-1"
            >
              <div className="relative">
                <Icon color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR} size={22} />
                {route === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
