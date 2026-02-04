# Film Collective - Implementation Checklist

Use this checklist with Claude Code to systematically implement the Film Collective design. Work through each phase in order — each builds on the previous.

---

## Phase 1: Foundation (Do First)

### 1.1 Design Tokens
```
Prompt for Claude Code:
"Read /designs/FILM-COLLECTIVE-DESIGN-SYSTEM.md and create a design tokens file at /lib/design-tokens.ts with all colors, typography, spacing, border radius, and shadows as TypeScript constants. Export everything."
```
- [ ] Colors object with all values
- [ ] Typography object (font sizes, weights, line heights, letter spacing)
- [ ] Spacing scale
- [ ] Border radius values
- [ ] Shadow values
- [ ] Breakpoints

### 1.2 Global Styles
```
Prompt for Claude Code:
"Update our global CSS to use the design tokens. Set the base background to bg color, default text to cream, and apply the font family. Add the film grain overlay as a global pseudo-element."
```
- [ ] Base background and text colors
- [ ] Font family applied
- [ ] CSS reset/normalize if needed
- [ ] Film grain texture overlay (optional, desktop only)

### 1.3 Tailwind Config (if using Tailwind)
```
Prompt for Claude Code:
"Extend our tailwind.config.js with the Film Collective design tokens. Add custom colors (bg, surface, surfaceLight, cream, accent, accentSoft, cool), custom font sizes, and spacing values."
```
- [ ] Custom colors added
- [ ] Custom spacing if needed
- [ ] Custom border radius values

---

## Phase 2: Core UI Components

### 2.1 Button Component
```
Prompt for Claude Code:
"Create a Button component at /components/ui/Button.tsx following the design system. Support variants: primary (cream bg), secondary (transparent with border), and ghost. Support sizes: sm, md, lg. Include optional icon support."
```
- [ ] Primary variant
- [ ] Secondary variant
- [ ] Ghost variant
- [ ] Size variants (sm, md, lg)
- [ ] Icon support (left or right)
- [ ] Loading state
- [ ] Disabled state

### 2.2 Card Component
```
Prompt for Claude Code:
"Create a Card component at /components/ui/Card.tsx. It should accept padding size (default, large, compact), optional border highlight color, and children. Use the surface background and standard border."
```
- [ ] Base card styles
- [ ] Padding variants
- [ ] Optional accent border

### 2.3 Avatar Component
```
Prompt for Claude Code:
"Update the Avatar component at /components/ui/Avatar.tsx. Support sizes: xs (28px), sm (32px), md (40px), lg (48px). Accept a color prop for the background. Support stacked avatars with a negative margin variant."
```
- [ ] Size variants
- [ ] Color prop
- [ ] Stacked/overlapping variant
- [ ] Optional image support
- [ ] Fallback to initials or color

### 2.4 Section Label Component
```
Prompt for Claude Code:
"Create a SectionLabel component at /components/ui/SectionLabel.tsx. It renders uppercase, tracked-out small text. Accept a color variant: muted (default), accent, or cool."
```
- [ ] Base styles (uppercase, letter-spacing, small size)
- [ ] Color variants

### 2.5 Star Rating Component
```
Prompt for Claude Code:
"Create a StarRating component at /components/ui/StarRating.tsx following the minimal style from the design system. Use 5 star buttons with no backgrounds/boxes. Filled stars are accent color, empty are 20% cream. Stars scale to 1.1 when filled. Support controlled value and onChange."
```
- [ ] 5 clickable stars
- [ ] Hover preview state
- [ ] Filled/empty color states
- [ ] Scale animation on filled
- [ ] Controlled component (value + onChange)
- [ ] Read-only variant for displaying others' ratings

---

## Phase 3: Layout Components

### 3.1 Mobile Navigation
```
Prompt for Claude Code:
"Create a MobileNav component at /components/layout/MobileNav.tsx. Fixed to bottom, 4 tabs: Home, Chat, Pick, Insights. Each tab has an icon and label. Active tab uses accent color. Use the surface background with top border."
```
- [ ] Fixed bottom positioning
- [ ] 4 tab items
- [ ] Active state styling
- [ ] Navigation handling (Next.js Link or router)

### 3.2 Desktop Sidebar
```
Prompt for Claude Code:
"Create a DesktopSidebar component at /components/layout/DesktopSidebar.tsx following the design system. Include: logo, collective selector dropdown, navigation items (Home, Discussion, Films, Tonight's Pick, Insights), members list, and user profile section at bottom."
```
- [ ] Logo
- [ ] Collective selector (dropdown)
- [ ] Navigation items with active states
- [ ] Members section
- [ ] User profile footer

