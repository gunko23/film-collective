"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Home,
  MessagesSquare,
  Film,
  Sparkles,
  BarChart3,
  ChevronDown,
  Check,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export type SidebarNav = "home" | "discussion" | "films" | "pick" | "insights"

type Collective = {
  id: string
  name: string
  member_count?: number
}

type Member = {
  id: string
  name: string | null
  avatar_url: string | null
}

type DesktopSidebarProps = {
  currentCollective: Collective
  collectives?: Collective[]
  onCollectiveChange?: (id: string) => void
  activeNav: SidebarNav
  onNavChange: (nav: SidebarNav) => void
  members: Member[]
  user: {
    name: string | null
    email: string | null
    avatarUrl: string | null
  }
  className?: string
}

const navItems: { value: SidebarNav; label: string; icon: typeof Home }[] = [
  { value: "home", label: "Home", icon: Home },
  { value: "discussion", label: "Discussion", icon: MessagesSquare },
  { value: "films", label: "Films", icon: Film },
  { value: "pick", label: "Tonight's Pick", icon: Sparkles },
  { value: "insights", label: "Insights", icon: BarChart3 },
]

function Logo() {
  return (
    <div className="relative size-9 shrink-0">
      <div className="absolute top-0 left-0 size-6 rounded-full border-2 border-accent" />
      <div className="absolute bottom-0 right-0 size-5 rounded bg-cool opacity-80" />
    </div>
  )
}

export function DesktopSidebar({
  currentCollective,
  collectives = [],
  onCollectiveChange,
  activeNav,
  onNavChange,
  members,
  user,
  className,
}: DesktopSidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownOpen])

  const displayedMembers = members.slice(0, 5)
  const remainingCount = Math.max(0, members.length - 5)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[260px] bg-surface border-r border-border flex flex-col z-40",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Logo />
        <span className="text-lg font-semibold tracking-tight text-cream">
          Film Collective
        </span>
      </div>

      {/* Collective Selector */}
      {collectives.length > 0 && (
        <div className="relative px-4 pb-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full gap-2 px-3.5 py-2.5 rounded-md bg-surface-light border border-foreground/10 text-sm font-medium text-foreground hover:border-accent/30 transition-colors"
          >
            <span className="truncate">{currentCollective.name}</span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground shrink-0 transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-4 right-4 mt-3 rounded-xl bg-surface-light border border-foreground/[0.08] p-2 shadow-card z-50">
              {collectives.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onCollectiveChange?.(c.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                    c.id === currentCollective.id
                      ? "bg-accent/15 text-accent"
                      : "text-foreground hover:bg-surface-hover",
                  )}
                >
                  <div className="text-left min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    {c.member_count != null && (
                      <div className="text-xs text-muted-foreground">
                        {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {c.id === currentCollective.id && <Check className="size-4 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ value, label, icon: Icon }) => {
          const isActive = activeNav === value
          return (
            <button
              key={value}
              onClick={() => onNavChange(value)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {label}
            </button>
          )
        })}

        {/* Members */}
        {members.length > 0 && (
          <div className="pt-6">
            <span className="block px-3 pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Members
            </span>
            <div className="space-y-0.5">
              {displayedMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
                >
                  <Avatar size="xs">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                    <AvatarFallback>
                      {(m.name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-secondary-foreground truncate">
                    {m.name || "Member"}
                  </span>
                </div>
              ))}
              {remainingCount > 0 && (
                <span className="block px-3 py-1.5 text-xs text-muted-foreground">
                  + {remainingCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback>
              {(user.name || user.email || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {user.name || "User"}
            </div>
            {user.email && (
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
