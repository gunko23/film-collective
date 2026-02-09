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
