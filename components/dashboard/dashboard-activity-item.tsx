"use client"

import { useId } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { RatingStar, getStarFill } from "@/components/ui/rating-star"

// Deterministic gradient for user avatars based on name
const USER_GRADIENTS: [string, string][] = [
  ["#ff6b2d", "#ff8f5e"],
  ["#3d5a96", "#5a7cb8"],
  ["#4a9e8e", "#6bc4b4"],
  ["#c4616a", "#d88088"],
  ["#2e4470", "#5a7cb8"],
]

export function getUserGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_GRADIENTS[Math.abs(hash) % USER_GRADIENTS.length]
}

export type Activity = {
  activity_type: "rating" | "comment" | "reaction" | "discussion"
  activity_id: string
  created_at: string
  actor_id: string
  actor_name: string
  actor_avatar: string | null
  tmdb_id: number
  media_title: string
  poster_path: string | null
  media_type: "movie" | "tv"
  score: number | null
  content: string | null
  reaction_type: string | null
  collective_id: string
  collective_name: string
  rating_id: string
  target_user_name: string | null
}

const REACTION_EMOJI_MAP: Record<string, string> = {
  fire: "\uD83D\uDD25",
  heart: "\u2764\uFE0F",
  laughing: "\uD83D\uDE02",
  crying: "\uD83D\uDE22",
  mindblown: "\uD83E\uDD2F",
  clap: "\uD83D\uDC4F",
  thinking: "\uD83E\uDD14",
  angry: "\uD83D\uDE21",
  love: "\uD83D\uDE0D",
  thumbsup: "\uD83D\uDC4D",
}

export function DashboardActivityItem({ activity }: { activity: Activity }) {
  const router = useRouter()
  const baseId = useId()
  const gradient = getUserGradient(activity.actor_name || "U")

  const getDescription = () => {
    switch (activity.activity_type) {
      case "rating":
        return (
          <>
            <span className="text-cream-muted"> rated </span>
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      case "comment":
        return (
          <>
            <span className="text-cream-muted"> commented on </span>
            {activity.target_user_name && (
              <><span className="font-medium">{activity.target_user_name}&apos;s</span><span className="text-cream-muted"> review of </span></>
            )}
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      case "reaction":
        return (
          <>
            <span className="text-cream-muted">
              {" "}reacted {REACTION_EMOJI_MAP[activity.reaction_type || ""] || activity.reaction_type} to{" "}
            </span>
            {activity.target_user_name && (
              <><span className="font-medium">{activity.target_user_name}&apos;s</span><span className="text-cream-muted"> review of </span></>
            )}
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      case "discussion":
        return (
          <>
            <span className="text-cream-muted"> commented on </span>
            <span className="font-medium">{activity.media_title}</span>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Link
      href={`/collectives/${activity.collective_id}/movie/${activity.tmdb_id}/conversation`}
      className="flex gap-3.5 lg:gap-4 p-4 lg:p-5 bg-card rounded-[14px] border border-cream-faint/[0.05] mb-2.5 lg:mb-3 transition-all duration-300 hover:border-cream-faint/[0.12]"
    >
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/${activity.actor_id}`) }}
        className="cursor-pointer shrink-0"
      >
        <Avatar size="md" gradient={gradient}>
          <AvatarImage src={activity.actor_avatar || undefined} />
          <AvatarFallback>{activity.actor_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] lg:text-[15px] leading-[1.5] mb-1.5 lg:mb-2">
          <span className="font-medium">{activity.actor_name}</span>
          {getDescription()}
        </p>

        {activity.activity_type === "rating" && activity.score != null && activity.score > 0 && (
          <div className="flex gap-0.5 mb-1.5 lg:mb-2 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <RatingStar
                key={s}
                fill={getStarFill(s, activity.score! / 20)}
                size={14}
                filledColor="#ff6b2d"
                emptyColor="rgba(107,99,88,0.2)"
                uid={`dai-${baseId}-${s}`}
              />
            ))}
            <span className="text-xs lg:text-sm font-semibold ml-1" style={{ color: "#ff6b2d" }}>
              {(activity.score / 20).toFixed(1)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-surface-light rounded text-[11px] lg:text-xs text-cream-muted">
            {activity.collective_name}
          </span>
          <span className="text-[11px] lg:text-xs text-cream-faint">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {activity.poster_path && (
        <div className="relative w-11 h-[60px] lg:w-[52px] lg:h-[72px] rounded-lg overflow-hidden shrink-0 border border-cream-faint/[0.08]">
          <Image
            src={`https://image.tmdb.org/t/p/w92${activity.poster_path}`}
            alt={activity.media_title}
            fill
            className="object-cover"
          />
        </div>
      )}
    </Link>
  )
}
