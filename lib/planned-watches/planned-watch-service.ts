import { sql } from "@/lib/db"

export type PlannedWatch = {
  id: string
  movieId: number
  movieTitle: string
  movieYear: number | null
  moviePoster: string | null
  createdBy: string
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
  rsvpStatus: "confirmed" | "maybe" | "declined" | "pending"
  watchStatus: "planned" | "watching" | "watched"
  watchedAt: string | null
  addedAt: string
}

export type CollectivePlannedWatch = PlannedWatch & {
  createdByName: string | null
  createdByAvatar: string | null
  isCreator: boolean
  isParticipant: boolean
  myRsvpStatus: string | null
  participants: { userId: string; name: string | null; avatarUrl: string | null; rsvpStatus: string; watchStatus: string }[]
}

export type CreatePlannedWatchInput = {
  movieId: number
  movieTitle: string
  movieYear?: number | null
  moviePoster?: string | null
  createdBy: string
  collectiveIds?: string[]
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
    collectiveIds = [],
    participantIds,
    scheduledFor,
    moodTags,
    source = "tonights_pick",
  } = input

  // Insert the planned watch
  const rows = await sql`
    INSERT INTO planned_watches (movie_id, movie_title, movie_year, movie_poster, created_by, scheduled_for, source, mood_tags)
    VALUES (${movieId}, ${movieTitle}, ${movieYear ?? null}, ${moviePoster ?? null}, ${createdBy}, ${scheduledFor ?? null}, ${source}, ${moodTags ?? null})
    RETURNING *
  `

  const plannedWatch = mapRow(rows[0])

  // Link to collectives via junction table
  for (const collectiveId of collectiveIds) {
    await sql`
      INSERT INTO planned_watch_collectives (planned_watch_id, collective_id)
      VALUES (${plannedWatch.id}, ${collectiveId})
      ON CONFLICT (planned_watch_id, collective_id) DO NOTHING
    `
  }

  // Insert participants — creator is auto-confirmed, others start as 'pending'
  if (participantIds.length > 0) {
    for (const userId of participantIds) {
      const status = userId === createdBy ? "confirmed" : "pending"
      await sql`
        INSERT INTO planned_watch_participants (planned_watch_id, user_id, rsvp_status)
        VALUES (${plannedWatch.id}, ${userId}, ${status})
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

export async function updateParticipantRsvp(
  plannedWatchId: string,
  userId: string,
  rsvpStatus: "confirmed" | "declined",
): Promise<boolean> {
  const rows = await sql`
    UPDATE planned_watch_participants
    SET rsvp_status = ${rsvpStatus}
    WHERE planned_watch_id = ${plannedWatchId} AND user_id = ${userId}
    RETURNING id
  `
  return rows.length > 0
}

export async function updateParticipantWatchStatus(
  plannedWatchId: string,
  userId: string,
  watchStatus: "watching" | "watched",
): Promise<{ success: boolean; movieId?: number }> {
  let rows
  if (watchStatus === "watched") {
    rows = await sql`
      UPDATE planned_watch_participants
      SET watch_status = ${watchStatus}, watched_at = NOW()
      WHERE planned_watch_id = ${plannedWatchId} AND user_id = ${userId}
        AND rsvp_status = 'confirmed'
      RETURNING id
    `
  } else {
    rows = await sql`
      UPDATE planned_watch_participants
      SET watch_status = ${watchStatus}
      WHERE planned_watch_id = ${plannedWatchId} AND user_id = ${userId}
        AND rsvp_status = 'confirmed'
      RETURNING id
    `
  }

  if (rows.length === 0) return { success: false }

  const watchRow = await sql`
    SELECT movie_id FROM planned_watches WHERE id = ${plannedWatchId}
  `

  return {
    success: true,
    movieId: watchRow.length > 0 ? watchRow[0].movie_id : undefined,
  }
}

export async function getUpcomingPlannedWatches(userId: string): Promise<(PlannedWatch & {
  myRsvpStatus: string
  myWatchStatus: string
  createdByName: string | null
  participants: { userId: string; name: string | null; avatarUrl: string | null; rsvpStatus: string; watchStatus: string }[]
})[]> {
  const rows = await sql`
    SELECT pw.*, my_pwp.rsvp_status AS my_rsvp_status, my_pwp.watch_status AS my_watch_status, creator.name AS created_by_name
    FROM planned_watches pw
    LEFT JOIN planned_watch_participants my_pwp ON my_pwp.planned_watch_id = pw.id AND my_pwp.user_id = ${userId}
    LEFT JOIN users creator ON creator.id = pw.created_by
    WHERE (pw.created_by = ${userId} OR my_pwp.user_id IS NOT NULL)
      AND pw.status IN ('planned', 'watching')
      AND (my_pwp.rsvp_status IS NULL OR my_pwp.rsvp_status != 'declined')
      AND (my_pwp.watch_status IS NULL OR my_pwp.watch_status != 'watched')
    ORDER BY pw.locked_in_at DESC
  `

  const watches = rows.map((row: any) => ({
    ...mapRow(row),
    myRsvpStatus: row.my_rsvp_status ?? "confirmed",
    myWatchStatus: row.my_watch_status ?? "planned",
    createdByName: row.created_by_name ?? null,
  }))

  // Fetch participants for each watch
  const result = []
  for (const watch of watches) {
    const participants = await sql`
      SELECT pwp.user_id, pwp.rsvp_status, pwp.watch_status, u.name, u.avatar_url
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
        watchStatus: p.watch_status ?? "planned",
      })),
    })
  }

  return result
}

