// Film Collective Design Tokens — Soulframe Design System

export const colors = {
  // Backgrounds
  bg: "#0f0d0b",
  surface: "#1a1714",
  surfaceLight: "#211e19",
  surfaceHover: "#252119",

  // Text
  cream: "#e8e2d6",
  textSecondary: "#a69e90",
  textTertiary: "#a69e90",
  textMuted: "#6b6358",
  textSubtle: "rgba(232, 226, 214, 0.2)",

  // Accent colors
  accent: "#ff6b2d",
  accentSoft: "#ff8f5e",
  cool: "#3d5a96",

  // Borders
  border: "rgba(107, 99, 88, 0.12)",
  borderLight: "rgba(107, 99, 88, 0.18)",
  borderAccent: "rgba(255, 107, 45, 0.25)",

  // Soulframe extended palette
  blue: "#3d5a96",
  blueMuted: "#2e4470",
  blueLight: "#5a7cb8",
  blueGlow: "rgba(61, 90, 150, 0.18)",
  orange: "#ff6b2d",
  orangeMuted: "#cc5624",
  orangeLight: "#ff8f5e",
  orangeGlow: "rgba(255, 107, 45, 0.14)",
  warmBlack: "#0a0908",
  teal: "#4a9e8e",
  rose: "#c4616a",
  creamMuted: "#a69e90",
  creamFaint: "#6b6358",
} as const

export const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif',

  fontSize: {
    xs: "10px",
    sm: "12px",
    base: "14px",
    md: "15px",
    lg: "16px",
    xl: "18px",
    "2xl": "22px",
    "3xl": "26px",
    "4xl": "32px",
    "5xl": "44px",
    heroDesktop: "clamp(52px, 6vw, 80px)",
  },

  lineHeight: {
    tight: 0.95,
    snug: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },

  letterSpacing: {
    tighter: "-0.03em",
    tight: "-0.02em",
    normal: "0",
    wide: "0.1em",
    wider: "0.12em",
    widest: "0.2em",
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export const spacing = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",

  cardPadding: "20px",
  cardPaddingLarge: "24px",
  sectionGap: "24px",
  pageHorizontal: "20px",
  pageHorizontalDesktop: "48px",
} as const

export const borderRadius = {
  sm: "6px",
  md: "10px",
  lg: "12px",
  xl: "14px",
  "2xl": "16px",
  "3xl": "20px",
  "4xl": "24px",
  full: "100px",
  circle: "50%",
} as const

export const shadows = {
  card: "0 4px 16px rgba(10, 9, 8, 0.3)",
  cardHover: "0 8px 28px rgba(10, 9, 8, 0.4)",
  poster: "0 20px 40px rgba(10, 9, 8, 0.4)",
  phone: "0 50px 100px rgba(10, 9, 8, 0.5)",
} as const

export const breakpoints = {
  mobile: "375px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1400px",
} as const
