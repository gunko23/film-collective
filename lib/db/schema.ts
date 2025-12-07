import { pgTable, text, integer, timestamp, numeric, jsonb, uuid, date, unique } from "drizzle-orm/pg-core"

// ============================================
// USERS
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// ============================================
// COLLECTIVES
// ============================================
export const collectives = pgTable("collectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const collectiveMemberships = pgTable(
  "collective_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectiveId: uuid("collective_id")
      .notNull()
      .references(() => collectives.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'owner', 'admin', 'member'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.collectiveId, table.userId)],
)

// ============================================
// COLLECTIVE INVITES
// ============================================
export const collectiveInvites = pgTable("collective_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectiveId: uuid("collective_id")
    .notNull()
    .references(() => collectives.id, { onDelete: "cascade" }),
  inviteCode: text("invite_code").unique().notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ============================================
// MOVIES (cached from TMDB)
// ============================================
export const movies = pgTable("movies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tmdbId: integer("tmdb_id").unique().notNull(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  overview: text("overview"),
  releaseDate: date("release_date"),
  runtimeMinutes: integer("runtime_minutes"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  originalLanguage: text("original_language"),
  genres: jsonb("genres"), // Array of { id, name }
  tmdbPopularity: numeric("tmdb_popularity"),
  tmdbVoteAverage: numeric("tmdb_vote_average"),
  tmdbVoteCount: integer("tmdb_vote_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// ============================================
// RATING DIMENSIONS
// ============================================
export const ratingDimensions = pgTable("rating_dimensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  label: text("label").notNull(),
  description: text("description"),
  weightDefault: numeric("weight_default").default("1.0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ============================================
// USER MOVIE RATINGS
// ============================================
export const userMovieRatings = pgTable(
  "user_movie_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    overallScore: numeric("overall_score").notNull(), // 0-100
    dimensionScores: jsonb("dimension_scores"), // { "mood_match": 85, "pacing": 70, ... }
    userComment: text("user_comment"),
    aiExplanation: text("ai_explanation"),
    aiTags: jsonb("ai_tags"), // ["cozy", "heist", "found_family"]
    ratedAt: timestamp("rated_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.userId, table.movieId)],
)

// ============================================
// WATCHLISTS
// ============================================
export const userWatchlistEntries = pgTable(
  "user_watchlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.userId, table.movieId)],
)

export const collectiveWatchlistEntries = pgTable(
  "collective_watchlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectiveId: uuid("collective_id")
      .notNull()
      .references(() => collectives.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    addedByUserId: uuid("added_by_user_id").references(() => users.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.collectiveId, table.movieId)],
)

// ============================================
// TYPES
// ============================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Collective = typeof collectives.$inferSelect
export type CollectiveMembership = typeof collectiveMemberships.$inferSelect
export type Movie = typeof movies.$inferSelect
export type NewMovie = typeof movies.$inferInsert
export type RatingDimension = typeof ratingDimensions.$inferSelect
export type UserMovieRating = typeof userMovieRatings.$inferSelect
export type NewUserMovieRating = typeof userMovieRatings.$inferInsert
export type UserWatchlistEntry = typeof userWatchlistEntries.$inferSelect
export type CollectiveWatchlistEntry = typeof collectiveWatchlistEntries.$inferSelect
export type CollectiveInvite = typeof collectiveInvites.$inferSelect
export type NewCollectiveInvite = typeof collectiveInvites.$inferInsert
