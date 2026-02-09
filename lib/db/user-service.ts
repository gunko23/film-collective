import { sql } from "@/lib/db"

export async function ensureUserExists(
  id: string,
  email?: string | null,
  displayName?: string | null,
  profileImageUrl?: string | null,
): Promise<{ id: string; email: string | null; name: string | null; avatar_url: string | null }> {
  if (!id) {
    throw new Error("User ID is required")
  }

  const result = await sql`
    INSERT INTO users (id, email, name, avatar_url)
    VALUES (
      ${id}::uuid,
      ${email || null},
      ${displayName || null},
      ${profileImageUrl || null}
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(${email || null}, users.email),
      name = COALESCE(${displayName || null}, users.name),
      avatar_url = COALESCE(${profileImageUrl || null}, users.avatar_url),
      updated_at = NOW()
    RETURNING id, email, name, avatar_url
  `

  return result[0]
}

export async function userExists(userId: string): Promise<boolean> {
  const result = await sql`SELECT id FROM users WHERE id = ${userId}::uuid`
  return result.length > 0
}

export async function getUserProfile(userId: string) {
  // Get user info
  const users = await sql`
    SELECT id, name, email, avatar_url, created_at
    FROM users
    WHERE id = ${userId}::uuid
  `

  if (users.length === 0) {
    return null
  }

  const user = users[0]

  // Get favorite movies
  const favorites = await sql`
    SELECT tmdb_id, title, poster_path, release_date, position
    FROM user_favorite_movies
    WHERE user_id = ${userId}::uuid
    ORDER BY position ASC
  `

  // Get rating stats
  const movieStats = await sql`
    SELECT
      COUNT(*)::int as count,
      COALESCE(AVG(overall_score), 0)::float as avg_score
    FROM user_movie_ratings
    WHERE user_id = ${userId}::uuid
  `

  const tvStats = await sql`
    SELECT
      COUNT(*)::int as count,
      COALESCE(AVG(overall_score), 0)::float as avg_score
    FROM user_tv_show_ratings
    WHERE user_id = ${userId}::uuid
  `

  // Get top genres from rated movies
  const topGenres = await sql`
    SELECT
      g.value->>'name' as genre,
      COUNT(*) as count
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    CROSS JOIN LATERAL jsonb_array_elements(m.genres) as g(value)
    WHERE umr.user_id = ${userId}::uuid
    GROUP BY g.value->>'name'
    ORDER BY count DESC
    LIMIT 3
  `

  // Get recent ratings
  const recentRatings = await sql`
    SELECT
      umr.overall_score,
      umr.rated_at,
      m.tmdb_id,
      m.title,
      m.poster_path,
      'movie' as media_type
    FROM user_movie_ratings umr
    JOIN movies m ON umr.movie_id = m.id
    WHERE umr.user_id = ${userId}::uuid
    ORDER BY umr.rated_at DESC
    LIMIT 6
  `

  // Get shared collectives (if viewing another user)
  const collectiveCount = await sql`
    SELECT COUNT(DISTINCT collective_id)::int as count
    FROM collective_memberships
    WHERE user_id = ${userId}::uuid
  `

  return {
    user,
    favorites,
    movieStats,
    tvStats,
    topGenres,
    recentRatings,
    collectiveCount,
  }
}

export async function getUserFavorites(userId: string) {
  const favorites = await sql`
    SELECT id, tmdb_id, title, poster_path, release_date, position
    FROM user_favorite_movies
    WHERE user_id = ${userId}::uuid
    ORDER BY position ASC
  `
  return favorites
}

export async function addUserFavorite(
  userId: string,
  data: { tmdbId: number; title: string; posterPath: string | null; releaseDate: string | null; position: number },
) {
  const result = await sql`
    INSERT INTO user_favorite_movies (user_id, tmdb_id, title, poster_path, release_date, position)
    VALUES (${userId}::uuid, ${data.tmdbId}, ${data.title}, ${data.posterPath || null}, ${data.releaseDate || null}, ${data.position})
    ON CONFLICT (user_id, position)
    DO UPDATE SET
      tmdb_id = ${data.tmdbId},
      title = ${data.title},
      poster_path = ${data.posterPath || null},
      release_date = ${data.releaseDate || null},
      updated_at = NOW()
    RETURNING *
  `
  return result[0]
}

export async function deleteUserFavorite(userId: string, position: number) {
  await sql`
    DELETE FROM user_favorite_movies
    WHERE user_id = ${userId}::uuid AND position = ${position}
  `
}
