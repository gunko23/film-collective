import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Film, Tv, Star } from "lucide-react"
import Header from "@/components/header"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"
import { MovieConversationThread } from "@/components/movie-conversation-thread"
import { getCollective } from "@/lib/collectives/collective-service"
import { getCollectiveMediaRatingStats } from "@/lib/collectives/collective-service"
import { getMediaInfo } from "@/lib/tmdb/movie-service"
import { getMovieConversationComments } from "@/lib/feed/feed-service"

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

export default async function MovieConversationPage({ params, searchParams }: Props) {
  const { id: collectiveId, tmdbId } = await params
  const { type } = await searchParams
  const mediaType = (type === "tv" ? "tv" : "movie") as "movie" | "tv"

  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const [collective, mediaInfo, ratingStats, initialComments] = await Promise.all([
    getCollective(collectiveId),
    getMediaInfo(Number.parseInt(tmdbId), mediaType),
    getCollectiveMediaRatingStats(collectiveId, Number.parseInt(tmdbId), mediaType),
    getMovieConversationComments(collectiveId, Number.parseInt(tmdbId), mediaType),
  ])

  const collectiveName = collective?.name || null

  if (!collectiveName || !mediaInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-6 lg:pt-28 pb-24 lg:pb-16">
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
    <div className="fixed inset-0 bg-background flex flex-col">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      {/* Main content area - fixed height container */}
      <div className="relative z-10 pt-4 lg:pt-20 flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto max-w-2xl px-4 w-full flex-1 flex flex-col overflow-hidden">
          {/* Sticky header with back button - fixed at top of content */}
          <div className="flex-shrink-0 flex items-center gap-4 py-3 bg-background border-b border-border/30">
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

          {/* Sticky media card - fixed below header */}
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
                      {ratingStats.raters.slice(0, 5).map((rater: any, i: number) => (
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

          {/* Conversation thread - fills remaining space with internal scroll */}
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
      </div>
    </div>
  )
}
