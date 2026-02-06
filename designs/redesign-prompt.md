# Film Collective — Soulframe Redesign Implementation Prompt

## Overview

Redesign the Film Collective app's visual layer across mobile and desktop. This is a **styling-only** refactor — no changes to routing, data fetching, state management, or business logic. Every existing feature should continue to work exactly as it does now, just with the updated design system applied.

The design direction is called **"Soulframe"** — a warm, cinematic, premium-minimal aesthetic. Think independent cinema meets modern design studio. Dark but not black, warm but not loud, minimal but not sterile.

---

## Color Palette

Replace the current color system with these exact values. Define them as CSS variables (or Tailwind theme tokens if using Tailwind) so they're referenced consistently everywhere:

```
--bg:             #0f0d0b      /* Dark chocolate — primary background */
--bg-card:        #1a1714      /* Card/surface background */
--bg-card-hover:  #211e19      /* Card hover state */
--bg-elevated:    #252119      /* Elevated surfaces, modals */
--blue:           #3d5a96      /* Primary blue accent */
--blue-muted:     #2e4470      /* Blue for subtle use */
--blue-light:     #5a7cb8      /* Blue for text on dark */
--blue-glow:      rgba(61,90,150,0.18)   /* Blue ambient glow */
--orange:         #ff6b2d      /* Primary orange accent */
--orange-muted:   #cc5624      /* Orange for subtle use */
--orange-light:   #ff8f5e      /* Orange for lighter contexts */
--orange-glow:    rgba(255,107,45,0.14)  /* Orange ambient glow */
--cream:          #e8e2d6      /* Primary text — replaces pure white everywhere */
--cream-muted:    #a69e90      /* Secondary text */
--cream-faint:    #6b6358      /* Tertiary text, borders, subtle UI */
--warm-black:     #0a0908      /* Deepest black, used for overlays */
--teal:           #4a9e8e      /* Tertiary accent */
--rose:           #c4616a      /* Tertiary accent */
```

**Critical:** There should be NO pure white (`#fff`) or pure black (`#000`) anywhere in the UI. All whites become `--cream` variants. All blacks become `--bg` or `--warm-black`.

---

## Typography

