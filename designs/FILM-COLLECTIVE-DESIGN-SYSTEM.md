# Film Collective - Design System & Implementation Guide

## Overview
This document contains the complete design specifications for Film Collective, a social film app focused on private groups and community discussion. Use this as a reference when implementing components.

---

## Design Tokens

### Colors
```typescript
const colors = {
  // Backgrounds
  bg: '#08080a',           // Main background - rich warm black
  surface: '#0f0f12',      // Card backgrounds
  surfaceLight: '#161619', // Elevated surfaces, inputs
  surfaceHover: '#1c1c20', // Hover states
  
  // Text
  cream: '#f8f6f1',        // Primary text
  textSecondary: 'rgba(248, 246, 241, 0.7)',   // 70% cream
  textTertiary: 'rgba(248, 246, 241, 0.5)',    // 50% cream
  textMuted: 'rgba(248, 246, 241, 0.4)',       // 40% cream
  textSubtle: 'rgba(248, 246, 241, 0.2)',      // 20% cream
  
  // Accent colors
  accent: '#e07850',       // Primary accent - warm coral/terracotta
  accentSoft: '#d4a574',   // Secondary accent - soft gold
  cool: '#7b8cde',         // Cool accent - soft periwinkle (used for interactive elements, links)
  
  // Borders
  border: 'rgba(248, 246, 241, 0.06)',
  borderLight: 'rgba(248, 246, 241, 0.1)',
  borderAccent: 'rgba(224, 120, 80, 0.25)',
}
```

### Typography
```typescript
const typography = {
  // Font family
  fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Font sizes
  xs: '10px',      // Labels, uppercase text
  sm: '12px',      // Secondary info, timestamps
  base: '14px',    // Body text, buttons
  md: '15px',      // Slightly larger body
  lg: '16px',      // Emphasized body
  xl: '18px',      // Section titles
  '2xl': '22px',   // Page titles (mobile)
  '3xl': '26px',   // Large titles
  '4xl': '32px',   // Hero text (mobile)
  '5xl': '44px',   // Hero headline (mobile)
  
  // Desktop hero sizes
  heroDesktop: 'clamp(52px, 6vw, 80px)',
  
  // Line heights
  tight: 0.95,
  snug: 1.1,
  normal: 1.4,
  relaxed: 1.6,
  
  // Letter spacing
  tighter: '-0.03em',
  tight: '-0.02em',
  normal: '0',
  wide: '0.1em',
  wider: '0.12em',
  widest: '0.2em',
  
  // Font weights
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}
```

### Spacing
```typescript
const spacing = {
  // Base unit: 4px
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  
  // Common patterns
  cardPadding: '20px',
  cardPaddingLarge: '24px',
  sectionGap: '24px',
  pageHorizontal: '20px',      // Mobile
  pageHorizontalDesktop: '48px', // Desktop
}
```

### Border Radius
```typescript
const borderRadius = {
  sm: '6px',
  md: '10px',
  lg: '12px',
  xl: '14px',
  '2xl': '16px',
  '3xl': '20px',
  '4xl': '24px',
  full: '100px',    // Pills, buttons
  circle: '50%',
}
```

### Shadows
```typescript
const shadows = {
  card: '0 20px 40px rgba(0, 0, 0, 0.4)',
  cardHover: '0 30px 60px rgba(0, 0, 0, 0.5)',
  poster: '0 20px 40px rgba(0, 0, 0, 0.4)',
  phone: '0 50px 100px rgba(0, 0, 0, 0.5)',
}
```

---

## Component Specifications

### 1. Logo
```
Structure:
- Container: 36x36px (desktop), 28x28px (mobile)
- Circle: positioned top-left, 24x24px (desktop) / 18x18px (mobile)
  - Border: 2px solid accent color
  - Background: transparent
- Square: positioned bottom-right, 20x20px (desktop) / 14x14px (mobile)
  - Background: cool color
  - Border radius: 4px (desktop) / 3px (mobile)
  - Opacity: 0.8
```

