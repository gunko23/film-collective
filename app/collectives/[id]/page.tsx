import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import {
  getCollectiveById,
  getCollectiveMembers,
  getCollectiveMovieStats,
  getCollectiveRatings,
  getCollectiveGenreStats,
  getCollectiveDecadeStats,
  getCollectiveAnalytics,
  getMemberSimilarityData,
  getRatingDistribution,
  getControversialMovies,
  getUnanimousFavorites,
  getCollectiveTVShowStats,
  getCollectiveEpisodeStats,
  getCollectiveTVRatings,
  getCollectiveEpisodeRatings,
} from "@/lib/collectives/collective-service"
import { CollectiveActions } from "@/components/collective-actions"
import { CollectiveAnalytics } from "@/components/collective-analytics"
import { CollectivePageClient } from "@/components/collective-page-client"
import NewCollectiveForm from "@/components/new-collective-form"

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectiveDetailPage({ params }: Props) {
  const { id: collectiveId } = await params
  const user = await stackServerApp.getUser()

  if (collectiveId === "new") {
    return <NewCollectiveForm />
  }

  if (!user) {
    redirect("/handler/sign-in")
  }

  if (!isValidUUID(collectiveId)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Collective not found</h1>
            <p className="text-muted-foreground mb-6">This collective doesn't exist or you don't have access to it.</p>
            <Link href="/collectives">
              <Button variant="outline">Back to Collectives</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const [
    collective,
    members,
    movieStats,
    movieRatings,
    tvShowStats,
    episodeStats,
    tvRatings,
    episodeRatings,
    genreStats,
    decadeStats,
    analytics,
    memberSimilarity,
    ratingDistribution,
    controversialMovies,
    unanimousFavorites,
  ] = await Promise.all([
    getCollectiveById(collectiveId, user.id).catch(() => null),
    getCollectiveMembers(collectiveId).catch(() => []),
    getCollectiveMovieStats(collectiveId).catch(() => []),
    getCollectiveRatings(collectiveId).catch(() => []),
    getCollectiveTVShowStats(collectiveId).catch(() => []),
    getCollectiveEpisodeStats(collectiveId).catch(() => []),
    getCollectiveTVRatings(collectiveId).catch(() => []),
    getCollectiveEpisodeRatings(collectiveId).catch(() => []),
    getCollectiveGenreStats(collectiveId).catch(() => []),
    getCollectiveDecadeStats(collectiveId).catch(() => []),
    getCollectiveAnalytics(collectiveId).catch(() => ({
      total_movies_rated: 0,
      total_ratings: 0,
      avg_collective_score: 0,
      active_raters: 0,
    })),
    getMemberSimilarityData(collectiveId).catch(() => []),
    getRatingDistribution(collectiveId).catch(() => []),
    getControversialMovies(collectiveId).catch(() => []),
    getUnanimousFavorites(collectiveId).catch(() => []),
  ])

  if (!collective) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Collective not found</h1>
            <p className="text-muted-foreground mb-6">This collective doesn't exist or you don't have access to it.</p>
            <Link href="/collectives">
              <Button variant="outline">Back to Collectives</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const allRatings = [
    ...movieRatings.map((r: any) => ({ ...r, media_type: "movie" })),
    ...tvRatings.map((r: any) => ({ ...r, media_type: "tv" })),
    ...episodeRatings.map((r: any) => ({ ...r, media_type: "episode" })),
  ].sort((a: any, b: any) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime())

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/collectives"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All Collectives
          </Link>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{collective.name}</h1>
              {collective.description && <p className="text-muted-foreground">{collective.description}</p>}
            </div>
            <CollectiveActions
              collectiveId={collectiveId}
              collectiveName={collective.name}
              userRole={collective.user_role}
            />
          </div>

          <CollectivePageClient
            collectiveId={collectiveId}
            movieStats={movieStats}
            tvShowStats={tvShowStats}
            episodeStats={episodeStats}
            allRatings={allRatings}
            members={members}
            insightsContent={
              <CollectiveAnalytics
                analytics={analytics}
                genreStats={genreStats}
                decadeStats={decadeStats}
                ratingDistribution={ratingDistribution}
                memberSimilarity={memberSimilarity}
                controversialMovies={controversialMovies}
                unanimousFavorites={unanimousFavorites}
              />
            }
          />
        </div>
      </main>
    </div>
  )
}
