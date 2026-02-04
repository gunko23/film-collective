"use client"

import { cn } from "@/lib/utils"
import { Home, MessagesSquare, Sparkles, BarChart3 } from "lucide-react"

export type MobileNavTab = "home" | "chat" | "pick" | "insights"

type MobileNavProps = {
  activeTab: MobileNavTab
  onTabChange: (tab: MobileNavTab) => void
  className?: string
}

const tabs: { value: MobileNavTab; label: string; icon: typeof Home }[] = [
  { value: "home", label: "Home", icon: Home },
  { value: "chat", label: "Chat", icon: MessagesSquare },
  { value: "pick", label: "Pick", icon: Sparkles },
  { value: "insights", label: "Insights", icon: BarChart3 },
]

export function MobileNav({ activeTab, onTabChange, className }: MobileNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ value, label, icon: Icon }) => {
          const isActive = activeTab === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onTabChange(value)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-accent" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
