import { pgTable, text, integer, timestamp, numeric, jsonb, uuid, date, unique, boolean } from "drizzle-orm/pg-core"

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
  uiType: text("ui_type").notNull().default("slider"), // 'slider' or 'tags'
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  step: numeric("step"),
  isActive: boolean("is_active").notNull().default(true),
  weightDefault: numeric("weight_default").default("1.0"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const ratingDimensionOptions = pgTable(
  "rating_dimension_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ratingDimensionId: uuid("rating_dimension_id")
      .notNull()
      .references(() => ratingDimensions.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.ratingDimensionId, table.key)],
)

export const movieRatingDimensionConfigs = pgTable(
  "movie_rating_dimension_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    ratingDimensionId: uuid("rating_dimension_id")
      .notNull()
      .references(() => ratingDimensions.id, { onDelete: "cascade" }),
    isRequired: boolean("is_required").notNull().default(false),
    weight: numeric("weight"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.movieId, table.ratingDimensionId)],
)

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
    dimensionScores: jsonb("dimension_scores"), // { "emotional_impact": 4, "pacing": 3, ... }
    dimensionTags: jsonb("dimension_tags"), // { "vibes": ["cozy", "heartwarming"], "themes": ["found_family"] }
    extraNotes: text("extra_notes"), // Free-text "why?" comment
    userComment: text("user_comment"),
    aiExplanation: text("ai_explanation"),
    aiTags: jsonb("ai_tags"),
    ratedAt: timestamp("rated_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    // Legacy columns (kept for backwards compatibility, will be removed later)
    emotionalImpact: integer("emotional_impact"),
    pacing: integer("pacing"),
    aesthetic: integer("aesthetic"),
    rewatchability: integer("rewatchability"),
    breakdownTags: jsonb("breakdown_tags"),
    breakdownNotes: text("breakdown_notes"),
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
// FEED INTERACTIONS
// ============================================
export const feedComments = pgTable("feed_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ratingId: uuid("rating_id")
    .notNull()
    .references(() => userMovieRatings.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const feedReactions = pgTable(
  "feed_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ratingId: uuid("rating_id")
      .notNull()
      .references(() => userMovieRatings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull(), // 'like', 'love', 'fire', 'clap', 'thinking'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.ratingId, table.userId, table.reactionType)],
)

// ============================================
// MESSAGE BOARD / POSTS
// ============================================
export const collectivePosts = pgTable("collective_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectiveId: uuid("collective_id")
    .notNull()
    .references(() => collectives.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  postType: text("post_type").notNull().default("discussion"), // 'discussion' or 'movie_list'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const postMovieListItems = pgTable("post_movie_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => collectivePosts.id, { onDelete: "cascade" }),
  tmdbId: integer("tmdb_id").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  releaseDate: date("release_date"),
  position: integer("position").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => collectivePosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

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
export type RatingDimensionOption = typeof ratingDimensionOptions.$inferSelect
export type MovieRatingDimensionConfig = typeof movieRatingDimensionConfigs.$inferSelect
export type UserMovieRating = typeof userMovieRatings.$inferSelect
export type NewUserMovieRating = typeof userMovieRatings.$inferInsert
export type UserWatchlistEntry = typeof userWatchlistEntries.$inferSelect
export type CollectiveWatchlistEntry = typeof collectiveWatchlistEntries.$inferSelect
export type CollectiveInvite = typeof collectiveInvites.$inferSelect
export type NewCollectiveInvite = typeof collectiveInvites.$inferInsert
export type FeedComment = typeof feedComments.$inferSelect
export type NewFeedComment = typeof feedComments.$inferInsert
export type FeedReaction = typeof feedReactions.$inferSelect
export type NewFeedReaction = typeof feedReactions.$inferInsert

// New types for message board
export type CollectivePost = typeof collectivePosts.$inferSelect
export type NewCollectivePost = typeof collectivePosts.$inferInsert
export type PostMovieListItem = typeof postMovieListItems.$inferSelect
export type NewPostMovieListItem = typeof postMovieListItems.$inferInsert
export type PostComment = typeof postComments.$inferSelect
export type NewPostComment = typeof postComments.$inferInsert
