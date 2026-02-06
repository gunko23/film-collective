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
    <div
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 0 18px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "rgba(107, 99, 88, 0.07)" }} />
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#6b6358",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: "rgba(107, 99, 88, 0.07)" }} />
    </div>
  )
}
