export function BackIcon({ color = "#e8e2d6", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FeedIcon({ color = "#e8e2d6", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19V9.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function ChatIcon({ color = "#e8e2d6", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11H8.01M12 11H12.01M16 11H16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function FilmIcon({ color = "#e8e2d6", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M2 8H22M2 16H22M6 4V20M18 4V20" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function InsightsIcon({ color = "#e8e2d6", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 20V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 20V6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="8" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="10" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="4" r="2" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function SearchIcon({ color = "#e8e2d6", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function PlusIcon({ color = "#6b6358", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function TonightsPickIcon({ color = "#ff6b2d", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" fill={color} opacity="0.6" />
    </svg>
  )
}

export function DiscussionIcon({ color = "#e8e2d6", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StarIcon({ filled = false, size = 12 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#ff6b2d" : "none"} stroke={filled ? "#ff6b2d" : "rgba(107,99,88,0.35)"} strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
