import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Ensures a user exists in the public.users table
// This syncs from Stack Auth to our local users table
export async function ensureUserExists(user: {
  id: string
  email?: string | null
  displayName?: string | null
  profileImageUrl?: string | null
}): Promise<void> {
  await sql`
    INSERT INTO users (id, email, name, avatar_url)
    VALUES (
      ${user.id}::uuid,
      ${user.email || null},
      ${user.displayName || null},
      ${user.profileImageUrl || null}
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(${user.email || null}, users.email),
      name = COALESCE(${user.displayName || null}, users.name),
      avatar_url = COALESCE(${user.profileImageUrl || null}, users.avatar_url),
      updated_at = NOW()
  `
}