### 3.3 Page Header (Mobile)
```
Prompt for Claude Code:
"Create a MobileHeader component for app screens. Shows collective name (small text above) and screen title (large). Optional right-side element (avatar or button)."
```
- [ ] Collective name (small, muted)
- [ ] Screen title (large)
- [ ] Optional right element slot

---

## Phase 4: Feature Components

### 4.1 Collective Dropdown
```
Prompt for Claude Code:
"Create a CollectiveDropdown component at /components/features/CollectiveDropdown.tsx. Shows current collective (emoji + name) as trigger. Dropdown lists all user's collectives with emoji, name, and member count. Selected collective has checkmark and highlighted background."
```
- [ ] Trigger button with current collective
- [ ] Dropdown panel with collective list
- [ ] Selection handling
- [ ] Close on outside click
- [ ] Keyboard accessibility

### 4.2 Film Card
```
Prompt for Claude Code:
"Create a FilmCard component at /components/features/FilmCard.tsx. Shows poster placeholder (gradient), title, year, and optional match percentage badge. Support sizes: small (for grids), medium (for lists)."
```
- [ ] Poster placeholder with gradient
- [ ] Title and year
- [ ] Match percentage badge (optional)
- [ ] Size variants
- [ ] Click handler

### 4.3 Message Bubble
```
Prompt for Claude Code:
"Create a MessageBubble component at /components/features/MessageBubble.tsx. Shows avatar, username, message text, and optional timestamp. Use surfaceLight background with asymmetric border radius."
```
- [ ] Avatar
- [ ] Username (small, semibold)
- [ ] Message text
- [ ] Timestamp (optional)
- [ ] Proper border radius

### 4.4 Discussion Preview
```
Prompt for Claude Code:
"Create a DiscussionPreview component that shows a card with: section label, message count, 2-3 recent messages using MessageBubble, and a 'Join discussion' button."
```
- [ ] Header with label and count
- [ ] Recent messages (2-3)
- [ ] Join discussion CTA
- [ ] Empty state

### 4.5 Activity Item
```
Prompt for Claude Code:
"Create an ActivityItem component for the home feed. Shows avatar, activity text (user + action + target), optional rating stars, and timestamp."
```
- [ ] Avatar
- [ ] Activity text with bold user/target
- [ ] Optional star rating display
- [ ] Timestamp

---

## Phase 5: Page Implementations

### 5.1 Mobile Landing Page
```
Prompt for Claude Code:
"Implement the mobile landing page at /app/page.tsx (or appropriate route). Reference /designs/film-collective-mobile-community.jsx for the structure. Use our design tokens and components. Include: nav, hero section, discussion preview card, features section, tonight's pick preview, testimonial, and CTA."
```
- [ ] Navigation bar
- [ ] Hero section with headline and CTAs
- [ ] Social proof (avatars + text)
- [ ] Discussion preview card
- [ ] "Your collective, your space" features
- [ ] Tonight's Pick section
- [ ] Features grid
- [ ] Testimonial
- [ ] Final CTA card
- [ ] Footer

### 5.2 Desktop Landing Page
```
Prompt for Claude Code:
"Implement the desktop landing page. Reference /designs/film-collective-desktop-landing.jsx. Include the ambient light effect that follows the mouse, larger typography, two-column layouts, and the floating film cards in the hero."
```
- [ ] Responsive layout (desktop-specific)
- [ ] Ambient light effect
- [ ] Hero with two columns
- [ ] Floating film cards
- [ ] Features section with sticky sidebar
- [ ] Tonight's Pick section
- [ ] Testimonials grid
- [ ] Final CTA

