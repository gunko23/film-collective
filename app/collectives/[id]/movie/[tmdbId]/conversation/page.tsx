import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Film, Tv, Star } from "lucide-react"
import Header from "@/components/header"
import { sql } from "@/lib/db"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"
import { MovieConversationThread } from "@/components/movie-conversation-thread"

type Props = {
  params: Promise<{ id: string; tmdbId: string }>
  searchParams: Promise<{ type?: string }>
}

type MediaInfo = {
  tmdb_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  overview: string | null
  vote_average: number | null
  media_type: "movie" | "tv"
}

type RatingStats = {
  avg_score: number | null
  rating_count: number
  raters: { user_name: string; user_avatar: string | null; score: number }[]
}

async function getMediaInfo(tmdbId: number, mediaType: "movie" | "tv"): Promise<MediaInfo | null> {
  if (mediaType === "tv") {
    const result = (await sql`
      SELECT 
        id::int as tmdb_id,
        name as title,
        poster_path,
        first_air_date as release_date,
        overview,
        vote_average,
        'tv' as media_type
      FROM tv_shows
      WHERE id = ${tmdbId}
    `) as MediaInfo[]
    return result[0] || null
  }

  const result = (await sql`
    SELECT 
      tmdb_id::int,
      title,
      poster_path,
      release_date,
      overview,
      tmdb_vote_average as vote_average,
      'movie' as media_type
    FROM movies
    WHERE tmdb_id = ${tmdbId}
  `) as MediaInfo[]
  return result[0] || null
}

