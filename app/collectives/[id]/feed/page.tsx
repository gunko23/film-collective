import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import { sql } from "@/lib/db"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"
import { Star } from "lucide-react"
import { FeedItemInteractions } from "@/components/feed-item-interactions"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

type FeedItem = {
  rating_id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  movie_id: string
  tmdb_id: number
  movie_title: string
  poster_path: string | null
  release_date: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
}

async function getCollectiveFeed(collectiveId: string, page = 0, limit = 10) {
  const offset = page * limit

  // Simple query to get feed items
  const feedItems = (await sql`
    SELECT 
      umr.id as rating_id,
      umr.user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      umr.movie_id,
      m.tmdb_id,
      m.title as movie_title,
      m.poster_path,
      m.release_date,
      umr.overall_score,
      umr.user_comment,
      umr.rated_at
    FROM user_movie_ratings umr
    INNER JOIN collective_memberships cm ON cm.user_id = umr.user_id AND cm.collective_id = ${collectiveId}
    INNER JOIN users u ON u.id = umr.user_id
    INNER JOIN movies m ON m.id = umr.movie_id
    ORDER BY umr.rated_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `) as FeedItem[]

  // Get total count for pagination
  const countResult = (await sql`
    SELECT COUNT(*) as total
    FROM user_movie_ratings umr
    INNER JOIN collective_memberships cm ON cm.user_id = umr.user_id AND cm.collective_id = ${collectiveId}
  `) as { total: string }[]

  const total = Number.parseInt(countResult[0]?.total || "0", 10)

  return { feedItems, total, totalPages: Math.ceil(total / limit) }
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
        <main className="pt-28 pb-16">
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

  const { feedItems, total, totalPages } = await getCollectiveFeed(collectiveId, page)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-28 pb-16">
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
              {total} rating{total !== 1 ? "s" : ""} from collective members
            </p>
          </div>

          {/* Feed Items */}
          {feedItems.length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-xl bg-card/30">
              <p className="text-muted-foreground mb-2">No activity yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to rate a movie!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => {
                const score = Number(item.overall_score) / 20 // Convert 0-100 to 0-5
                const posterUrl = getImageUrl(item.poster_path, "w185")
                const year = item.release_date ? new Date(item.release_date).getFullYear() : null

                return (
                  <div
                    key={item.rating_id}
                    className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm p-4 hover:border-accent/30 transition-colors"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                        {item.user_avatar ? (
                          <Image
                            src={item.user_avatar || "/placeholder.svg"}
                            alt={item.user_name || "User"}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-accent">
                            {(item.user_name || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.user_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.rated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Movie info */}
                    <div className="flex gap-4">
                      <Link href={`/movies/${item.tmdb_id}`} className="flex-shrink-0">
                        {posterUrl ? (
                          <Image
                            src={posterUrl || "/placeholder.svg"}
                            alt={item.movie_title}
                            width={80}
                            height={120}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-[120px] bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No poster</span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/movies/${item.tmdb_id}`} className="hover:text-accent transition-colors">
                          <h3 className="font-semibold text-foreground truncate">{item.movie_title}</h3>
                        </Link>
                        {year && <p className="text-sm text-muted-foreground">{year}</p>}

                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= score
                                  ? "fill-accent text-accent"
                                  : star - 0.5 <= score
                                    ? "fill-accent/50 text-accent"
                                    : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium text-foreground">{score.toFixed(1)}</span>
                        </div>

                        {/* Comment */}
                        {item.user_comment && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3">"{item.user_comment}"</p>
                        )}
                      </div>
                    </div>

                    {/* Interactions (reactions & comments) */}
                    <FeedItemInteractions ratingId={item.rating_id} currentUserId={user.id} />
                  </div>
                )
              })}
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
