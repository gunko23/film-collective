# Film Collective - Claude Code Implementation Guide

This guide contains all the prompts you need to implement the Film Collective redesign using Claude Code. Work through each section in order.

---

## Setup

First, add the design reference files to your project:

1. Create a `/designs` folder in your project root
2. Download and add these files from the Claude conversation:
   - `FILM-COLLECTIVE-DESIGN-SYSTEM.md`
   - `film-collective-sticky-tabs.jsx` (film detail reference)
   - `film-collective-navigation-pattern.jsx` (dashboard + collective reference)
   - `film-collective-dashboard-refined.jsx` (dashboard with icons reference)

---

## Phase 1: Design Tokens & Shared Components

### 1.1 Create Design Tokens

```
Read /designs/FILM-COLLECTIVE-DESIGN-SYSTEM.md and create a design tokens file at /lib/design-tokens.ts.

Include:
- colors object with: bg (#08080a), surface (#0f0f12), surfaceLight (#161619), cream (#f8f6f1), accent (#e07850), accentSoft (#d4a574), cool (#7b8cde)
- Typography scales
- Spacing scale
- Border radius values

Export everything as named exports.
```

### 1.2 Create Icon Components

```
Create an Icons component file at /components/ui/Icons.tsx.

Create these SVG icon components (all should accept color and size props, default size 24):

Navigation:
- Home (house outline)
- Search (magnifying glass)
- Collective (two overlapping circles representing people)
- Profile (person with circle head)
- Back (left arrow)
- ChevronDown

Actions:
- TonightsPick (sparkle/star burst with small dots)
- LogFilm (film reel/camera shape)
- Send (paper plane)
- Plus (dashed circle with plus)
- Bell (notification bell)
- Settings (gear with radiating lines)

Content:
- Chat (speech bubble with dots)
- Film (film strip rectangle)
- Info (circle with i)
- Users (two people)
- Insights (bar chart with dots)

Collective Types:
- Heart (for couples)
- Family (house shape)
- Trophy (trophy cup)
- Briefcase (work bag)

Use strokeWidth 1.5, strokeLinecap and strokeLinejoin round. No fills, just strokes.

Reference /designs/film-collective-dashboard-refined.jsx for exact SVG paths.
```

### 1.3 Create Shared UI Components

```
Create these shared components using our design tokens:

1. /components/ui/Button.tsx
   - Variants: primary (cream bg), secondary (transparent with border), ghost
   - Sizes: sm, md, lg
   - Full width option
   - Icon support (left or right)

2. /components/ui/Card.tsx
   - Background: surface color
   - Border: 1px solid cream at 6% opacity
   - Border radius: 16px default, 12px compact
   - Padding variants: default (20px), large (24px), compact (16px)

3. /components/ui/Avatar.tsx
   - Sizes: xs (28px), sm (32px), md (40px), lg (48px)
   - Accept backgroundColor prop
   - Circular shape
   - Optional image support

4. /components/ui/SectionLabel.tsx
   - Font size: 10px
   - Letter spacing: 0.12em
   - Uppercase
   - Color variants: muted (default), accent, cool

5. /components/ui/StarRating.tsx
   - 5 horizontal stars, no boxes/backgrounds
   - Filled color: accent, empty: cream at 20%
   - Scale to 1.1 when filled
   - Accept value, onChange, readOnly props
   - Font size: 32px for interactive, smaller sizes for display
```

---

## Phase 2: Layout Components

### 2.1 Mobile Bottom Navigation

```
Update /components/layout/MobileBottomNav.tsx

A fixed bottom navigation bar with 4 items:
- Home (Home icon)
- Search (Search icon)  
- Collectives (Collective icon)
- Profile (Profile icon)

Requirements:
- Fixed to bottom of viewport
- Background: surface color
- Border top: 1px solid cream at 8%
- Padding: 12px 20px 28px (extra bottom for home indicator)
- Icons are 22px
- Labels are 10px, font-weight 500
- Active state: accent color for icon and label
- Accept currentRoute prop to determine active state

Reference /designs/film-collective-navigation-pattern.jsx for the FooterNav component.
```

### 2.2 Collective Secondary Tab Bar

