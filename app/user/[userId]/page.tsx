import { notFound } from "next/navigation"
import { userExists } from "@/lib/db/user-service"
import Header from "@/components/header"
import { PublicUserProfile } from "@/components/public-user-profile"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const exists = await userExists(userId).catch(() => false)

  if (!exists) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PublicUserProfile userId={userId} />
    </div>
  )
}
