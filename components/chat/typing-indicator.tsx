import { cn } from "@/lib/utils"

interface TypingUser {
  user_id: string
  user_name: string
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  currentUserId: string
  className?: string
}

export function TypingIndicator({ typingUsers, currentUserId, className }: TypingIndicatorProps) {
  const others = typingUsers.filter(
    (u) => u.user_id.toLowerCase() !== currentUserId.toLowerCase()
  )

  if (others.length === 0) return null

  const names = others.map((u) => u.user_name).join(", ")
  const verb = others.length === 1 ? "is" : "are"

  return (
    <div className={cn("flex items-center gap-2 px-2", className)}>
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-card/50 border border-border/30">
        <div className="flex gap-0.5">
          <span
            className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground ml-1">
          {names} {verb} typing
        </span>
      </div>
    </div>
  )
}
