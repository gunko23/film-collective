import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Avoid confusing chars like 0, O, I, 1
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Get all collectives for a user
export async function getUserCollectives(userId: string) {
  const result = await sql`
    SELECT 
      c.*,
      cm.role,
      (SELECT COUNT(*) FROM collective_memberships WHERE collective_id = c.id) as member_count
    FROM collectives c
    JOIN collective_memberships cm ON c.id = cm.collective_id
    WHERE cm.user_id = ${userId}::uuid
    ORDER BY c.created_at DESC
  `
  return result
}

// Get a single collective by ID
export async function getCollective(collectiveId: string) {
  const result = await sql`
    SELECT * FROM collectives WHERE id = ${collectiveId}::uuid
  `
  return result[0] || null
}

// Get collective with membership info for a user
export async function getCollectiveForUser(collectiveId: string, userId: string) {
  const result = await sql`
    SELECT 
      c.*,
      cm.role as user_role,
      (SELECT COUNT(*) FROM collective_memberships WHERE collective_id = c.id) as member_count
    FROM collectives c
    LEFT JOIN collective_memberships cm ON c.id = cm.collective_id AND cm.user_id = ${userId}::uuid
    WHERE c.id = ${collectiveId}::uuid
  `
  return result[0] || null
}

// Get all members of a collective
export async function getCollectiveMembers(collectiveId: string) {
  const result = await sql`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url,
      cm.role,
      cm.created_at as joined_at
    FROM collective_memberships cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY 
      CASE cm.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        ELSE 3 
      END,
      cm.created_at ASC
  `
  return result
}

// Get collective ratings (all member ratings for movies)
export async function getCollectiveRatings(collectiveId: string, limit?: number) {
  if (limit) {
    const result = await sql`
      SELECT 
        umr.movie_id,
        umr.overall_score,
        umr.user_comment,
        umr.rated_at,
        u.id as user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        m.tmdb_id,
        m.title,
        m.poster_path,
        m.release_date,
        m.genres
      FROM user_movie_ratings umr
      JOIN collective_memberships cm ON umr.user_id = cm.user_id
      JOIN users u ON umr.user_id = u.id
      JOIN movies m ON umr.movie_id = m.id
      WHERE cm.collective_id = ${collectiveId}::uuid
      ORDER BY umr.rated_at DESC
      LIMIT ${limit}
    `
    return result
  }

  const result = await sql`
    SELECT 
      umr.movie_id,
      umr.overall_score,
      umr.user_comment,
      umr.rated_at,
      u.id as user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      m.tmdb_id,
      m.title,
      m.poster_path,
      m.release_date,
      m.genres
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    JOIN users u ON umr.user_id = u.id
    JOIN movies m ON umr.movie_id = m.id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY umr.rated_at DESC
  `
  return result
}

// Get aggregated movie ratings for a collective
export async function getCollectiveMovieStats(collectiveId: string) {
  const result = await sql`
    SELECT 
      m.tmdb_id,
      m.title,
      m.poster_path,
      m.release_date,
      m.genres,
      COUNT(umr.id) as rating_count,
      AVG(umr.overall_score) as avg_score,
      MIN(umr.overall_score) as min_score,
      MAX(umr.overall_score) as max_score
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY m.id, m.tmdb_id, m.title, m.poster_path, m.release_date, m.genres
    ORDER BY avg_score DESC, rating_count DESC
    LIMIT 50
  `
  return result
}

// Create a new collective
export async function createCollective(name: string, description: string | null, userId: string) {
  // Create the collective
  const collectiveResult = await sql`
    INSERT INTO collectives (name, description, created_by_user_id)
    VALUES (${name}, ${description}, ${userId}::uuid)
    RETURNING *
  `

  const collective = collectiveResult[0]

  // Add creator as owner
  await sql`
    INSERT INTO collective_memberships (collective_id, user_id, role)
    VALUES (${collective.id}::uuid, ${userId}::uuid, 'owner')
  `

  return collective
}