Use the **system font stack** everywhere. Remove any Google Fonts imports (Inter, Roboto, etc.):

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
```

### Type Scale & Weights

- **Large headings** (page titles, user name on dashboard): `font-size: 30-38px`, `font-weight: 700`, `letter-spacing: -0.03em`
- **Medium headings** (section card titles, collective names): `font-size: 16-21px`, `font-weight: 600`, `letter-spacing: -0.02em`
- **Section labels** (uppercase category headers like "YOUR COLLECTIVES", "RECENT ACTIVITY"): `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.16em`, `text-transform: uppercase`, `color: var(--cream-faint)`
- **Body text**: `font-size: 13-14px`, `font-weight: 400`, `line-height: 1.5`
- **Small labels** (timestamps, member counts, metadata): `font-size: 11-12px`, `color: var(--cream-faint)`
- **Tiny labels** (badges, tags): `font-size: 9-10px`, `letter-spacing: 0.1-0.14em`, `text-transform: uppercase`

**Do NOT use font-weight: 300 or 100 anywhere.** The lightest weight should be 400 for body text.

---

## Film Grain Overlay

Add a fixed full-screen SVG noise texture overlay on top of the entire app. This gives the UI a subtle film-stock feel:

```css
.grain-overlay {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.35;
  mix-blend-mode: overlay;
}
```

Place this as a top-level element in the app layout, above all content but with `pointer-events: none` so it doesn't block interaction. On desktop use `opacity: 0.35`, on mobile use `opacity: 0.4`.

---

## Ambient Light Leaks

Add 2-3 fixed-position radial gradient blurs per page to create warm ambient depth. These should be large (`200-350px`), heavily blurred (`filter: blur(60-80px)`), and very low opacity. Place them off-screen partially so they bleed in from the edges:

```css
.light-leak {
  position: fixed;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  filter: blur(65px);
  pointer-events: none;
}
```

Typical placement:
- **Orange glow**: top-right area, using `var(--orange-glow)`
- **Blue glow**: middle-left area, using `var(--blue-glow)`
- Optional **teal glow**: bottom area for pages with more content

These should NOT move or animate — they're static atmospheric elements.

---

## Card System

All cards (activity items, collective cards, stat cards, etc.) should follow this pattern:

```css
.card {
  background: var(--bg-card);
  border: 1px solid rgba(107, 99, 88, 0.05);  /* --cream-faint at ~5% */
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Card Accent Bars

Many cards have a thin gradient line across the top edge that adds color without being heavy:

```css
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, var(--accent-color), transparent);
  border-radius: 14px 14px 0 0;
}
```

The accent color varies by context:
- Collective cards: use the collective's assigned color
- Action cards: blue for "discover" actions, orange for "log/discuss" actions
- Stat cards: each stat gets its own accent (orange, blue, teal, rose)
- Taste/insight cards: blue-to-orange gradient

**Important:** Do NOT use `overflow: hidden` on cards unless absolutely necessary, as it clips text descenders on letters like g, y, p, q.

---

## Collective Identity System — Gradient Circle Monograms

Replace the current generic double-person emoji/icon above collective names with **gradient circle monograms**. Each collective gets:

1. A unique **color pair** assigned at creation (or from a preset list)
2. A **circle badge** with a gradient fill using those two colors
3. The collective's **initials** (1-2 characters) rendered in dark text centered inside

```css
.collective-badge {
  width: 40px;  /* varies by context: 34-56px */
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-1), var(--color-2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 34%;  /* relative to badge size */
  color: var(--bg);  /* dark text on gradient */
  letter-spacing: -0.02em;
  box-shadow: 0 3px 14px rgba(var(--color-1-rgb), 0.28);
}
```

### Preset Color Pairs

Cycle through these for collective badges and user avatars:

| Pair    | Color 1       | Color 2       |
|---------|---------------|---------------|
| Blue    | `#3d5a96`     | `#5a7cb8`     |
| Orange  | `#ff6b2d`     | `#ff8f5e`     |
| Teal    | `#4a9e8e`     | `#6bc4b4`     |
| Rose    | `#c4616a`     | `#d88088`     |
| Muted Blue | `#2e4470` | `#5a7cb8`     |

---

## User Avatars in Activity Feeds

Replace photo avatars in the activity feed with **solid gradient circles** using the same system as collective badges. Each user gets a color pair, and their initial is rendered in `font-weight: 700`, `color: var(--bg)` (dark on gradient).

The gradient circle should have a subtle colored `box-shadow`:
```css
box-shadow: 0 2px 12px rgba(var(--user-color-rgb), 0.22);
```

For actual profile photos (where available), keep the photo but add a subtle colored border:
```css
border: 1.5px solid rgba(var(--user-color-rgb), 0.3);
```

---

## Button / Action Card Design

### Quick Action Cards (Tonight's Pick, Start Discussion, etc.)

These should feel tappable and alive:

```css
.action-card {
  padding: 22px 18px;
  border-radius: 14px;
  background: linear-gradient(155deg, rgba(var(--accent-rgb), 0.08), var(--bg-card));
  border: 1px solid rgba(var(--accent-rgb), 0.14);
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-card:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--accent-rgb), 0.28);
  box-shadow: 0 8px 28px rgba(var(--accent-rgb), 0.12);
}
```

Each action card should include:
1. A **3px gradient accent bar** along the top edge
2. A **small circular icon** (28-34px) with a tinted background matching the accent color
3. The **title** in heading weight
4. A **subtitle** in muted text
5. A subtle **radial glow** in the top-right corner

The label above the title (e.g., "discover", "discuss") should be:
```css
font-size: 10px;
letter-spacing: 0.15em;
text-transform: uppercase;
color: var(--accent-color);
font-weight: 600;
```

---

## Tonight's Pick — Hero Card

On the dashboard, Tonight's Pick should be a **full-width hero card** (not a half-width action card). It spans the full content area and has:

- A left section with: blue "Tonight's Pick" label, heading text ("Not sure what to watch?"), description text, and a **pill-shaped CTA button** ("Find a film →")
- A right section with: **three stacked/fanned poster card placeholders** at slight rotations (-8°, -3°, +4°) suggesting discovery. The topmost card has a small play icon circle.
- Background: `linear-gradient(155deg, var(--blue) at 16% opacity, var(--bg-card) at 45%, var(--orange) at 6% opacity)`
- Border: `1px solid` blue at low opacity, brightens on hover
- Hover: lifts 2px with a blue glow shadow

### CTA Pill Button

```css
.cta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 22px;
  background: rgba(61, 90, 150, 0.1);
  border: 1px solid rgba(61, 90, 150, 0.16);
  font-size: 13px;
  font-weight: 500;
  color: var(--blue-light);
}
```

---

## Floating Action Button (FAB)

Add a persistent floating action button for "Log a Film" in the bottom-right corner:

```css
.fab {
  position: fixed;
  z-index: 1001;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--orange), var(--orange-light));
  box-shadow: 0 4px 20px rgba(255, 107, 45, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(255, 107, 45, 0.5), 0 0 0 8px rgba(255, 107, 45, 0.06);
}
```

- **Icon:** A white (actually `var(--warm-black)`) plus sign, `stroke-width: 2.5`
- **Mobile position:** `bottom: 90px; right: 24px` (above the bottom nav)
- **Desktop position:** `bottom: 32px; right: 32px`

Remove the existing "Log a Film" action card from the dashboard since the FAB handles this globally now.

---

## Filter Pills

Used for activity feed filters ("All", "Ratings", "Discussions"):

```css
.filter-pill {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-pill.active {
  background: rgba(61, 90, 150, 0.1);
  color: var(--blue-light);
  border: 1px solid rgba(61, 90, 150, 0.18);
}

.filter-pill.inactive {
  background: transparent;
  color: var(--cream-faint);
  border: 1px solid transparent;
}
```

---

## Star Ratings

Star ratings use filled `var(--orange)` for active stars and `var(--cream-faint)` at 20% opacity for inactive. Size is typically 13px. When a numeric rating appears next to stars, it should be in `color: var(--orange)`, `font-weight: 600`.

---

## Entrance Animations

All major content sections should **stagger in** on page load with a subtle fade-up:

```css
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Each successive section gets an additional `animation-delay` of `0.05-0.07s`. So the first section has no delay, the second has `0.06s`, the third `0.12s`, etc. This creates a cascading reveal effect.

---

## Dividers & Borders

- **Section dividers:** `linear-gradient(to right, rgba(var(--blue-rgb), 0.08), rgba(var(--orange-rgb), 0.06), transparent)` — height 1px
- **Card borders:** Always use `var(--cream-faint)` at very low opacity (5-10%)
- **Sidebar borders:** `1px solid rgba(var(--cream-faint-rgb), 0.03)` — barely visible
- **Never use solid visible borders.** Everything should be gradient or near-transparent.

---

## Owner / Role Badges

The "OWNER" badge on collectives should be tinted to the collective's accent color:

```css
.owner-badge {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--collective-accent-color);
  font-weight: 600;
}
```

On mobile (collective cards), it can optionally have a subtle border:
```css
border: 1px solid rgba(var(--collective-accent-rgb), 0.2);
border-radius: 4px;
padding: 3px 7px;
```

---

## Desktop-Specific Layout

### Top Navigation Bar
- Fixed at top, `height: 64px`
- Background: `var(--bg)` at `0.91` opacity with `backdrop-filter: blur(16px)`
- Bottom border: `1px solid rgba(var(--cream-faint-rgb), 0.05)`
- **Logo:** gradient-tinted icon (orange/blue) in a rounded square, plus "Film Collective" text with "BETA" subtitle in orange
- **Nav links:** Simple text, no icons. Active state gets a subtle `rgba(var(--cream-rgb), 0.03)` background with `border-radius: 10px`. Hover brightens text color.
- **Right side:** Settings and bell icons in soft bordered squares (`36x36px`, `border-radius: 10px`, background `rgba(var(--cream-rgb), 0.025)`). Bell has an orange notification dot. User avatar is a gradient circle monogram.

### Three-Column Grid
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  max-width: 1320px;
  margin: 0 auto;
  padding-top: 64px;  /* below fixed nav */
}
```

