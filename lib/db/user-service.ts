import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Ensures a user exists in the public.users table
// This syncs from Stack Auth to our local users table
export async function ensureUserExists(
  id: string,
  email?: string | null,
  displayName?: string | null,
  profileImageUrl?: string | null,
): Promise<void> {
  if (!id) {
    throw new Error("User ID is required")
  }

  await sql`
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
  `
}
