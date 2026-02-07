export function BellIcon({ color = "#a69e90", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21C13.37 21.62 12.71 22 12 22C11.29 22 10.63 21.62 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronRightIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function PlayIcon({ color = "#3d5a96", size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l15 9-15 9V3z" />
    </svg>
  )
}

export function ArrowIcon({ color = "#5a7cb8", size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function PlusIcon({ color = "#6b6358", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
