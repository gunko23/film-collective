import * as React from "react"
import { cn } from "@/lib/utils"

type MobileHeaderProps = {
  collectiveName?: string
  title: string
  right?: React.ReactNode
  className?: string
}

export function MobileHeader({ collectiveName, title, right, className }: MobileHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-page-x py-4", className)}>
      <div className="min-w-0">
        {collectiveName && (
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {collectiveName}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-cream truncate">{title}</h1>
      </div>
      {right && <div className="shrink-0 pt-1">{right}</div>}
    </header>
  )
}
