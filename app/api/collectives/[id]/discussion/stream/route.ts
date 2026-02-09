import type { NextRequest } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: collectiveId } = await params
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)

  if (!collectiveId || !/^[0-9a-f-]{36}$/i.test(collectiveId)) {
    return Response.json({ error: "Invalid collective ID" }, { status: 400 })
  }

  try {

    const messagesWithData = cursor
      ? await sql`
          WITH message_data AS (
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
              rm.content as reply_content,
              COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as reply_user_name
            FROM general_discussion_messages gdm
            JOIN users u ON u.id = gdm.user_id
            LEFT JOIN general_discussion_messages rm ON rm.id = gdm.reply_to_id
            LEFT JOIN users ru ON ru.id = rm.user_id
            WHERE gdm.collective_id = ${collectiveId}::uuid
              AND gdm.created_at > ${cursor}::timestamptz
            ORDER BY gdm.created_at ASC
            LIMIT ${limit}
          ),
          reaction_data AS (
            SELECT 
              gdr.message_id,
              json_agg(json_build_object(
                'id', gdr.id,
                'user_id', gdr.user_id,
                'reaction_type', gdr.reaction_type,
                'user_name', COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User')
              )) as reactions
            FROM general_discussion_reactions gdr
            JOIN users u ON u.id = gdr.user_id
            WHERE gdr.message_id IN (SELECT id FROM message_data)
            GROUP BY gdr.message_id
          )
          SELECT 
            md.*,
            COALESCE(rd.reactions, '[]'::json) as reactions
          FROM message_data md
          LEFT JOIN reaction_data rd ON rd.message_id = md.id
          ORDER BY md.created_at ASC
        `
      : await sql`
          WITH message_data AS (
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
              rm.content as reply_content,
              COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as reply_user_name
            FROM general_discussion_messages gdm
            JOIN users u ON u.id = gdm.user_id
            LEFT JOIN general_discussion_messages rm ON rm.id = gdm.reply_to_id
            LEFT JOIN users ru ON ru.id = rm.user_id
            WHERE gdm.collective_id = ${collectiveId}::uuid
            ORDER BY gdm.created_at DESC
            LIMIT ${limit}
          ),
          reaction_data AS (
            SELECT 
              gdr.message_id,
              json_agg(json_build_object(
                'id', gdr.id,
                'user_id', gdr.user_id,
                'reaction_type', gdr.reaction_type,
                'user_name', COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User')
              )) as reactions
            FROM general_discussion_reactions gdr
            JOIN users u ON u.id = gdr.user_id
            WHERE gdr.message_id IN (SELECT id FROM message_data)
            GROUP BY gdr.message_id
          )
          SELECT 
            md.*,
            COALESCE(rd.reactions, '[]'::json) as reactions
          FROM message_data md
          LEFT JOIN reaction_data rd ON rd.message_id = md.id
          ORDER BY md.created_at ASC
        `

    // Transform to expected format
    const messages = (messagesWithData || []).map((msg) => ({
      id: msg.id,
      collective_id: msg.collective_id,
      user_id: msg.user_id,
      content: msg.content,
      gif_url: msg.gif_url,
      reply_to_id: msg.reply_to_id,
      is_edited: msg.is_edited,
      is_deleted: msg.is_deleted,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      user_name: msg.user_name,
      user_avatar: msg.user_avatar,
      reactions: typeof msg.reactions === "string" ? JSON.parse(msg.reactions) : msg.reactions || [],
      reply_to: msg.reply_to_id
        ? {
            id: msg.reply_to_id,
            content: msg.reply_content,
            user_name: msg.reply_user_name,
          }
        : null,
    }))

    const nextCursor = messages.length > 0 ? messages[messages.length - 1].created_at : cursor

    return Response.json({
      messages,
      nextCursor,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error("[Discussion Stream] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isRateLimit = errorMessage.includes("Too Many")
    return Response.json(
      { error: isRateLimit ? "Rate limited - please wait" : "Failed to fetch messages" },
      { status: isRateLimit ? 429 : 500 },
    )
  }
}
