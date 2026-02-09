import { sql } from "@/lib/db"

export async function getUserStreamingProviders(userId: string) {
  const rows = await sql`
    SELECT provider_id, provider_name
    FROM user_streaming_services
    WHERE user_id = ${userId}::uuid
    ORDER BY provider_name ASC
  `
  return rows
}

export async function setUserStreamingProviders(
  userId: string,
  providers: { providerId: number; providerName: string }[]
) {
  await sql`DELETE FROM user_streaming_services WHERE user_id = ${userId}::uuid`

  if (providers.length > 0) {
    for (const p of providers) {
      await sql`
        INSERT INTO user_streaming_services (user_id, provider_id, provider_name)
        VALUES (${userId}::uuid, ${p.providerId}, ${p.providerName})
        ON CONFLICT (user_id, provider_id) DO NOTHING
      `
    }
  }
}