### 2. Button - Primary
```
Styles:
- Background: cream (#f8f6f1)
- Text color: bg (#08080a)
- Padding: 20px 40px (large), 18px 32px (medium), 14px 24px (small)
- Border radius: 100px (pill shape)
- Font size: 16px (large), 15px (medium), 14px (small)
- Font weight: 500
- Optional: Right arrow icon with 12px gap
```

### 3. Button - Secondary
```
Styles:
- Background: transparent
- Text color: cream
- Border: 1px solid rgba(248, 246, 241, 0.2)
- Padding: Same as primary
- Border radius: 100px
- Font size: Same as primary
- Font weight: 500
```

### 4. Card
```
Styles:
- Background: surface (#0f0f12)
- Border: 1px solid rgba(248, 246, 241, 0.06)
- Border radius: 16px (standard), 20px (large), 12px (compact)
- Padding: 20px (standard), 24px (large)
```

### 5. Section Label
```
Styles:
- Font size: 10px or 11px
- Letter spacing: 0.12em
- Text transform: uppercase
- Color: textMuted (40% cream) or accent/cool for emphasis
- Font weight: 500
- Margin bottom: 12-16px
```

### 6. Star Rating (Minimal Style)
```
Structure:
- Container: flexbox, centered, gap 12px
- Stars: 5 buttons
  - Font size: 32px
  - Character: ★
  - Padding: 8px
  - Colors:
    - Filled: accent (#e07850)
    - Empty: rgba(248, 246, 241, 0.2)
  - Hover/Active: scale(1.1)
  - Transition: all 0.15s ease

Behavior:
- Click to set rating
- Hover to preview rating
- Rating persists across all collectives (user's personal rating)
```

### 7. Collective Dropdown
```
Structure:
- Trigger button:
  - Background: surfaceLight
  - Border: 1px solid rgba(248, 246, 241, 0.1)
  - Border radius: 10px
  - Padding: 10px 14px
  - Contents: emoji + name + chevron icon
  
- Dropdown menu:
  - Background: surfaceLight
  - Border: 1px solid rgba(248, 246, 241, 0.08)
  - Border radius: 12px
  - Padding: 8px
  - Margin top: 12px
  
- Menu item:
  - Padding: 12px
  - Border radius: 8px
  - Active background: rgba(224, 120, 80, 0.15)
  - Contents: emoji + name + member count + checkmark (if selected)
```

### 8. Avatar
```
Styles:
- Sizes: 28px, 32px, 36px, 40px, 48px
- Shape: circle (border-radius: 50%)
- Background: member's assigned color
- Stacked avatars: margin-left: -8px to -12px, border: 2px solid surface color
```

### 9. Message Bubble
```
Styles:
- Background: surfaceLight
- Border radius: 12px (with 4px top-left for incoming)
- Padding: 10px 14px
- Username: 11px, semibold, 70% cream
- Message text: 13px, 90% cream, line-height 1.4
```

### 10. Film Poster Placeholder
```
Styles:
- Aspect ratio: 2:3 (width:height)
- Border radius: 6px (small), 10px (medium), 12px (large)
- Background: linear-gradient(135deg, accent 40%, cool 20%)
- Border: 1px solid rgba(248, 246, 241, 0.1)
```

---

## Page Layouts

### Mobile Landing Page Structure
```
1. Status Bar (system)
2. Navigation
   - Logo + name (left)
   - Sign in button (right)
3. Hero Section
   - Eyebrow: line + "Private film clubs" label
   - Headline: "Your space to talk film together."
   - Subhead: description paragraph
   - CTA buttons: Primary + Secondary stacked full-width
4. Social Proof
   - Stacked avatars + "2,400+ collectives talking film"
5. Discussion Preview Card
   - Collective header with emoji + name + "Private" badge
   - Recent discussion thread (2-3 messages)
   - Input hint bar
6. Features Section ("Your collective, your space")
   - 3 feature items with emoji icons
7. Tonight's Pick Section
   - Mini film cards with match percentages
8. Features Grid
   - 2x2 grid of feature tiles
9. Testimonial Card
   - Quote + attribution
10. Final CTA
    - Gradient card with headline + button
11. Footer
    - Links + copyright
```

