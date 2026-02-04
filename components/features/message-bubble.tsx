import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type MessageBubbleProps = {
  userName: string
  userAvatar?: string | null
  content: string
  timestamp?: string | null
  className?: string
}

export function MessageBubble({
  userName,
  userAvatar,
  content,
  timestamp,
  className,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <Avatar size="xs">
        {userAvatar && <AvatarImage src={userAvatar} />}
        <AvatarFallback>{(userName || "?")[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-secondary-foreground">
            {userName}
          </span>
          {timestamp && (
            <span className="text-[10px] text-muted-foreground">{timestamp}</span>
          )}
        </div>
        <div className="bg-surface-light rounded-xl rounded-tl px-3.5 py-2.5">
          <p className="text-[13px] leading-normal text-foreground/90 whitespace-pre-wrap break-words">
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}
