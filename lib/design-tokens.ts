// Film Collective Design Tokens
// Reference: /designs/FILM-COLLECTIVE-DESIGN-SYSTEM.md

export const colors = {
  // Backgrounds
  bg: "#08080a",
  surface: "#0f0f12",
  surfaceLight: "#161619",
  surfaceHover: "#1c1c20",

  // Text
  cream: "#f8f6f1",
  textSecondary: "rgba(248, 246, 241, 0.7)",
  textTertiary: "rgba(248, 246, 241, 0.5)",
  textMuted: "rgba(248, 246, 241, 0.4)",
  textSubtle: "rgba(248, 246, 241, 0.2)",

  // Accent colors
  accent: "#e07850",
  accentSoft: "#d4a574",
  cool: "#7b8cde",

  // Borders
  border: "rgba(248, 246, 241, 0.06)",
  borderLight: "rgba(248, 246, 241, 0.1)",
  borderAccent: "rgba(224, 120, 80, 0.25)",
} as const

export const typography = {
  fontFamily:
    '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

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
    light: 300,
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
  card: "0 20px 40px rgba(0, 0, 0, 0.4)",
  cardHover: "0 30px 60px rgba(0, 0, 0, 0.5)",
  poster: "0 20px 40px rgba(0, 0, 0, 0.4)",
  phone: "0 50px 100px rgba(0, 0, 0, 0.5)",
} as const

export const breakpoints = {
  mobile: "375px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1400px",
} as const
