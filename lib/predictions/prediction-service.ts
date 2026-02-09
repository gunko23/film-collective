import { sql } from "@/lib/db"

export async function getAllPredictions(collectiveId: string) {
  const predictions = await sql`
    SELECT
      op.id,
      op.user_id,
      on_nom.category,
      op.nomination_id,
      op.created_at,
      op.updated_at,
      u.name as user_name,
      u.avatar_url as user_avatar,
      on_nom.work_title as film_title,
      on_nom.nominee as nominee_name,
      on_nom.tmdb_movie_id as tmdb_id
    FROM oscar_predictions op
    JOIN users u ON op.user_id = u.id
    JOIN oscar_nominations on_nom ON op.nomination_id = on_nom.id
    WHERE op.collective_id = ${collectiveId}
    ORDER BY on_nom.category, u.name
  `
  return predictions
}

export async function getUserPredictions(userId: string, collectiveId: string) {
  const predictions = await sql`
    SELECT
      on_nom.category,
      op.nomination_id,
      on_nom.work_title as film_title,
      on_nom.nominee as nominee_name
    FROM oscar_predictions op
    JOIN oscar_nominations on_nom ON op.nomination_id = on_nom.id
    WHERE op.user_id = ${userId} AND op.collective_id = ${collectiveId}
  `
  return predictions
}

export async function savePrediction(
  userId: string,
  collectiveId: string,
  category: string,
  nominationId: string
): Promise<{ id: string; error?: string; status?: number }> {
  // Check if user is a member of this collective
  const membership = await sql`
    SELECT 1 FROM collective_memberships
    WHERE collective_id = ${collectiveId} AND user_id = ${userId}
  `

  if (membership.length === 0) {
    return { id: "", error: "You must be a member of this collective", status: 403 }
  }

  // Get ceremony from the nomination
  const nomination = await sql`
    SELECT ceremony FROM oscar_nominations WHERE id = ${nominationId}
  `

  if (nomination.length === 0) {
    return { id: "", error: "Nomination not found", status: 404 }
  }

  const ceremony = nomination[0].ceremony

  // Delete existing prediction for this user/collective/category first
  await sql`
    DELETE FROM oscar_predictions
    WHERE user_id = ${userId}
      AND collective_id = ${collectiveId}
      AND nomination_id IN (
        SELECT id FROM oscar_nominations WHERE category = ${category}
      )
  `

  // Insert new prediction
  const result = await sql`
    INSERT INTO oscar_predictions (user_id, collective_id, nomination_id, ceremony)
    VALUES (${userId}, ${collectiveId}, ${nominationId}, ${ceremony})
    RETURNING id
  `

  return { id: result[0].id }
}

export async function deletePrediction(
  userId: string,
  collectiveId: string,
  category: string
): Promise<void> {
  await sql`
    DELETE FROM oscar_predictions
    WHERE user_id = ${userId}
      AND collective_id = ${collectiveId}
      AND nomination_id IN (
        SELECT id FROM oscar_nominations WHERE category = ${category}
      )
  `
}