// Create an invite for a collective
export async function createInvite(collectiveId: string, userId: string, expiresInDays?: number, maxUses?: number) {
  const inviteCode = generateInviteCode()
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null

  const result = await sql`
    INSERT INTO collective_invites (collective_id, invite_code, created_by_user_id, expires_at, max_uses)
    VALUES (${collectiveId}::uuid, ${inviteCode}, ${userId}::uuid, ${expiresAt}, ${maxUses})
    RETURNING *
  `

  return result[0]
}

// Get invite by code
export async function getInviteByCode(inviteCode: string) {
  const result = await sql`
    SELECT 
      ci.*,
      c.name as collective_name,
      c.description as collective_description
    FROM collective_invites ci
    JOIN collectives c ON ci.collective_id = c.id
    WHERE ci.invite_code = ${inviteCode}
  `
  return result[0] || null
}

// Join a collective via invite code
export async function joinCollectiveViaInvite(inviteCode: string, userId: string) {
  // Get the invite
  const invite = await getInviteByCode(inviteCode)

  if (!invite) {
    throw new Error("Invalid invite code")
  }

  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error("This invite has expired")
  }

  // Check if max uses reached
  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    throw new Error("This invite has reached its maximum uses")
  }

  // Check if user is already a member
  const existingMembership = await sql`
    SELECT * FROM collective_memberships 
    WHERE collective_id = ${invite.collective_id}::uuid AND user_id = ${userId}::uuid
  `

  if (existingMembership.length > 0) {
    throw new Error("You are already a member of this collective")
  }

  // Add user to collective
  await sql`
    INSERT INTO collective_memberships (collective_id, user_id, role)
    VALUES (${invite.collective_id}::uuid, ${userId}::uuid, 'member')
  `

  // Increment use count
  await sql`
    UPDATE collective_invites 
    SET use_count = use_count + 1 
    WHERE id = ${invite.id}::uuid
  `

  return invite
}

// Leave a collective
export async function leaveCollective(collectiveId: string, userId: string) {
  // Check if user is the owner
  const membership = await sql`
    SELECT role FROM collective_memberships 
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${userId}::uuid
  `

  if (membership.length === 0) {
    throw new Error("You are not a member of this collective")
  }

  if (membership[0].role === "owner") {
    throw new Error("Owners cannot leave their collective. Transfer ownership first or delete the collective.")
  }

  await sql`
    DELETE FROM collective_memberships 
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${userId}::uuid
  `
}

// Update member role
export async function updateMemberRole(
  collectiveId: string,
  targetUserId: string,
  newRole: "admin" | "member",
  requestingUserId: string,
) {
  // Verify requesting user is owner or admin
  const requesterMembership = await sql`
    SELECT role FROM collective_memberships 
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${requestingUserId}::uuid
  `

  if (requesterMembership.length === 0 || !["owner", "admin"].includes(requesterMembership[0].role)) {
    throw new Error("You don't have permission to change member roles")
  }

  // Don't allow changing owner's role
  const targetMembership = await sql`
    SELECT role FROM collective_memberships 
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${targetUserId}::uuid
  `

  if (targetMembership.length === 0) {
    throw new Error("User is not a member of this collective")
  }

  if (targetMembership[0].role === "owner") {
    throw new Error("Cannot change the owner's role")
  }

  await sql`
    UPDATE collective_memberships 
    SET role = ${newRole}
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${targetUserId}::uuid
  `
}

// Delete a collective (owner only)
export async function deleteCollective(collectiveId: string, userId: string) {
  // Verify user is owner
  const membership = await sql`
    SELECT role FROM collective_memberships 
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${userId}::uuid
  `

  if (membership.length === 0 || membership[0].role !== "owner") {
    throw new Error("Only the owner can delete a collective")
  }

  await sql`DELETE FROM collectives WHERE id = ${collectiveId}::uuid`
}

// Get genre analytics for a collective
export async function getCollectiveGenreStats(collectiveId: string) {
  const result = await sql`
    SELECT 
      genre_element->>'name' as genre_name,
      COUNT(*) as movie_count,
      AVG(umr.overall_score) as avg_score
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id
    JOIN collective_memberships cm ON umr.user_id = cm.user_id,
    LATERAL jsonb_array_elements(m.genres) AS genre_element
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY genre_element->>'name'
    ORDER BY movie_count DESC, avg_score DESC
    LIMIT 10
  `
  return result
}

