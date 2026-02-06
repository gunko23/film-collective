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
import { CollectiveBadge, getCollectiveGradient } from "@/components/soulframe/collective-badge"

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

const AVATAR_GRADIENTS: [string, string][] = [
  ["#ff6b2d", "#ff8f5e"],
  ["#3d5a96", "#6b8fd4"],
  ["#2a9d8f", "#5ec4b6"],
  ["#e07878", "#f0a0a0"],
  ["#7b6fa6", "#a99cd4"],
]

function getMemberGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
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
    <div
      className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
      style={{
        background: "linear-gradient(135deg, #ff6b2d, #3d5a96)",
        boxShadow: "0 4px 16px rgba(255,107,45,0.2)",
      }}
    >
      <Film className="h-[18px] w-[18px]" style={{ color: "#0f0d0b" }} />
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

  const userName = user.name || user.email || "U"
  const userGradient = getMemberGradient(userName)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[260px] bg-card border-r border-cream-faint/[0.05] flex flex-col z-40",
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
            className="flex items-center justify-between w-full gap-2 px-3.5 py-2.5 rounded-md bg-background border border-cream-faint/[0.08] text-sm font-medium text-cream hover:border-orange/30 transition-colors"
          >
            <span className="truncate">{currentCollective.name}</span>
            <ChevronDown
              className={cn(
                "size-4 text-cream-faint shrink-0 transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-4 right-4 mt-3 rounded-xl bg-card border border-cream-faint/[0.08] p-2 shadow-card z-50">
              {collectives.map((c, i) => {
                const gradient = getCollectiveGradient(i)
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onCollectiveChange?.(c.id)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                      c.id === currentCollective.id
                        ? "bg-orange/10 text-orange"
                        : "text-cream hover:bg-cream/[0.03]",
                    )}
                  >
                    <CollectiveBadge name={c.name} colors={gradient} size="xs" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium truncate">{c.name}</div>
                      {c.member_count != null && (
                        <div className="text-xs text-cream-faint">
                          {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    {c.id === currentCollective.id && <Check className="size-4 shrink-0 ml-2" />}
                  </button>
                )
              })}
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
                  ? "bg-orange/10 text-orange"
                  : "text-cream-faint hover:bg-cream/[0.03] hover:text-cream",
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
            <span className="block px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream-faint">
              Members
            </span>
            <div className="space-y-0.5">
              {displayedMembers.map((m) => {
                const memberName = m.name || "Member"
                const gradient = getMemberGradient(memberName)
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
                  >
                    <Avatar size="xs" gradient={!m.avatar_url ? gradient : undefined}>
                      {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                      <AvatarFallback>
                        {memberName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-cream-faint truncate">
                      {memberName}
                    </span>
                  </div>
                )
              })}
              {remainingCount > 0 && (
                <span className="block px-3 py-1.5 text-xs text-cream-faint">
                  + {remainingCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-cream-faint/[0.05] px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm" gradient={!user.avatarUrl ? userGradient : undefined}>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback>
              {userName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-medium text-cream truncate">
              {user.name || "User"}
            </div>
            {user.email && (
              <div className="text-xs text-cream-faint truncate">{user.email}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
