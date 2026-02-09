import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import Header from "@/components/header"
import { PublicUserProfile } from "@/components/public-user-profile"
export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  // Check if user exists
  const users = await sql`
    SELECT id FROM users WHERE id = ${userId}::uuid
  `.catch(() => [])

  if (users.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PublicUserProfile userId={userId} />
    </div>
  )
}
