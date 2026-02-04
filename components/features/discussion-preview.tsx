import * as React from "react"
import { cn } from "@/lib/utils"
import { MessagesSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/features/message-bubble"

type Message = {
  id: string
  userName: string
  userAvatar?: string | null
  content: string
  timestamp?: string | null
}

type DiscussionPreviewProps = {
  messages: Message[]
  messageCount?: number
  onJoin?: () => void
  className?: string
}

export function DiscussionPreview({
  messages,
  messageCount,
  onJoin,
  className,
}: DiscussionPreviewProps) {
  const displayMessages = messages.slice(0, 3)
  const count = messageCount ?? messages.length

  return (
    <Card padding="default" className={cn("gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-card">
        <SectionLabel>Discussion</SectionLabel>
        {count > 0 && (
          <span className="text-xs text-muted-foreground">
            {count} message{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages or empty state */}
      <div className="px-card">
        {displayMessages.length > 0 ? (
          <div className="space-y-3">
            {displayMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                userName={msg.userName}
                userAvatar={msg.userAvatar}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <MessagesSquare className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start the conversation</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {onJoin && (
        <div className="px-card">
          <Button variant="outline" size="sm" onClick={onJoin} className="w-full">
            Join discussion
          </Button>
        </div>
      )}
    </Card>
  )
}
