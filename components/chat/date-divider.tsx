import { cn } from "@/lib/utils"

export function formatDateLabel(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

export function shouldShowDateDivider(currentDate: string, previousDate: string | undefined): boolean {
  if (!previousDate) return true
  try {
    return new Date(currentDate).toDateString() !== new Date(previousDate).toDateString()
  } catch {
    return false
  }
}

interface DateDividerProps {
  dateString: string
  className?: string
}

export function DateDivider({ dateString, className }: DateDividerProps) {
  const label = formatDateLabel(dateString)
  if (!label) return null

  return (
    <div className={cn("flex items-center justify-center my-4", className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="px-3 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