```
Create /components/layout/collective-tab-bar.tsx

A horizontal tab bar for use inside collective pages with tabs:
- Feed (Home icon)
- Chat (Chat icon)
- Films (Film icon)
- Insights (Insights icon)

Requirements:
- Horizontal scroll on mobile
- Each tab has icon (18px) + label
- Active tab has 2px accent bottom border
- Accept activeTab and onTabChange props
- Hide scrollbar but allow horizontal scroll

Reference the tab bar in /designs/film-collective-navigation-pattern.jsx CollectiveView.
```

### 2.3 Film Detail Sticky Header

```
Create /components/layout/FilmStickyHeader.tsx

A header component for film detail pages that becomes sticky when scrolling.

Contains:
1. Collective context bar:
   - Collective icon (28px in colored container)
   - Collective name
   - Chevron down for dropdown
   - Background: surface, border radius 10px

2. Tab bar with tabs:
   - Info (Info icon)
   - Discussion (Chat icon + message count badge)
   - Ratings (Users icon)

Props:
- collective: { name, icon, color }
- activeTab, onTabChange
- discussionCount
- isSticky: boolean (controls fixed positioning + shadow)

When isSticky is true:
- Position fixed, top 0 (or below status bar on mobile)
- Add bottom border and box shadow
- Background: bg color

Reference /designs/film-collective-sticky-tabs.jsx StickyHeader component.
```

---

## Phase 3: Mobile Pages

### 3.1 Mobile User Dashboard

```
update user-dashboard.tsx 

This is the logged-in user's home screen. Reference /designs/film-collective-navigation-pattern.jsx.

Structure:
1. Header
   - "Welcome back" small text + user's first name large
   - Notification bell button (with red dot if unread)
   - User avatar

2. Quick Stats Row (4 columns)
   - Movies count
   - Shows count
   - Collectives count
   - Average rating

3. Quick Actions (2 column grid)
   - Tonight's Pick (gradient background with accent)
   - Log a Film (surface background)
   - Each has icon in container + title + subtitle

4. Your Collectives (horizontal scroll)
   - Cards with: icon, name, member count, owner badge, unread badge
   - "Create new" card at end with dashed border
   - Hide scrollbar

5. Your Top 3 Films
   - 3 poster cards with rank badges
   - Rank 1 has accent background badge

6. Collective Activity
   - Filter tabs: All, Ratings, Discussions
   - Activity items with: avatar, text, stars (if rating), collective badge, time, poster thumbnail
   - "Load more" button

Include MobileBottomNav at bottom with Home active.
```

### 3.2 Mobile Collective Page

```
Update /app/(app)/collective/[id]/page.tsx

This design is for mobile only. We will add a desktop implementation next

Reference /designs/film-collective-navigation-pattern.jsx CollectiveView.

Structure:
1. Header
   - Back button
   - Settings button
   - Large collective icon + name + member count + role

2. CollectiveTabBar component

3. Tab Content:

Feed tab:
- Quick action buttons (Tonight's Pick, Start Discussion)
- Recent activity list

Chat tab:
- Messages list with avatars
- Messages have: avatar, username, time, bubble
- Input bar fixed above bottom nav

Films tab:
- Grid of film posters (3 columns)

Insights tab:
- Stats grid (Films Rated, Discussions, Avg Rating, Compatibility)
- Taste Match section with progress bars

Include MobileBottomNav with Collectives active.
```

### 3.3 Mobile Film Detail Page

```
Update /app/(app)/film/[id]/page.tsx

Reference /designs/film-collective-sticky-tabs.jsx

Key behavior: The collective dropdown and tabs become STICKY when user scrolls past the poster/title area.

Structure:
1. Hero gradient (200px) with:
   - Back button, More button (absolute positioned)
   - Poster overlapping bottom edge

2. Title section
   - Film name, year, genre, runtime

3. FilmStickyHeader component (collective dropdown + tabs)
   - Use scroll event to detect when this should become sticky
   - When sticky, render a fixed copy at top

4. Tab content:

Info tab:
- Star rating component (minimal style)
- Overview text
- Details (Director, Cast, Studio)
- Action buttons (Add to list, Share)

Discussion tab:
- Messages specific to this film
- Each message: avatar, username, time, bubble
- Your messages aligned right with accent background
- Input bar fixed above bottom nav

Ratings tab:
- Your rating (highlighted card)
- Other members' ratings
- Aggregate stats (collective avg, count rated)

Implement the sticky scroll behavior:
- Track scroll position
- When scrolled past the header placeholder, show fixed header
- Add padding to content to compensate for fixed header height

I would still love for the video to play in the banner of the film page. I want it to be subtle in the way it is currently implemented

Include MobileBottomNav.
```

