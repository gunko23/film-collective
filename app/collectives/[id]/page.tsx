import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import {
  getCollectiveById,
  getCollectiveMembers,
  getCollectiveMovieStats,
  getCollectiveGenreStats,
  getCollectiveDecadeStats,
  getCollectiveAnalytics,
  getMemberSimilarityData,
  getRatingDistribution,
  getControversialMovies,
  getUnanimousFavorites,
  getCollectiveTVShowStats,
  getCollectiveEpisodeStats,
} from "@/lib/collectives/collective-service"
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
    tvShowStats,
    episodeStats,
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
    getCollectiveTVShowStats(collectiveId).catch(() => []),
    getCollectiveEpisodeStats(collectiveId).catch(() => []),
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-28 pb-16">
        <CollectivePageClient
          collectiveId={collectiveId}
          currentUserId={user.id}
          currentUserName={user.displayName || undefined}
          collectiveName={collective.name}
          collectiveDescription={collective.description}
          userRole={collective.user_role}
          movieStats={movieStats}
          tvShowStats={tvShowStats}
          episodeStats={episodeStats}
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
      </main>
    </div>
  )
}