export async function getCollectivePlannedWatches(
  collectiveId: string,
  currentUserId: string,
): Promise<CollectivePlannedWatch[]> {
  const rows = await sql`
    SELECT pw.*, creator.name AS created_by_name, creator.avatar_url AS created_by_avatar,
      my_pwp.rsvp_status AS my_rsvp_status, my_pwp.user_id AS my_participant_id
    FROM planned_watches pw
    JOIN planned_watch_collectives pwc ON pwc.planned_watch_id = pw.id AND pwc.collective_id = ${collectiveId}
    JOIN users creator ON creator.id = pw.created_by
    LEFT JOIN planned_watch_participants my_pwp ON my_pwp.planned_watch_id = pw.id AND my_pwp.user_id = ${currentUserId}
    WHERE pw.status IN ('planned', 'watching')
      AND EXISTS (
        SELECT 1 FROM planned_watch_participants pwp_check
        WHERE pwp_check.planned_watch_id = pw.id
          AND pwp_check.rsvp_status = 'confirmed'
          AND pwp_check.watch_status != 'watched'
      )
    ORDER BY pw.locked_in_at DESC
  `

  const result: CollectivePlannedWatch[] = []
  for (const row of rows) {
    const participants = await sql`
      SELECT pwp.user_id, pwp.rsvp_status, pwp.watch_status, u.name, u.avatar_url
      FROM planned_watch_participants pwp
      JOIN users u ON u.id = pwp.user_id
      WHERE pwp.planned_watch_id = ${row.id}
        AND pwp.rsvp_status != 'declined'
    `

    const myRsvpStatus = (row as any).my_rsvp_status ?? null
    const isParticipant = (row as any).my_participant_id != null && myRsvpStatus !== "declined"

    result.push({
      ...mapRow(row),
      createdByName: (row as any).created_by_name ?? null,
      createdByAvatar: (row as any).created_by_avatar ?? null,
      isCreator: row.created_by === currentUserId,
      isParticipant,
      myRsvpStatus,
      participants: participants.map((p: any) => ({
        userId: p.user_id,
        name: p.name,
        avatarUrl: p.avatar_url,
        rsvpStatus: p.rsvp_status,
        watchStatus: p.watch_status ?? "planned",
      })),
    })
  }

  return result
}

export async function joinPlannedWatch(
  plannedWatchId: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    INSERT INTO planned_watch_participants (planned_watch_id, user_id, rsvp_status)
    VALUES (${plannedWatchId}, ${userId}, 'confirmed')
    ON CONFLICT (planned_watch_id, user_id) DO UPDATE SET rsvp_status = 'confirmed'
    RETURNING id
  `
  return rows.length > 0
}

export async function leavePlannedWatch(
  plannedWatchId: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM planned_watch_participants
    WHERE planned_watch_id = ${plannedWatchId} AND user_id = ${userId}
    RETURNING id
  `
  return rows.length > 0
}

export async function getUserActivityStatus(userId: string): Promise<{ status: string; movieTitle?: string } | null> {
  const rows = await sql`
    SELECT pw.status, pw.movie_title
    FROM planned_watches pw
    LEFT JOIN planned_watch_participants pwp ON pwp.planned_watch_id = pw.id AND pwp.user_id = ${userId}
    WHERE (pw.created_by = ${userId} OR (pwp.user_id IS NOT NULL AND pwp.rsvp_status = 'confirmed'))
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
