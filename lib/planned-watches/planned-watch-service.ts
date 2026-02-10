import { sql } from "@/lib/db"

export type PlannedWatch = {
  id: string
  movieId: number
  movieTitle: string
  movieYear: number | null
  moviePoster: string | null
  createdBy: string
  collectiveId: string | null
  status: "planned" | "watching" | "watched" | "cancelled"
  scheduledFor: string | null
  lockedInAt: string
  watchedAt: string | null
  cancelledAt: string | null
  source: "tonights_pick" | "manual" | "recommendation"
  moodTags: string[] | null
  createdAt: string
  updatedAt: string
}

export type PlannedWatchParticipant = {
  id: string
  plannedWatchId: string
  userId: string
  rsvpStatus: "confirmed" | "maybe" | "declined"
  addedAt: string
}

export type CreatePlannedWatchInput = {
  movieId: number
  movieTitle: string
  movieYear?: number | null
  moviePoster?: string | null
  createdBy: string
  collectiveId?: string | null
  participantIds: string[]
  scheduledFor?: string | null
  moodTags?: string[] | null
  source?: "tonights_pick" | "manual" | "recommendation"
}

export async function createPlannedWatch(input: CreatePlannedWatchInput): Promise<PlannedWatch> {
  const {
    movieId,
    movieTitle,
    movieYear,
    moviePoster,
    createdBy,
    collectiveId,
    participantIds,
    scheduledFor,
    moodTags,
    source = "tonights_pick",
  } = input

  // Insert the planned watch
  const rows = await sql`
    INSERT INTO planned_watches (movie_id, movie_title, movie_year, movie_poster, created_by, collective_id, scheduled_for, source, mood_tags)
    VALUES (${movieId}, ${movieTitle}, ${movieYear ?? null}, ${moviePoster ?? null}, ${createdBy}, ${collectiveId ?? null}, ${scheduledFor ?? null}, ${source}, ${moodTags ?? null})
    RETURNING *
  `

  const plannedWatch = mapRow(rows[0])

  // Insert participants
  if (participantIds.length > 0) {
    for (const userId of participantIds) {
      await sql`
        INSERT INTO planned_watch_participants (planned_watch_id, user_id, rsvp_status)
        VALUES (${plannedWatch.id}, ${userId}, 'confirmed')
        ON CONFLICT (planned_watch_id, user_id) DO NOTHING
      `
    }
  }

  return plannedWatch
}

export async function updatePlannedWatchStatus(
  id: string,
  status: "watching" | "watched" | "cancelled",
  userId: string,
): Promise<PlannedWatch | null> {
  // Verify the user is the creator or a participant
  const accessCheck = await sql`
    SELECT pw.id FROM planned_watches pw
    LEFT JOIN planned_watch_participants pwp ON pwp.planned_watch_id = pw.id AND pwp.user_id = ${userId}
    WHERE pw.id = ${id} AND (pw.created_by = ${userId} OR pwp.user_id IS NOT NULL)
  `

  if (accessCheck.length === 0) return null

  const timestampField =
    status === "watched" ? "watched_at" : status === "cancelled" ? "cancelled_at" : null

  let rows
  if (timestampField === "watched_at") {
    rows = await sql`
      UPDATE planned_watches
      SET status = ${status}, watched_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  } else if (timestampField === "cancelled_at") {
    rows = await sql`
      UPDATE planned_watches
      SET status = ${status}, cancelled_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  } else {
    rows = await sql`
      UPDATE planned_watches
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
  }

  return rows.length > 0 ? mapRow(rows[0]) : null
}

export async function getUpcomingPlannedWatches(userId: string): Promise<(PlannedWatch & { participants: { userId: string; name: string | null; avatarUrl: string | null; rsvpStatus: string }[] })[]> {
  const rows = await sql`
    SELECT pw.*
    FROM planned_watches pw
    LEFT JOIN planned_watch_participants pwp ON pwp.planned_watch_id = pw.id AND pwp.user_id = ${userId}
    WHERE (pw.created_by = ${userId} OR pwp.user_id IS NOT NULL)
      AND pw.status IN ('planned', 'watching')
    ORDER BY pw.locked_in_at DESC
  `

  const watches = rows.map(mapRow)

  // Fetch participants for each watch
  const result = []
  for (const watch of watches) {
    const participants = await sql`
      SELECT pwp.user_id, pwp.rsvp_status, u.name, u.avatar_url
      FROM planned_watch_participants pwp
      JOIN users u ON u.id = pwp.user_id
      WHERE pwp.planned_watch_id = ${watch.id}
    `
    result.push({
      ...watch,
      participants: participants.map((p: any) => ({
        userId: p.user_id,
        name: p.name,
        avatarUrl: p.avatar_url,
        rsvpStatus: p.rsvp_status,
      })),
    })
  }

  return result
}

export async function getUserActivityStatus(userId: string): Promise<{ status: string; movieTitle?: string } | null> {
  const rows = await sql`
    SELECT pw.status, pw.movie_title
    FROM planned_watches pw
    LEFT JOIN planned_watch_participants pwp ON pwp.planned_watch_id = pw.id AND pwp.user_id = ${userId}
    WHERE (pw.created_by = ${userId} OR pwp.user_id IS NOT NULL)
      AND pw.status IN ('planned', 'watching')
    ORDER BY
      CASE WHEN pw.status = 'watching' THEN 0 ELSE 1 END,
      pw.locked_in_at DESC
    LIMIT 1
  `

  if (rows.length === 0) return null

  return {
    status: rows[0].status as string,
    movieTitle: rows[0].movie_title as string,
  }
}

function mapRow(row: any): PlannedWatch {
  return {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    movieYear: row.movie_year,
    moviePoster: row.movie_poster,
    createdBy: row.created_by,
    collectiveId: row.collective_id,
    status: row.status,
    scheduledFor: row.scheduled_for,
    lockedInAt: row.locked_in_at,
    watchedAt: row.watched_at,
    cancelledAt: row.cancelled_at,
    source: row.source,
    moodTags: row.mood_tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
