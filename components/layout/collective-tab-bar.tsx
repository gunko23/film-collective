"use client"

import { cn } from "@/lib/utils"

export type CollectiveTab = "feed" | "chat" | "films" | "insights"

type CollectiveTabBarProps = {
  activeTab: CollectiveTab
  onTabChange: (tab: CollectiveTab) => void
  className?: string
}

type IconProps = { color: string; size?: number }

function HomeIcon({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function ChatIcon({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FilmIcon({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M2 8H22M2 16H22M6 4V20M18 4V20" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function InsightsIcon({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 20V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 20V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="8" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="10" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="4" r="2" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

const ACTIVE_ICON = "#e07850"
const INACTIVE_ICON = "rgba(248,246,241,0.25)"

const tabs: { id: CollectiveTab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "feed", label: "Feed", Icon: HomeIcon },
  { id: "chat", label: "Chat", Icon: ChatIcon },
  { id: "films", label: "Films", Icon: FilmIcon },
  { id: "insights", label: "Insights", Icon: InsightsIcon },
]

export function CollectiveTabBar({ activeTab, onTabChange, className }: CollectiveTabBarProps) {
  return (
    <div
      className={cn(
        "px-5 border-b border-foreground/[0.08]",
        className,
      )}
    >
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 whitespace-nowrap -mb-px border-b-2 transition-colors",
                isActive
                  ? "border-accent text-cream"
                  : "border-transparent text-foreground/50 hover:text-foreground/70",
              )}
            >
              <Icon color={isActive ? ACTIVE_ICON : INACTIVE_ICON} size={18} />
              <span className={cn("text-sm", isActive ? "font-medium" : "font-normal")}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