async function getCollectiveRatingStats(
  collectiveId: string,
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<RatingStats> {
  if (mediaType === "tv") {
    const result = await sql`
      SELECT 
        AVG(utr.overall_score)::float as avg_score,
        COUNT(*)::int as rating_count,
        json_agg(json_build_object(
          'user_name', u.name,
          'user_avatar', u.avatar_url,
          'score', utr.overall_score
        )) as raters
      FROM user_tv_show_ratings utr
      JOIN users u ON u.id = utr.user_id
      JOIN collective_memberships cm ON cm.user_id = utr.user_id AND cm.collective_id = ${collectiveId}
      WHERE utr.tv_show_id = ${tmdbId}
    `
    return {
      avg_score: result[0]?.avg_score ? Number(result[0].avg_score) / 20 : null,
      rating_count: result[0]?.rating_count || 0,
      raters: result[0]?.raters?.filter((r: any) => r.user_name) || [],
    }
  }

  const result = await sql`
    SELECT 
      AVG(umr.overall_score)::float as avg_score,
      COUNT(*)::int as rating_count,
      json_agg(json_build_object(
        'user_name', u.name,
        'user_avatar', u.avatar_url,
        'score', umr.overall_score
      )) as raters
    FROM user_movie_ratings umr
    JOIN movies m ON m.id = umr.movie_id
    JOIN users u ON u.id = umr.user_id
    JOIN collective_memberships cm ON cm.user_id = umr.user_id AND cm.collective_id = ${collectiveId}
    WHERE m.tmdb_id = ${tmdbId}
  `
  return {
    avg_score: result[0]?.avg_score ? Number(result[0].avg_score) / 20 : null,
    rating_count: result[0]?.rating_count || 0,
    raters: result[0]?.raters?.filter((r: any) => r.user_name) || [],
  }
}

async function getCollectiveName(collectiveId: string): Promise<string | null> {
  const result = (await sql`
    SELECT name FROM collectives WHERE id = ${collectiveId}
  `) as { name: string }[]
  return result[0]?.name || null
}

async function getInitialComments(collectiveId: string, tmdbId: number, mediaType: "movie" | "tv") {
  const comments = await sql`
    SELECT 
      mc.id,
      mc.content,
      mc.gif_url,
      mc.created_at,
      mc.user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      COALESCE(
        (SELECT json_agg(json_build_object(
          'id', mcr.id,
          'reaction_type', mcr.reaction_type,
          'user_id', mcr.user_id,
          'user_name', ru.name
        ))
        FROM movie_comment_reactions mcr
        JOIN users ru ON ru.id = mcr.user_id
        WHERE mcr.comment_id = mc.id),
        '[]'
      ) as reactions
    FROM movie_comments mc
    JOIN users u ON u.id = mc.user_id
    WHERE mc.collective_id = ${collectiveId}
      AND mc.tmdb_id = ${tmdbId}
      AND mc.media_type = ${mediaType}
    ORDER BY mc.created_at ASC
  `
  return comments
}

export default async function MovieConversationPage({ params, searchParams }: Props) {
  const { id: collectiveId, tmdbId } = await params
  const { type } = await searchParams
  const mediaType = (type === "tv" ? "tv" : "movie") as "movie" | "tv"

  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const [collectiveName, mediaInfo, ratingStats, initialComments] = await Promise.all([
    getCollectiveName(collectiveId),
    getMediaInfo(Number.parseInt(tmdbId), mediaType),
    getCollectiveRatingStats(collectiveId, Number.parseInt(tmdbId), mediaType),
    getInitialComments(collectiveId, Number.parseInt(tmdbId), mediaType),
  ])

  if (!collectiveName || !mediaInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Content not found</h1>
            <Link href={`/collectives/${collectiveId}`} className="text-accent hover:underline">
              Back to Collective
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const posterUrl = getImageUrl(mediaInfo.poster_path, "w185")
  const mediaLink = mediaType === "tv" ? `/tv/${mediaInfo.tmdb_id}` : `/movies/${mediaInfo.tmdb_id}`

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-20 flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto max-w-2xl px-4 w-full flex-1 flex flex-col overflow-hidden">
          {/* Sticky header with back button */}
          <div className="flex-shrink-0 flex items-center gap-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30">
            <Link href={`/collectives/${collectiveId}`} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">{mediaInfo.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {mediaType === "tv" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                <span>Discussion in {collectiveName}</span>
              </div>
            </div>
          </div>

          {/* Sticky media card */}
          <div className="flex-shrink-0 bg-card/50 border border-border/50 rounded-xl p-3 my-2 backdrop-blur-sm">
            <div className="flex gap-3">
              <Link href={mediaLink} className="flex-shrink-0">
                {posterUrl ? (
                  <Image
                    src={posterUrl || "/placeholder.svg"}
                    alt={mediaInfo.title}
                    width={50}
                    height={75}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[50px] h-[75px] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={mediaLink} className="hover:text-accent transition-colors">
                  <h2 className="font-semibold text-foreground text-sm">{mediaInfo.title}</h2>
                </Link>
                {mediaInfo.release_date && (
                  <p className="text-xs text-muted-foreground">{new Date(mediaInfo.release_date).getFullYear()}</p>
                )}

                {/* Collective rating stats */}
                {ratingStats.rating_count > 0 ? (
                  <div className="mt-1">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-foreground text-sm">{ratingStats.avg_score?.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({ratingStats.rating_count} {ratingStats.rating_count === 1 ? "rating" : "ratings"})
                      </span>
                    </div>
                    <div className="flex -space-x-1.5 mt-1.5">
                      {ratingStats.raters.slice(0, 5).map((rater, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-background"
                          title={`${rater.user_name}: ${(rater.score / 20).toFixed(1)}`}
                        >
                          {rater.user_avatar ? (
                            <Image
                              src={rater.user_avatar || "/placeholder.svg"}
                              alt={rater.user_name}
                              width={20}
                              height={20}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[7px] font-medium text-accent">
                              {rater.user_name[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      ))}
                      {ratingStats.rating_count > 5 && (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                          <span className="text-[7px] font-medium text-muted-foreground">
                            +{ratingStats.rating_count - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No ratings yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Conversation thread - takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <MovieConversationThread
              collectiveId={collectiveId}
              tmdbId={Number.parseInt(tmdbId)}
              mediaType={mediaType}
              currentUserId={user.id}
              initialComments={initialComments as any}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
