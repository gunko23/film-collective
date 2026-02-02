# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Film Collective is a social movie/TV rating platform where users create "collectives" (groups) to share ratings, discuss films, and discover content together. Built with v0.app (AI-assisted development) and auto-syncs to GitHub.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test framework is configured. TypeScript errors are ignored in builds (`ignoreBuildErrors: true` in next.config.mjs).

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4.1 with shadcn/ui components (Radix primitives)
- **Auth**: Stack (@stackframe/stack) - routes at `/handler/sign-in`, `/handler/sign-up`, `/handler/sign-out`
- **Database**: Neon serverless PostgreSQL with Drizzle ORM schema, but mostly raw SQL via `@neondatabase/serverless`
- **Real-time**: Upstash Redis for pub/sub + SSE streams (not WebSockets)
- **External API**: TMDB (The Movie Database) for movie/TV data
- **Push**: Web Push API with VAPID keys

## Architecture

### API Routes (`app/api/`)
Standard Next.js Route Handlers pattern:
1. Get authenticated user via `stackServerApp.getUser()`
2. Validate request
3. Query database with parameterized SQL
4. Return JSON response

Use `getSafeUser()` from `lib/auth/auth-utils.ts` for graceful rate-limit handling.

### Database (`lib/db/`)
- `index.ts` - Neon SQL client setup
- `schema.ts` - Drizzle ORM schema (reference for table structure)
- Queries use raw SQL with `sql` template literal, not Drizzle query builder

Key tables: `users`, `collectives`, `collective_memberships`, `movies`, `user_movie_ratings`, `user_tv_show_ratings`, `feed_comments`, `feed_reactions`, `collective_posts`

### Services (`lib/`)
- `collectives/collective-service.ts` - Collective CRUD, analytics, member similarity
- `ratings/rating-service.ts` - Multi-dimensional rating system with sliders and tags
- `tmdb/client.ts` - TMDB API client with retry logic and caching to PostgreSQL
- `feed/feed-service.ts` - Complex feed queries joining ratings, comments, reactions
- `redis/client.ts` - Pub/sub for discussions, typing indicators

### Real-time Pattern
Redis pub/sub channels: `discussion:${collectiveId}`, `typing:${collectiveId}`
SSE endpoints stream updates to clients. See `app/api/collectives/[id]/discussion/stream/route.ts`.

### Component Patterns
- Server components by default, `"use client"` for interactivity
- shadcn/ui components in `components/ui/`
- Theme support via `next-themes` (dark/light)
- PWA with service worker (`public/sw.js`)

## Environment Variables

```
DATABASE_URL=postgresql://...     # Neon PostgreSQL
TMDB_API_KEY=...                  # TMDB API
KV_REST_API_URL=...               # Upstash Redis
KV_REST_API_TOKEN=...             # Upstash Redis
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...  # Web Push
VAPID_PRIVATE_KEY=...             # Web Push
```

Stack auth requires project configuration (see Stack dashboard).

## Key Patterns

**Rating Dimensions**: Configurable via `rating_dimensions` table. Types are "slider" (numeric 1-10) or "tag" (categorical). Stored in `dimensionScores` and `dimensionTags` JSONB fields.

**Invite System**: 8-character alphanumeric codes with optional expiry and max uses. Generated in `collective-service.ts`.

**Image URLs**: Use helpers from `lib/tmdb/image.ts`. Images are unoptimized (`next.config.mjs` setting).

**Error Handling**: Services return null on missing data (graceful degradation) rather than throwing.