// Get all ratings for a specific movie in a collective
export async function getCollectiveMovieRatings(collectiveId: string, tmdbId: string) {
  const result = await sql`
    SELECT 
      umr.overall_score,
      umr.user_comment,
      umr.rated_at,
      u.id as user_id,
      u.name as user_name,
      u.avatar_url as user_avatar
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    JOIN users u ON umr.user_id = u.id
    JOIN movies m ON umr.movie_id = m.id
    WHERE cm.collective_id = ${collectiveId}::uuid
      AND m.tmdb_id = ${tmdbId}
    ORDER BY umr.rated_at DESC
  `
  return result
}

// Get collective analytics summary
export async function getCollectiveAnalytics(collectiveId: string) {
  const result = await sql`
    SELECT 
      COUNT(DISTINCT umr.movie_id) as total_movies_rated,
      COUNT(umr.id) as total_ratings,
      AVG(umr.overall_score) as avg_collective_score,
      COUNT(DISTINCT umr.user_id) as active_raters
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
  `
  return result[0] || { total_movies_rated: 0, total_ratings: 0, avg_collective_score: 0, active_raters: 0 }
}

// Get decade preferences
export async function getCollectiveDecadeStats(collectiveId: string) {
  const result = await sql`
    SELECT 
      (EXTRACT(YEAR FROM m.release_date)::int / 10 * 10) as decade,
      COUNT(*) as movie_count,
      AVG(umr.overall_score) as avg_score
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
      AND m.release_date IS NOT NULL
    GROUP BY decade
    ORDER BY movie_count DESC
    LIMIT 5
  `
  return result
}

// Get member rating similarity matrix
export async function getMemberSimilarityData(collectiveId: string) {
  // Get all members and their ratings
  const result = await sql`
    SELECT 
      u.id as user_id,
      u.name as user_name,
      m.tmdb_id,
      umr.overall_score
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    JOIN users u ON umr.user_id = u.id
    JOIN movies m ON umr.movie_id = m.id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY u.id, m.tmdb_id
  `
  return result
}

// Get rating distribution across the collective
export async function getRatingDistribution(collectiveId: string) {
  const result = await sql`
    SELECT 
      FLOOR(overall_score / 20) as rating_bucket,
      COUNT(*) as count
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY rating_bucket
    ORDER BY rating_bucket
  `
  return result
}

// Get member activity over time
export async function getMemberActivityTimeline(collectiveId: string) {
  const result = await sql`
    SELECT 
      DATE_TRUNC('week', umr.rated_at) as week,
      u.id as user_id,
      u.name as user_name,
      COUNT(*) as rating_count
    FROM user_movie_ratings umr
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    JOIN users u ON umr.user_id = u.id
    WHERE cm.collective_id = ${collectiveId}::uuid
      AND umr.rated_at > NOW() - INTERVAL '3 months'
    GROUP BY week, u.id, u.name
    ORDER BY week DESC
  `
  return result
}

// Get top controversial movies (highest variance in ratings)
export async function getControversialMovies(collectiveId: string) {
  const result = await sql`
    SELECT 
      m.tmdb_id,
      m.title,
      m.poster_path,
      COUNT(umr.id) as rating_count,
      AVG(umr.overall_score) as avg_score,
      STDDEV(umr.overall_score) as score_variance,
      MIN(umr.overall_score) as min_score,
      MAX(umr.overall_score) as max_score
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY m.id, m.tmdb_id, m.title, m.poster_path
    HAVING COUNT(umr.id) >= 2
    ORDER BY score_variance DESC NULLS LAST
    LIMIT 5
  `
  return result
}

