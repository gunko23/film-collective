import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import { getCollective } from "@/lib/collectives/collective-service"
import { getCollectiveActivityFeed, getCollectiveActivityCount } from "@/lib/feed/feed-service"
import { DashboardActivityItem, type Activity } from "@/components/dashboard/dashboard-activity-item"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CollectiveFeedPage({ params, searchParams }: Props) {
  const { id: collectiveId } = await params
  const { page: pageParam } = await searchParams
  const page = Number.parseInt(pageParam || "0", 10)

  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const collective = await getCollective(collectiveId)

  if (!collective) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-6 lg:pt-28 pb-24 lg:pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Collective not found</h1>
            <Link href="/collectives" className="text-accent hover:underline">
              Back to Collectives
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const collectiveName = collective.name
  const limit = 20
  const offset = page * limit

  const [activities, totalCount] = await Promise.all([
    getCollectiveActivityFeed(collectiveId, collectiveName, limit, offset, user.id),
    getCollectiveActivityCount(collectiveId),
  ])

  const total = totalCount
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-6 lg:pt-28 pb-24 lg:pb-16">
        <div className="mx-auto max-w-3xl px-6">
          {/* Back button */}
          <Link
            href={`/collectives/${collectiveId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to {collectiveName}
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{collectiveName} Feed</h1>
            <p className="text-muted-foreground">
              {total} activit{total !== 1 ? "ies" : "y"} from collective members
            </p>
          </div>

          {/* Activity Feed */}
          {(activities as Activity[]).length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-xl bg-card/30">
              <p className="text-muted-foreground mb-2">No activity yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to rate something!</p>
            </div>
          ) : (
            <div>
              {(activities as Activity[]).map((activity, i) => (
                <DashboardActivityItem
                  key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                  activity={activity}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 0 && (
                <Link
                  href={`/collectives/${collectiveId}/feed?page=${page - 1}`}
                  className="px-4 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              {page < totalPages - 1 && (
                <Link
                  href={`/collectives/${collectiveId}/feed?page=${page + 1}`}
                  className="px-4 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
