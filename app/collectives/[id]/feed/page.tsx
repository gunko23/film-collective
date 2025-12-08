import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Film, Tv, PlayCircle } from "lucide-react"
import Header from "@/components/header"
import { sql } from "@/lib/db"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { EnhancedComments } from "@/components/enhanced-comments"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

type FeedItem = {
  rating_id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  tmdb_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  overall_score: number
  user_comment: string | null
  rated_at: string
  media_type: "movie" | "tv" | "episode"
  episode_number?: number
  season_number?: number
  show_name?: string
  show_id?: number
}

async function getCollectiveFeed(collectiveId: string, page = 0, limit = 20) {
  const offset = page * limit

  const feedItems = (await sql`
    (
      SELECT 
        umr.id as rating_id,
        umr.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        m.tmdb_id::int as tmdb_id,
        m.title,
        m.poster_path,
        m.release_date,
        umr.overall_score,
        umr.user_comment,
        umr.rated_at,
        'movie' as media_type,
        NULL::int as episode_number,
        NULL::int as season_number,
        NULL as show_name,
        NULL::int as show_id
      FROM user_movie_ratings umr
      INNER JOIN collective_memberships cm ON cm.user_id = umr.user_id AND cm.collective_id = ${collectiveId}
      INNER JOIN users u ON u.id = umr.user_id
      INNER JOIN movies m ON m.id = umr.movie_id
    )
    UNION ALL
    (
      SELECT 
        utr.id as rating_id,
        utr.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        ts.id::int as tmdb_id,
        ts.name as title,
        ts.poster_path,
        ts.first_air_date as release_date,
        utr.overall_score,
        NULL as user_comment,
        utr.rated_at,
        'tv' as media_type,
        NULL::int as episode_number,
        NULL::int as season_number,
        NULL as show_name,
        NULL::int as show_id
      FROM user_tv_show_ratings utr
      INNER JOIN collective_memberships cm ON cm.user_id = utr.user_id AND cm.collective_id = ${collectiveId}
      INNER JOIN users u ON u.id = utr.user_id
      INNER JOIN tv_shows ts ON ts.id = utr.tv_show_id
    )
    UNION ALL
    (
      SELECT 
        uer.id as rating_id,
        uer.user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        te.id::int as tmdb_id,
        te.name as title,
        te.still_path as poster_path,
        te.air_date as release_date,
        uer.overall_score,
        NULL as user_comment,
        uer.rated_at,
        'episode' as media_type,
        te.episode_number,
        te.season_number,
        ts.name as show_name,
        ts.id::int as show_id
      FROM user_episode_ratings uer
      INNER JOIN collective_memberships cm ON cm.user_id = uer.user_id AND cm.collective_id = ${collectiveId}
      INNER JOIN users u ON u.id = uer.user_id
      INNER JOIN tv_episodes te ON te.id = uer.episode_id
      INNER JOIN tv_shows ts ON ts.id = te.tv_show_id
    )
    ORDER BY rated_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `) as FeedItem[]

  const countResult = (await sql`
    SELECT (
      (SELECT COUNT(*) FROM user_movie_ratings umr 
       INNER JOIN collective_memberships cm ON cm.user_id = umr.user_id AND cm.collective_id = ${collectiveId})
      +
      (SELECT COUNT(*) FROM user_tv_show_ratings utr 
       INNER JOIN collective_memberships cm ON cm.user_id = utr.user_id AND cm.collective_id = ${collectiveId})
      +
      (SELECT COUNT(*) FROM user_episode_ratings uer 
       INNER JOIN collective_memberships cm ON cm.user_id = uer.user_id AND cm.collective_id = ${collectiveId})
    ) as total
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

  function getMediaLink(item: FeedItem) {
    if (item.media_type === "movie") {
      return `/movies/${item.tmdb_id}`
    } else if (item.media_type === "tv") {
      return `/tv/${item.tmdb_id}`
    } else {
      return `/tv/${item.show_id}/season/${item.season_number}`
    }
  }

  function getMediaIcon(type: string) {
    switch (type) {
      case "movie":
        return <Film className="h-3 w-3" />
      case "tv":
        return <Tv className="h-3 w-3" />
      case "episode":
        return <PlayCircle className="h-3 w-3" />
      default:
        return <Film className="h-3 w-3" />
    }
  }

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
              <p className="text-sm text-muted-foreground/70">Be the first to rate something!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => {
                const score = Number(item.overall_score) / 20
                const posterUrl =
                  item.media_type === "episode"
                    ? getImageUrl(item.poster_path, "w300")
                    : getImageUrl(item.poster_path, "w185")
                const year = item.release_date ? new Date(item.release_date).getFullYear() : null

                return (
                  <div
                    key={`${item.media_type}-${item.rating_id}`}
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
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.user_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.rated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                        {getMediaIcon(item.media_type)}
                        <span className="capitalize">{item.media_type}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex gap-4">
                      <Link href={getMediaLink(item)} className="flex-shrink-0">
                        {posterUrl ? (
                          <Image
                            src={posterUrl || "/placeholder.svg"}
                            alt={item.title}
                            width={item.media_type === "episode" ? 120 : 80}
                            height={item.media_type === "episode" ? 68 : 120}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`${item.media_type === "episode" ? "w-[120px] h-[68px]" : "w-20 h-[120px]"} bg-muted rounded-lg flex items-center justify-center`}
                          >
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={getMediaLink(item)} className="hover:text-accent transition-colors">
                          <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                        </Link>
                        {item.media_type === "episode" && (
                          <p className="text-sm text-muted-foreground">
                            {item.show_name} - S{item.season_number}E{item.episode_number}
                          </p>
                        )}
                        {year && item.media_type !== "episode" && (
                          <p className="text-sm text-muted-foreground">{year}</p>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-2 mt-2">
                          <StarRatingDisplay rating={score} size="md" />
                          <span className="text-sm font-medium text-foreground">{score.toFixed(1)}</span>
                        </div>

                        {/* Comment (movies only for now) */}
                        {item.user_comment && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3">"{item.user_comment}"</p>
                        )}
                      </div>
                    </div>

                    {/* Interactions */}
                    <EnhancedComments
                      ratingId={item.rating_id}
                      currentUserId={user.id}
                      collectiveId={collectiveId}
                      mediaTitle={item.title}
                    />
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