### Left Sidebar (260px)
- Sticky, `top: 64px`, `height: calc(100vh - 64px)`, `overflow-y: auto`
- Right border: `1px solid rgba(var(--cream-faint-rgb), 0.03)`
- Contains: User card (avatar + name + mini stats), collectives list, "Create collective" button, settings link at bottom
- Collectives are listed as **rows** (not cards): badge + name + member count + owner badge. Hover highlights the row.

### Center Column (flexible)
- `padding: 28px 36px`
- Contains: Page title + subtitle, Tonight's Pick hero card, activity filters, activity feed
- Activity items are **individual rounded cards** with padding, not flat rows with dividers

### Right Sidebar (300px)
- Sticky, same as left
- Left border: `1px solid rgba(var(--cream-faint-rgb), 0.03)`
- Contains: Top 3 Films list (rank circles + poster + title), Your Stats (2x2 grid), Recent Ratings list

### Custom Scrollbar (desktop only)
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(107, 99, 88, 0.12); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(107, 99, 88, 0.2); }
```

---

## Mobile-Specific Layout

### Sticky Top Navbar

The mobile app has a sticky top navbar that responds to scroll position. It starts transparent and transitions to a frosted glass background as the user scrolls down.

**Default state (top of page):**
- `position: sticky; top: 0; z-index: 500`
- `background: transparent`
- No backdrop blur, no border
- Contains: logo icon (left), bell icon with notification dot + user avatar (right)
- Avatar is larger (44px)
- No brand text visible

**Scrolled state (user has scrolled > ~40px):**
- `background: var(--bg)` at ~0.91 opacity (`#0f0d0be8`)
- `backdrop-filter: blur(16px)`
- `border-bottom: 1px solid rgba(var(--cream-faint-rgb), 0.05)`
- "Film Collective" brand text fades/slides in next to the logo icon
- Avatar shrinks to 34px
- Padding compresses slightly

