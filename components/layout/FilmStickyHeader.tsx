"use client"

import { cn } from "@/lib/utils"

export type FilmDetailTab = "info" | "discussion" | "ratings"

type Collective = {
  name: string
  icon: string
  color: string
}

type FilmStickyHeaderProps = {
  collective: Collective
  activeTab: FilmDetailTab
  onTabChange: (tab: FilmDetailTab) => void
  discussionCount?: number
  isSticky?: boolean
  onCollectiveClick?: () => void
  className?: string
}

type IconProps = { color: string; size?: number }

function InfoIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M3 20C3 16.5 5.5 14 9 14C12.5 14 15 16.5 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 14C17.5 14 19.5 15.8 20 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ACTIVE_ICON = "#e07850"
const INACTIVE_ICON = "rgba(248,246,241,0.25)"

const tabs: { id: FilmDetailTab; label: string; Icon: typeof InfoIcon }[] = [
  { id: "info", label: "Info", Icon: InfoIcon },
  { id: "discussion", label: "Discussion", Icon: ChatIcon },
  { id: "ratings", label: "Ratings", Icon: UsersIcon },
]

export function FilmStickyHeader({
  collective,
  activeTab,
  onTabChange,
  discussionCount,
  isSticky = false,
  onCollectiveClick,
  className,
}: FilmStickyHeaderProps) {
  return (
    <div
      className={cn(
        "bg-background z-50 transition-shadow duration-200",
        isSticky && "fixed top-0 left-0 right-0 border-b border-foreground/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {/* Collective context bar */}
      <div
        className={cn(
          "mx-5 flex items-center gap-2.5 px-3.5 py-2.5 bg-surface rounded-[10px] border border-foreground/[0.04] cursor-pointer",
          isSticky ? "my-3" : "mb-3",
        )}
        role="button"
        tabIndex={0}
        onClick={onCollectiveClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onCollectiveClick?.()
          }
        }}
      >
        <div
          className="size-7 rounded-lg flex items-center justify-center text-xs shrink-0"
          style={{ backgroundColor: `${collective.color}20` }}
        >
          <span style={{ fontSize: "14px" }}>{collective.icon}</span>
        </div>
        <p className="flex-1 text-[13px] font-medium text-cream truncate">{collective.name}</p>
        <ChevronDownIcon color="rgba(248,246,241,0.25)" size={18} />
      </div>

      {/* Tab bar */}
      <div className="px-5 border-b border-foreground/[0.08]">
        <div className="flex">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            const showBadge = id === "discussion" && discussionCount != null && discussionCount > 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-3 -mb-px border-b-2 transition-colors",
                  isActive
                    ? "border-accent text-cream"
                    : "border-transparent text-foreground/50 hover:text-foreground/70",
                )}
              >
                <Icon color={isActive ? ACTIVE_ICON : INACTIVE_ICON} size={16} />
                <span className={cn("text-[13px]", isActive ? "font-medium" : "font-normal")}>{label}</span>
                {showBadge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-[10px] text-[11px]",
                      isActive ? "bg-accent/20 text-accent" : "bg-surface-light text-foreground/50",
                    )}
                  >
                    {discussionCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
