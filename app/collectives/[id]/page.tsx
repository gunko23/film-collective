import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Crown, Shield, UserIcon } from "lucide-react"
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
} from "@/lib/collectives/collective-service"
import { CollectiveActions } from "@/components/collective-actions"
import { CollectiveAnalytics } from "@/components/collective-analytics"
import { CollectivePageClient } from "@/components/collective-page-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectiveDetailPage({ params }: Props) {
  const { id: collectiveId } = await params
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  const [
    collective,
    members,
    movieStats,
    allRatings,
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 text-amber-500" />
      case "admin":
        return <Shield className="h-3 w-3 text-accent" />
      default:
        return <UserIcon className="h-3 w-3 text-muted-foreground" />
    }
  }

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

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Collective Insights</h2>
            <CollectiveAnalytics
              analytics={analytics}
              genreStats={genreStats}
              decadeStats={decadeStats}
              ratingDistribution={ratingDistribution}
              memberSimilarity={memberSimilarity}
              controversialMovies={controversialMovies}
              unanimousFavorites={unanimousFavorites}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Members ({members.length})</h2>
            <div className="flex flex-wrap gap-3">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 border border-border/50"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url || "/placeholder.svg"}
                      alt={member.name || "Member"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                      <span className="text-xs font-semibold text-accent">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{member.name || member.email}</span>
                    {getRoleIcon(member.role)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CollectivePageClient collectiveId={collectiveId} movieStats={movieStats} allRatings={allRatings} />
        </div>
      </main>
    </div>
  )
}