**Transition:** All properties animate with `0.35s cubic-bezier(0.16, 1, 0.3, 1)` for a smooth, responsive feel.

**Logo icon:** 32x32px rounded square with `border-radius: 9px`, gradient tinted background (`orange at 14%, blue at 10%`), containing a small film strip icon in orange.

The "Welcome back" / user name heading sits **below** the sticky navbar in the normal page flow, so it scrolls under the navbar naturally. The bell and avatar do NOT appear in the header area below — they live exclusively in the sticky nav.

### Bottom Navigation Bar
- Sticky at bottom, 5 items: Home, Search, Collectives, Alerts, Profile
- Background: `linear-gradient(to top, var(--bg), var(--bg) at 0.93 opacity, transparent)`
- `backdrop-filter: blur(14px)`
- Active item: full opacity, `var(--cream)` color, with a **small gradient bar** (16px wide, 2px tall, blue-to-orange gradient) positioned 8px above the icon
- Inactive items: `opacity: 0.4`, `var(--cream-muted)` color

### Mobile Cards
- Stats row: horizontal, typographic (large numbers with tiny uppercase labels), separated by faint gradient dividers
- Collectives: horizontal scroll of cards (not a vertical list like desktop)
- Top 3 Films: horizontal row of poster cards with rank watermarks

### Collective Detail Page Tabs
- Pill-style tabs (not underlined) on mobile: `border-radius: 22px`, active state has a gradient tinted background `linear-gradient(135deg, var(--blue) at 14%, var(--orange) at 8%)`
- Each tab has a small icon + text label
- Icons: house (Feed), chat bubble (Chat), film grid (Films), bar chart (Insights)

### Members Section (Collective Detail)
- Horizontal scroll of individual avatar circles with names underneath (not stacked overlapping circles)
- Each avatar uses the gradient circle style with the member's color pair
- Online members have a green dot indicator (`#4ade80`) positioned bottom-right with a 2px `var(--bg)` border
- Include a dashed "Invite" circle button at the end

---

## Hover & Interaction States

All interactive elements should use this easing: `cubic-bezier(0.16, 1, 0.3, 1)`

- **Cards:** Lift 2-3px on hover with a colored shadow
- **Nav items:** Background color shift, text color brightens
- **Buttons/CTAs:** Scale to 1.02-1.08 depending on importance
- **FAB:** Scale to 1.08 with an expanding ring shadow
- **Links ("View all", "Edit"):** Color shift only, no underline

Transition duration should be `0.25-0.4s` depending on the element. Larger elements (cards) use longer durations.

---

## Things to NOT Do

1. **No emojis** as UI elements (no sparkle emoji for Tonight's Pick, no people emoji for collectives)
2. **No pure white or pure black** anywhere
3. **No Inter, Roboto, or Google Fonts** — system fonts only
4. **No `overflow: hidden`** on text-containing cards (clips descenders)
5. **No solid/opaque colored backgrounds** on cards — always use low-opacity tints or gradients
6. **No thick borders** — all borders should be barely perceptible
7. **No flat gray backgrounds** — use the chocolate/warm tones
8. **No generic AI website aesthetic** — avoid purple gradients, glass-morphism overuse, or overly rounded bubbly elements

---

## Implementation Order

1. **Global styles first:** Color variables, font stack, grain overlay, light leaks
2. **Component primitives:** Card, Badge, Button, FilterPill, Stars, Avatar components
3. **Mobile dashboard** (Home screen)
4. **Mobile collective detail** page
5. **Desktop dashboard** (three-column layout)
6. **Desktop collective detail** page
7. **FAB** (global, responsive positioning)
8. **Entrance animations** (last, as polish)

Test on both mobile and desktop after each step. The design should feel cohesive across breakpoints — same colors, same type scale adjustments, same interaction patterns.