// Get unanimous favorites (high avg, low variance)
export async function getUnanimousFavorites(collectiveId: string) {
  const result = await sql`
    SELECT 
      m.tmdb_id,
      m.title,
      m.poster_path,
      COUNT(umr.id) as rating_count,
      AVG(umr.overall_score) as avg_score,
      STDDEV(umr.overall_score) as score_variance
    FROM movies m
    JOIN user_movie_ratings umr ON m.id = umr.movie_id
    JOIN collective_memberships cm ON umr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY m.id, m.tmdb_id, m.title, m.poster_path
    HAVING COUNT(umr.id) >= 2 AND AVG(umr.overall_score) >= 70
    ORDER BY score_variance ASC NULLS LAST, avg_score DESC
    LIMIT 5
  `
  return result
}

// Get aggregated TV show ratings for a collective
export async function getCollectiveTVShowStats(collectiveId: string) {
  const result = await sql`
    SELECT 
      ts.id as tv_show_id,
      ts.name,
      ts.poster_path,
      ts.first_air_date,
      ts.genres,
      COUNT(utsr.id) as rating_count,
      AVG(utsr.overall_score) as avg_score
    FROM tv_shows ts
    JOIN user_tv_show_ratings utsr ON ts.id = utsr.tv_show_id
    JOIN collective_memberships cm ON utsr.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY ts.id, ts.name, ts.poster_path, ts.first_air_date, ts.genres
    ORDER BY avg_score DESC, rating_count DESC
    LIMIT 50
  `
  return result
}

// Get aggregated episode ratings for a collective
export async function getCollectiveEpisodeStats(collectiveId: string) {
  const result = await sql`
    SELECT 
      te.id as episode_id,
      te.name as episode_name,
      te.episode_number,
      te.season_number,
      te.still_path,
      te.air_date,
      ts.id as tv_show_id,
      ts.name as tv_show_name,
      ts.poster_path as tv_show_poster,
      COUNT(uer.id) as rating_count,
      AVG(uer.overall_score) as avg_score
    FROM tv_episodes te
    JOIN tv_shows ts ON te.tv_show_id = ts.id
    JOIN user_episode_ratings uer ON te.id = uer.episode_id
    JOIN collective_memberships cm ON uer.user_id = cm.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY te.id, te.name, te.episode_number, te.season_number, te.still_path, te.air_date, 
             ts.id, ts.name, ts.poster_path
    ORDER BY avg_score DESC, rating_count DESC
    LIMIT 50
  `
  return result
}

// Get all ratings for a specific TV show in a collective
export async function getCollectiveTVRatings(collectiveId: string, limit?: number) {
  const limitClause = limit ? `LIMIT ${limit}` : ""
  const result = await sql`
    SELECT 
      utsr.tv_show_id,
      utsr.overall_score,
      utsr.user_comment,
      utsr.rated_at,
      u.id as user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      ts.id as tmdb_id,
      ts.name as title,
      ts.poster_path,
      ts.first_air_date,
      'tv' as media_type
    FROM user_tv_show_ratings utsr
    JOIN collective_memberships cm ON utsr.user_id = cm.user_id
    JOIN users u ON utsr.user_id = u.id
    JOIN tv_shows ts ON utsr.tv_show_id = ts.id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY utsr.rated_at DESC
  `
  return result
}

// Get all ratings for a specific episode in a collective
export async function getCollectiveEpisodeRatings(collectiveId: string, limit?: number) {
  const result = await sql`
    SELECT 
      uer.episode_id,
      uer.overall_score,
      uer.user_comment,
      uer.rated_at,
      u.id as user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      te.id as tmdb_id,
      te.name as episode_name,
      te.episode_number,
      te.season_number,
      te.still_path,
      ts.id as tv_show_id,
      ts.name as tv_show_name,
      ts.poster_path,
      'episode' as media_type
    FROM user_episode_ratings uer
    JOIN collective_memberships cm ON uer.user_id = cm.user_id
    JOIN users u ON uer.user_id = u.id
    JOIN tv_episodes te ON uer.episode_id = te.id
    JOIN tv_shows ts ON te.tv_show_id = ts.id
    WHERE cm.collective_id = ${collectiveId}::uuid
    ORDER BY uer.rated_at DESC
  `
  return result
}

export const getCollectiveById = getCollectiveForUser
