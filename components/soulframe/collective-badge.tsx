import { cn } from "@/lib/utils"

const GRADIENT_PAIRS: [string, string][] = [
  ["#ff6b2d", "#ff8f5e"], // orange
  ["#3d5a96", "#5a7cb8"], // blue
  ["#4a9e8e", "#6bc4b4"], // teal
  ["#c4616a", "#d88088"], // rose
  ["#2e4470", "#5a7cb8"], // muted blue
]

export function getCollectiveGradient(index: number): [string, string] {
  return GRADIENT_PAIRS[index % GRADIENT_PAIRS.length]
}

export function getCollectiveInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 28,
  md: 52,
  lg: 72,
}

type CollectiveBadgeProps = {
  name?: string
  initials?: string
  colors: [string, string]
  size?: number | "xs" | "sm" | "md" | "lg"
  className?: string
}

export function CollectiveBadge({ name, initials, colors, size = 40, className }: CollectiveBadgeProps) {
  const resolvedInitials = initials || (name ? getCollectiveInitials(name) : "?")
  const px = typeof size === "string" ? (SIZE_MAP[size] ?? 40) : size

  return (
    <div
      className={cn("shrink-0", className)}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: px * 0.34,
        color: "#0f0d0b",
        letterSpacing: "-0.02em",
        boxShadow: `0 3px 14px ${colors[0]}30`,
      }}
    >
      {resolvedInitials}
    </div>
  )
}
