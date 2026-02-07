// ── Soulframe Color Tokens ──
export const C = {
  bg: "#0f0d0b",
  bgCard: "#1a1714",
  bgCardHover: "#211e19",
  bgElevated: "#252119",
  blue: "#3d5a96",
  blueMuted: "#2e4470",
  blueLight: "#5a7cb8",
  blueGlow: "rgba(61,90,150,0.18)",
  orange: "#ff6b2d",
  orangeMuted: "#cc5624",
  orangeLight: "#ff8f5e",
  orangeGlow: "rgba(255,107,45,0.14)",
  cream: "#e8e2d6",
  creamMuted: "#a69e90",
  creamFaint: "#6b6358",
  creamSoft: "#8a8279",
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
  green: "#4ade80",
  purple: "#a78bfa",
  red: "#ef4444",
  yellow: "#facc15",
}

export const FONT_STACK = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif`

// ── SVG Noise texture for grain overlay ──
export const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

// ── Avatar gradient color pairs (unique per member, deterministic) ──
export const AVATAR_GRADIENT_PAIRS = [
  [C.orange, C.rose],
  [C.teal, C.blue],
  [C.purple, C.rose],
  [C.blue, C.teal],
  [C.rose, C.orangeMuted],
  [C.green, C.teal],
  [C.blueLight, C.purple],
  [C.orangeLight, C.yellow],
]

export function getAvatarGradient(name: string): [string, string] {
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_GRADIENT_PAIRS.length
  return AVATAR_GRADIENT_PAIRS[index] as [string, string]
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ── Content filter category colors ──
export const CONTENT_FILTER_COLORS: Record<string, string> = {
  Violence: C.red,
  "Sex/Nudity": C.rose,
  Language: C.purple,
  Substances: C.teal,
  "Frightening Scenes": C.blue,
}

// ── Result card accent bar colors (cycling) ──
export const RESULT_ACCENT_COLORS = [C.teal, C.orange, C.blue, C.rose, C.purple]