### Mobile App Screen Structure
```
1. Status Bar
2. Screen Header
   - Collective name (small text)
   - Screen title (large)
   - Optional: avatar or action button
3. Content Area (scrollable)
4. Bottom Navigation
   - 4 tabs: Home, Chat, Pick, Insights
   - Icons + labels
   - Active state: accent color
```

### Film Detail Page Structure
```
1. Hero gradient area (280px)
   - Back button (top left)
   - More button (top right)
   - Poster (overlapping bottom)
2. Title section
   - Film name
   - Year, genre, runtime
   - Average rating across collectives
3. Your Rating (minimal stars)
4. Collective Switcher dropdown
5. Collective Ratings
   - Avatar + name + star rating for each member
6. Discussion
   - Message count
   - Recent messages preview
   - "Join discussion" button
7. Aggregate Stats
   - Friends seen, messages, avg rating
8. Action buttons
   - Add to list, Share
```

---

## Interactions & Animations

### Page Load
- Elements fade in and slide up
- Stagger: 0.1s between elements
- Duration: 0.8s
- Easing: cubic-bezier(0.16, 1, 0.3, 1)

### Hover States
- Buttons: subtle brightness increase
- Cards: slight lift or border color change
- Stars: scale(1.1)
- Links: color change to accent

### Light Effects (Desktop Landing)
- Ambient gradient follows mouse position
- Colors: accent at 12% opacity, cool at 8% opacity
- Transition: 0.5s ease

### Film Grain Overlay
- SVG noise texture
- Opacity: 2-3%
- Position: fixed, covers viewport
- Pointer-events: none

---

## Responsive Breakpoints
```typescript
const breakpoints = {
  mobile: '375px',   // Base mobile
  tablet: '768px',   // Tablet
  desktop: '1024px', // Desktop
  wide: '1400px',    // Wide desktop
}
```

---

## Implementation Notes

### For Next.js/React
1. Create a `design-tokens.ts` file with all colors, typography, spacing
2. Create shared components: Button, Card, Avatar, StarRating, CollectiveDropdown
3. Use CSS modules or Tailwind for styling
4. Consider using Framer Motion for animations

### File Structure Suggestion
```
/components
  /ui
    Button.tsx
    Card.tsx
    Avatar.tsx
    StarRating.tsx
    CollectiveDropdown.tsx
    SectionLabel.tsx
    MessageBubble.tsx
  /layout
    MobileNav.tsx
    DesktopSidebar.tsx
    PageHeader.tsx
  /features
    FilmCard.tsx
    FilmDetail.tsx
    DiscussionPreview.tsx
    TonightsPick.tsx
/styles
  design-tokens.ts
  globals.css
/pages (or /app)
  landing page
  app screens
```

### Key Patterns
1. **Collective Context**: Use React Context to manage active collective
2. **Rating State**: User's personal rating is separate from collective data
3. **Aggregate Stats**: Calculate from all collectives on the fly
4. **Discussion Scoping**: Filter by active collective

---

## Brand Voice

### Headlines
- Light weight (300-400)
- Mix of regular and italic
- Accent color on key words
- Casual, conversational

### Body Copy
- Friendly, approachable
- Focus on togetherness ("your people", "together", "shared")
- Avoid corporate speak

### Labels
- Uppercase, tracked out
- Very small (10-11px)
- Muted colors

---

This document should give Claude Code everything needed to implement the Film Collective design system accurately. Reference specific sections when asking for component implementations.