---

## Phase 4: Desktop Pages

### 4.1 Desktop User Dashboard

```
Create desktop version of the dashboard (can be same file with responsive styles or separate component).

Layout: Two-column with fixed left sidebar.

Left Sidebar (280px fixed):
- Logo at top
- User greeting + avatar
- Quick stats (vertical stack)
- Your Collectives list (vertical, not horizontal scroll)
- User profile section at bottom

Main Content Area:
- Quick Actions (larger cards, horizontal)
- Top 3 Films (larger posters)
- Collective Activity (wider cards, more info visible)

Use CSS Grid or Flexbox. On screens < 1024px, fall back to mobile layout.
```

### 4.2 Desktop Collective Page

```
Create desktop version of collective page.

REference design/desktop-collective-page.jsx for all design guidance

Layout: Fixed sidebar + main content with tab panels.

Left Sidebar (280px):
- Back to dashboard link
- Collective icon + name + details
- Members list with avatars
- Settings link

Main Content:
- Tab bar at top (horizontal, not scrolling)
- Content area below

Chat should be full height of content area with input at bottom.
Films should be a larger grid (4-5 columns).
Insights should have charts/graphs laid out horizontally.
```

### 4.3 Desktop Film Detail Page

```
Create desktop version of film detail page.

Layout: Centered content container (max-width ~900px) with header area.

Hero Section:
- Larger poster on left
- Title, info, rating on right
- Two-column layout

Below Hero:
- Collective dropdown + tabs (sticky behavior same as mobile)

Content Tabs:
- Discussion shows larger message bubbles
- Ratings shows members in a horizontal row or grid
- Info shows more metadata

The sticky header behavior should work the same - dropdown + tabs stick to top when scrolling.
```

---

## Phase 5: Integration

### 5.1 Routing Setup

```
Set up routing for the new pages:

/dashboard - User's home (logged in)
/collective/[id] - Individual collective view
/collective/[id]/chat - Direct to chat tab (optional)
/film/[id] - Film detail page

Make sure authentication is required for dashboard and collective pages.
```

### 5.2 State Management

```
Set up state/context for:

1. Active Collective Context
   - Currently selected collective
   - Used on film detail page to scope discussions/ratings

2. User Context
   - User's collectives list
   - User's stats
   - Notification count

Consider using React Context or your existing state management solution.
```

### 5.3 API Integration

```
Connect the UI to your existing API endpoints:

- Fetch user's collectives
- Fetch collective activity
- Fetch film discussions (scoped by collective)
- Fetch/post ratings
- Fetch/post messages

Replace mock data in components with real API calls.
```

---

## Quick Reference: Color Values

```typescript
const colors = {
  bg: '#08080a',
  surface: '#0f0f12', 
  surfaceLight: '#161619',
  cream: '#f8f6f1',
  accent: '#e07850',
  accentSoft: '#d4a574',
  cool: '#7b8cde',
};
```

## Quick Reference: Key Patterns

1. **Sticky Header on Film Page**: Use scroll event listener, track offset of header placeholder, render fixed duplicate when scrolled past.

2. **Hidden Scrollbars**: 
```css
.hide-scroll::-webkit-scrollbar { display: none; }
.hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
```

3. **Elegant Scrollbars**:
```css
.elegant-scroll::-webkit-scrollbar { width: 4px; }
.elegant-scroll::-webkit-scrollbar-thumb { background: rgba(248,246,241,0.1); border-radius: 4px; }
```

4. **Star Rating**: No backgrounds on stars, just color change + scale transform on fill.

5. **Message Bubbles**: Your messages get accent background + align right, others get surface background + align left.

---

## Troubleshooting

If styles aren't applying:
- Make sure design tokens are imported
- Check that Tailwind config includes custom colors (if using Tailwind)

If sticky header flickers:
- Use requestAnimationFrame for scroll handling
- Consider using IntersectionObserver instead of scroll events

If horizontal scroll shows scrollbar:
- Add the hide-scroll class
- Make sure overflow-x: auto is set

---

Good luck with the implementation! Work through each phase methodically, testing as you go.