### 5.3 App Home Screen
```
Prompt for Claude Code:
"Implement the app home screen. Reference /designs/film-collective-mobile-app-screens.jsx (home section). Include: welcome header, stats row, recent activity feed, quick action cards, and members list."
```
- [ ] Welcome header with collective name
- [ ] Stats grid (4 items)
- [ ] Recent activity feed
- [ ] Quick action cards (Start discussion, Tonight's Pick)
- [ ] Members list

### 5.4 Discussion/Chat Screen
```
Prompt for Claude Code:
"Implement the discussion screen for mobile. Show the film being discussed at top, message thread in the middle (scrollable), and input bar fixed at bottom."
```
- [ ] Film context header
- [ ] Messages list (scrollable)
- [ ] Message input with send button
- [ ] Typing indicator (optional)

### 5.5 Tonight's Pick Screen
```
Prompt for Claude Code:
"Implement the Tonight's Pick flow. Two steps: 1) Select who's watching (member grid with checkboxes), 2) Select mood (pill buttons). Show recommendations when both are selected."
```
- [ ] Step 1: Member selection grid
- [ ] Step 2: Mood selection pills
- [ ] Submit button (disabled until complete)
- [ ] Recommendations list

### 5.6 Insights Screen
```
Prompt for Claude Code:
"Implement the Insights screen. Show: stats grid, taste compatibility section with progress bars, most discussed films (horizontal scroll), and top genres list."
```
- [ ] Stats grid (4 items)
- [ ] Taste compatibility cards with progress bars
- [ ] Most discussed films (horizontal scroll)
- [ ] Top genres list

### 5.7 Film Detail Page
```
Prompt for Claude Code:
"Implement the Film Detail page. Reference /designs/film-collective-detail-final.jsx. Include: hero with poster, title section, minimal star rating, collective dropdown, collective ratings, discussion preview, aggregate stats, and action buttons."
```
- [ ] Hero gradient with poster overlay
- [ ] Title, year, runtime, director
- [ ] Star rating component
- [ ] Collective dropdown
- [ ] Scoped ratings display
- [ ] Scoped discussion preview
- [ ] Aggregate stats bar
- [ ] Action buttons (Add to list, Share)

### 5.8 Onboarding Flow
```
Prompt for Claude Code:
"Implement the onboarding flow as a multi-step form. Reference /designs/film-collective-detail-onboarding.jsx. Steps: 1) Welcome, 2) Create or Join, 3) Name collective, 4) Set up taste (Letterboxd import or genre selection), 5) Success with invite link."
```
- [ ] Step 1: Welcome screen
- [ ] Step 2: Create/Join choice
- [ ] Step 3: Name input with suggestions
- [ ] Step 4: Letterboxd import OR genre selection
- [ ] Step 5: Success with share options
- [ ] Progress indicator
- [ ] Navigation (back/continue)

---

## Phase 6: Polish & Refinement

### 6.1 Animations
```
Prompt for Claude Code:
"Add page transition animations using Framer Motion. Elements should fade in and slide up with a stagger effect on page load."
```
- [ ] Page load animations
- [ ] Component enter/exit animations
- [ ] Micro-interactions (button presses, etc.)

### 6.2 Loading States
```
Prompt for Claude Code:
"Add skeleton loading states for: film cards, activity items, and discussion messages."
```
- [ ] Skeleton components
- [ ] Loading states for async data

### 6.3 Error States
```
Prompt for Claude Code:
"Add error state components and empty state illustrations for: no discussions, no ratings, no collectives."
```
- [ ] Error boundaries
- [ ] Empty states with illustrations
- [ ] Error messages

### 6.4 Responsive Refinement
```
Prompt for Claude Code:
"Review all pages and ensure proper responsive behavior. Mobile-first, with desktop enhancements. Test at 375px, 768px, and 1024px+ breakpoints."
```
- [ ] Mobile layouts finalized
- [ ] Tablet adjustments
- [ ] Desktop layouts

---

## Quick Reference: File Locations

```
/lib
  design-tokens.ts          <- Phase 1.1

/components
  /ui
    Button.tsx              <- Phase 2.1
    Card.tsx                <- Phase 2.2
    Avatar.tsx              <- Phase 2.3
    SectionLabel.tsx        <- Phase 2.4
    StarRating.tsx          <- Phase 2.5
  /layout
    MobileNav.tsx           <- Phase 3.1
    DesktopSidebar.tsx      <- Phase 3.2
    MobileHeader.tsx        <- Phase 3.3
  /features
    CollectiveDropdown.tsx  <- Phase 4.1
    FilmCard.tsx            <- Phase 4.2
    MessageBubble.tsx       <- Phase 4.3
    DiscussionPreview.tsx   <- Phase 4.4
    ActivityItem.tsx        <- Phase 4.5

/app (or /pages)
  page.tsx                  <- Phase 5.1 (Landing)
  /app
    home                    <- Phase 5.3
    discussion              <- Phase 5.4
    pick                    <- Phase 5.5
    insights                <- Phase 5.6
  /film/[id]                <- Phase 5.7
  /onboarding               <- Phase 5.8
```

---

## Tips for Working with Claude Code

1. **One task at a time**: Don't ask for multiple components at once. Complete each checkbox before moving on.

2. **Reference the design files**: Always point Claude Code to the specific design file or section of the design system.

3. **Review and iterate**: After each component, review it and ask for adjustments if needed before moving on.

4. **Test as you go**: Run your dev server and verify each component works before building the next.

5. **Commit frequently**: Commit after each phase or major component so you can roll back if needed.

---

Good luck! Work through this systematically and you'll have Film Collective implemented in no time.
