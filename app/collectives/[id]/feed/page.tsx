import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import { sql } from "@/lib/db"
import { DashboardActivityItem, type Activity } from "@/components/dashboard/dashboard-activity-item"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

async function getCollectiveActivity(collectiveId: string, collectiveName: string, page = 0, limit = 20) {
  const offset = page * limit

  const activities = (await sql`
    SELECT * FROM (
      -- Movie ratings
      SELECT
        'rating' as activity_type,
        umr.id as activity_id,
        umr.rated_at as created_at,
        u.id as actor_id,
        COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
        u.avatar_url as actor_avatar,
        m.tmdb_id,
        m.title as media_title,
        m.poster_path,
        'movie' as media_type,
        umr.overall_score as score,
        NULL as content,
        NULL as reaction_type,
        ${collectiveId}::uuid as collective_id,
        ${collectiveName} as collective_name,
        umr.id as rating_id,
        NULL as target_user_name
      FROM user_movie_ratings umr
      JOIN users u ON umr.user_id = u.id
      JOIN movies m ON umr.movie_id = m.id
      JOIN collective_memberships cm ON umr.user_id = cm.user_id AND cm.collective_id = ${collectiveId}

      UNION ALL

      -- TV show ratings
      SELECT
        'rating' as activity_type,
        utsr.id as activity_id,
        utsr.rated_at as created_at,
        u.id as actor_id,
        COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
        u.avatar_url as actor_avatar,
        ts.id as tmdb_id,
        ts.name as media_title,
        ts.poster_path,
        'tv' as media_type,
        utsr.overall_score as score,
        NULL as content,
        NULL as reaction_type,
        ${collectiveId}::uuid as collective_id,
        ${collectiveName} as collective_name,
        utsr.id as rating_id,
        NULL as target_user_name
      FROM user_tv_show_ratings utsr
      JOIN users u ON utsr.user_id = u.id
      JOIN tv_shows ts ON utsr.tv_show_id = ts.id
      JOIN collective_memberships cm ON utsr.user_id = cm.user_id AND cm.collective_id = ${collectiveId}

      UNION ALL

      -- Comments on ratings
      SELECT
        'comment' as activity_type,
        fc.id as activity_id,
        fc.created_at,
        u.id as actor_id,
        COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
        u.avatar_url as actor_avatar,
        COALESCE(m.tmdb_id, ts.id, 0)::int as tmdb_id,
        COALESCE(m.title, ts.name, 'Unknown') as media_title,
        COALESCE(m.poster_path, ts.poster_path) as poster_path,
        CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
        NULL as score,
        fc.content,
        NULL as reaction_type,
        fc.collective_id,
        ${collectiveName} as collective_name,
        fc.rating_id,
        COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
      FROM feed_comments fc
      JOIN users u ON fc.user_id = u.id
      LEFT JOIN user_movie_ratings umr ON fc.rating_id = umr.id
      LEFT JOIN movies m ON umr.movie_id = m.id
      LEFT JOIN user_tv_show_ratings utsr ON fc.rating_id = utsr.id
      LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
      LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
      WHERE fc.collective_id = ${collectiveId}

      UNION ALL

      -- Reactions on ratings
      SELECT
        'reaction' as activity_type,
        fr.id as activity_id,
        fr.created_at,
        u.id as actor_id,
        COALESCE(u.name, SPLIT_PART(u.email, '@', 1), 'User') as actor_name,
        u.avatar_url as actor_avatar,
        COALESCE(m.tmdb_id, ts.id, 0)::int as tmdb_id,
        COALESCE(m.title, ts.name, 'Unknown') as media_title,
        COALESCE(m.poster_path, ts.poster_path) as poster_path,
        CASE WHEN m.id IS NOT NULL THEN 'movie' ELSE 'tv' END as media_type,
        NULL as score,
        NULL as content,
        fr.reaction_type,
        fr.collective_id,
        ${collectiveName} as collective_name,
        fr.rating_id,
        COALESCE(ru.name, SPLIT_PART(ru.email, '@', 1), 'User') as target_user_name
      FROM feed_reactions fr
      JOIN users u ON fr.user_id = u.id
      LEFT JOIN user_movie_ratings umr ON fr.rating_id = umr.id
      LEFT JOIN movies m ON umr.movie_id = m.id
      LEFT JOIN user_tv_show_ratings utsr ON fr.rating_id = utsr.id
      LEFT JOIN tv_shows ts ON utsr.tv_show_id = ts.id
      LEFT JOIN users ru ON COALESCE(umr.user_id, utsr.user_id) = ru.id
      WHERE fr.collective_id = ${collectiveId}
    ) combined
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `) as Activity[]

  const countResult = (await sql`
    SELECT (
      (SELECT COUNT(*) FROM user_movie_ratings umr
       JOIN collective_memberships cm ON umr.user_id = cm.user_id AND cm.collective_id = ${collectiveId})
      +
      (SELECT COUNT(*) FROM user_tv_show_ratings utr
       JOIN collective_memberships cm ON utr.user_id = cm.user_id AND cm.collective_id = ${collectiveId})
      +
      (SELECT COUNT(*) FROM feed_comments WHERE collective_id = ${collectiveId})
      +
      (SELECT COUNT(*) FROM feed_reactions WHERE collective_id = ${collectiveId})
    ) as total
  `) as { total: string }[]

  const total = Number.parseInt(countResult[0]?.total || "0", 10)

  return { activities, total, totalPages: Math.ceil(total / limit) }
}

async function getCollectiveName(collectiveId: string): Promise<string | null> {
  const result = (await sql`
    SELECT name FROM collectives WHERE id = ${collectiveId}
  `) as { name: string }[]
  return result[0]?.name || null
}

export default async function CollectiveFeedPage({ params, searchParams }: Props) {
  const { id: collectiveId } = await params
  const { page: pageParam } = await searchParams
  const page = Number.parseInt(pageParam || "0", 10)

  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const collectiveName = await getCollectiveName(collectiveId)

  if (!collectiveName) {
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

  const { activities, total, totalPages } = await getCollectiveActivity(collectiveId, collectiveName, page)

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
          {activities.length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-xl bg-card/30">
              <p className="text-muted-foreground mb-2">No activity yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to rate something!</p>
            </div>
          ) : (
            <div>
              {activities.map((activity, i) => (
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
