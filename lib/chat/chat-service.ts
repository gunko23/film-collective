import { sql } from "@/lib/db"

/**
 * Checks if a user is a member of a collective.
 */
export async function verifyCollectiveMembership(collectiveId: string, userId: string): Promise<boolean> {
  const membership = await sql`
    SELECT id FROM collective_memberships
    WHERE collective_id = ${collectiveId}::uuid AND user_id = ${userId}::uuid
  `
  return membership.length > 0
}

/**
 * Fetches discussion messages for a collective with pagination, reactions, and reply info.
 * Returns messages in reverse chronological order (newest first).
 */
export async function getDiscussionMessages(collectiveId: string, options: { before?: string, limit: number }) {
  const { before, limit } = options

  const messages = before
    ? await sql`
        SELECT
          gdm.id,
          gdm.collective_id,
          gdm.user_id,
          gdm.content,
          gdm.gif_url,
          gdm.reply_to_id,
          gdm.is_edited,
          gdm.is_deleted,
          gdm.created_at,
          gdm.updated_at,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
          u.avatar_url as user_avatar,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', gdr.id,
              'user_id', gdr.user_id,
              'user_name', COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User'),
              'reaction_type', gdr.reaction_type
            ))
            FROM general_discussion_reactions gdr
            JOIN users ru ON ru.id = gdr.user_id
            WHERE gdr.message_id = gdm.id),
            '[]'
          ) as reactions,
          CASE WHEN gdm.reply_to_id IS NOT NULL THEN
            (SELECT json_build_object(
              'id', rm.id,
              'content', rm.content,
              'user_name', COALESCE(rmu.name, SPLIT_PART(rmu.email, '@', 1), 'User')
            )
            FROM general_discussion_messages rm
            JOIN users rmu ON rmu.id = rm.user_id
            WHERE rm.id = gdm.reply_to_id)
          ELSE NULL END as reply_to
        FROM general_discussion_messages gdm
        JOIN users u ON u.id = gdm.user_id
        WHERE gdm.collective_id = ${collectiveId}::uuid
          AND gdm.created_at < (
            SELECT created_at FROM general_discussion_messages WHERE id = ${before}::uuid
          )
        ORDER BY gdm.created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          gdm.id,
          gdm.collective_id,
          gdm.user_id,
          gdm.content,
          gdm.gif_url,
          gdm.reply_to_id,
          gdm.is_edited,
          gdm.is_deleted,
          gdm.created_at,
          gdm.updated_at,
          COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name,
          u.avatar_url as user_avatar,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', gdr.id,
              'user_id', gdr.user_id,
              'user_name', COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User'),
              'reaction_type', gdr.reaction_type
            ))
            FROM general_discussion_reactions gdr
            JOIN users ru ON ru.id = gdr.user_id
            WHERE gdr.message_id = gdm.id),
            '[]'
          ) as reactions,
          CASE WHEN gdm.reply_to_id IS NOT NULL THEN
            (SELECT json_build_object(
              'id', rm.id,
              'content', rm.content,
              'user_name', COALESCE(rmu.name, SPLIT_PART(rmu.email, '@', 1), 'User')
            )
            FROM general_discussion_messages rm
            JOIN users rmu ON rmu.id = rm.user_id
            WHERE rm.id = gdm.reply_to_id)
          ELSE NULL END as reply_to
        FROM general_discussion_messages gdm
        JOIN users u ON u.id = gdm.user_id
        WHERE gdm.collective_id = ${collectiveId}::uuid
        ORDER BY gdm.created_at DESC
        LIMIT ${limit}
      `

  return messages
}

/**
 * Upserts a read receipt for a user in a collective discussion.
 */
export async function updateReadReceipt(collectiveId: string, userId: string, messageId: string) {
  await sql`
    INSERT INTO general_discussion_read_receipts (collective_id, user_id, last_read_message_id, last_read_at)
    VALUES (${collectiveId}::uuid, ${userId}::uuid, ${messageId}::uuid, NOW())
    ON CONFLICT (collective_id, user_id)
    DO UPDATE SET last_read_message_id = ${messageId}::uuid, last_read_at = NOW()
  `.catch(() => {})
}

/**
 * Creates a new discussion message and returns it along with reply_to info if applicable.
 */
export async function createDiscussionMessage(
  collectiveId: string,
  userId: string,
  data: { content?: string, gifUrl?: string | null, replyToId?: string | null }
) {
  const { content, gifUrl, replyToId } = data

  const result = await sql`
    INSERT INTO general_discussion_messages (collective_id, user_id, content, gif_url, reply_to_id)
    VALUES (${collectiveId}::uuid, ${userId}::uuid, ${content?.trim() || ""}, ${gifUrl || null}, ${replyToId || null})
    RETURNING id, collective_id, user_id, content, gif_url, reply_to_id, is_edited, is_deleted, created_at, updated_at
  `

  const message = result[0]

  // Get reply info if exists
  let replyTo = null
  if (message.reply_to_id) {
    const replyResult = await sql`
      SELECT gdm.id, gdm.content, COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as user_name
      FROM general_discussion_messages gdm
      JOIN users u ON u.id = gdm.user_id
      WHERE gdm.id = ${message.reply_to_id}::uuid
    `
    if (replyResult.length > 0) {
      replyTo = replyResult[0]
    }
  }

  return { message, replyTo }
}

/**
 * Gets the name of a collective by ID. Returns "Collective" if not found.
 */
export async function getCollectiveName(collectiveId: string): Promise<string> {
  const collectiveInfo = await sql`
    SELECT name FROM collectives WHERE id = ${collectiveId}::uuid
  `
  return collectiveInfo[0]?.name || "Collective"
}

/**
 * Toggles a reaction on a message. If the reaction exists, removes it; otherwise adds it.
 * Returns { action: "added" | "removed" }.
 */
export async function toggleMessageReaction(
  messageId: string,
  userId: string,
  reactionType: string
): Promise<{ action: string }> {
  // Check if reaction exists
  const existing = await sql`
    SELECT id FROM general_discussion_reactions
    WHERE message_id = ${messageId}::uuid
      AND user_id = ${userId}::uuid
      AND reaction_type = ${reactionType}
  `

  let action: string

  if (existing.length > 0) {
    // Remove reaction
    await sql`
      DELETE FROM general_discussion_reactions
      WHERE id = ${existing[0].id}::uuid
    `
    action = "removed"
  } else {
    // Add reaction
    await sql`
      INSERT INTO general_discussion_reactions (message_id, user_id, reaction_type)
      VALUES (${messageId}::uuid, ${userId}::uuid, ${reactionType})
    `
    action = "added"
  }

  return { action }
}
