import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Film, Tv, PlayCircle } from "lucide-react"
import Header from "@/components/header"
import { sql } from "@/lib/db"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { ConversationThread } from "@/components/conversation-thread"

type Props = {
  params: Promise<{ id: string; ratingId: string }>
}

type RatingInfo = {
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

async function getRatingInfo(ratingId: string): Promise<RatingInfo | null> {
  // Try movie first
  const movieResult = (await sql`
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
    INNER JOIN users u ON u.id = umr.user_id
    INNER JOIN movies m ON m.id = umr.movie_id
    WHERE umr.id = ${ratingId}
  `) as RatingInfo[]

  if (movieResult.length > 0) return movieResult[0]

  // Try TV show
  const tvResult = (await sql`
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
    INNER JOIN users u ON u.id = utr.user_id
    INNER JOIN tv_shows ts ON ts.id = utr.tv_show_id
    WHERE utr.id = ${ratingId}
  `) as RatingInfo[]

  if (tvResult.length > 0) return tvResult[0]

  // Try episode
  const episodeResult = (await sql`
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
    INNER JOIN users u ON u.id = uer.user_id
    INNER JOIN tv_episodes te ON te.id = uer.episode_id
    INNER JOIN tv_shows ts ON ts.id = te.tv_show_id
    WHERE uer.id = ${ratingId}
  `) as RatingInfo[]

  if (episodeResult.length > 0) return episodeResult[0]

  return null
}

async function getCollectiveName(collectiveId: string): Promise<string | null> {
  const result = (await sql`
    SELECT name FROM collectives WHERE id = ${collectiveId}
  `) as { name: string }[]
  return result[0]?.name || null
}

export default async function ConversationPage({ params }: Props) {
  const { id: collectiveId, ratingId } = await params

  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const [collectiveName, ratingInfo] = await Promise.all([getCollectiveName(collectiveId), getRatingInfo(ratingId)])

  if (!collectiveName || !ratingInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Conversation not found</h1>
            <Link href={`/collectives/${collectiveId}`} className="text-accent hover:underline">
              Back to Collective
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const score = Number(ratingInfo.overall_score) / 20
  const posterUrl =
    ratingInfo.media_type === "episode"
      ? getImageUrl(ratingInfo.poster_path, "w300")
      : getImageUrl(ratingInfo.poster_path, "w185")

  function getMediaLink() {
    if (ratingInfo.media_type === "movie") {
      return `/movies/${ratingInfo.tmdb_id}`
    } else if (ratingInfo.media_type === "tv") {
      return `/tv/${ratingInfo.tmdb_id}`
    } else {
      return `/tv/${ratingInfo.show_id}/season/${ratingInfo.season_number}`
    }
  }

  function getMediaIcon() {
    switch (ratingInfo.media_type) {
      case "movie":
        return <Film className="h-4 w-4" />
      case "tv":
        return <Tv className="h-4 w-4" />
      case "episode":
        return <PlayCircle className="h-4 w-4" />
      default:
        return <Film className="h-4 w-4" />
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-20 flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto max-w-2xl px-4 w-full flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-4 py-4 bg-background/80 backdrop-blur-sm">
            <Link href={`/collectives/${collectiveId}`} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">{ratingInfo.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getMediaIcon()}
                <span>{ratingInfo.user_name}&apos;s rating</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 bg-card/50 border border-border/50 rounded-xl p-4 mb-2 backdrop-blur-sm">
            <div className="flex gap-4">
              <Link href={getMediaLink()} className="flex-shrink-0">
                {posterUrl ? (
                  <Image
                    src={posterUrl || "/placeholder.svg"}
                    alt={ratingInfo.title}
                    width={ratingInfo.media_type === "episode" ? 100 : 60}
                    height={ratingInfo.media_type === "episode" ? 56 : 90}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[60px] h-[90px] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={getMediaLink()} className="hover:text-accent transition-colors">
                  <h2 className="font-semibold text-foreground">{ratingInfo.title}</h2>
                </Link>
                {ratingInfo.media_type === "episode" && (
                  <p className="text-sm text-muted-foreground">
                    {ratingInfo.show_name} - S{ratingInfo.season_number}E{ratingInfo.episode_number}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                    {ratingInfo.user_avatar ? (
                      <Image
                        src={ratingInfo.user_avatar || "/placeholder.svg"}
                        alt={ratingInfo.user_name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-accent">{ratingInfo.user_name[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{ratingInfo.user_name}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <StarRatingDisplay rating={score} size="md" />
                  <span className="font-semibold text-foreground">{score.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ConversationThread ratingId={ratingId} currentUserId={user.id} collectiveId={collectiveId} />
          </div>
        </div>
      </main>
    </div>
  )
}
