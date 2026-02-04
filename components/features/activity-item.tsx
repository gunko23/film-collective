import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StarRating } from "@/components/ui/star-rating"

type ActivityItemProps = {
  userName: string
  userAvatar?: string | null
  action: string
  target?: string
  rating?: number | null
  timestamp: string
  onClick?: () => void
  className?: string
}

export function ActivityItem({
  userName,
  userAvatar,
  action,
  target,
  rating,
  timestamp,
  onClick,
  className,
}: ActivityItemProps) {
  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 w-full text-left p-3 rounded-xl transition-colors",
        onClick && "hover:bg-surface-hover cursor-pointer",
        className,
      )}
    >
      <Avatar size="sm">
        {userAvatar && <AvatarImage src={userAvatar} />}
        <AvatarFallback>{(userName || "?")[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{userName}</span>{" "}
          {action}
          {target && (
            <>
              {" "}
              <span className="font-semibold">{target}</span>
            </>
          )}
        </p>

        {rating != null && rating > 0 && (
          <div className="mt-1.5">
            <StarRating value={rating} readonly size="sm" />
          </div>
        )}

        <span className="block mt-1 text-[11px] text-muted-foreground">{timestamp}</span>
      </div>
    </Comp>
  )
}
