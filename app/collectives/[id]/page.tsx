import { stackServerApp } from "@/stack"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Star, Film, ArrowLeft, Crown, Shield, UserIcon } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/tmdb/image"
import {
  getCollectiveById,
  getCollectiveMembers,
  getCollectiveMovieStats,
  getCollectiveRatings,
} from "@/lib/collectives/collective-service"
import { CollectiveActions } from "@/components/collective-actions"

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectiveDetailPage({ params }: Props) {
  const { id: collectiveId } = await params
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/handler/sign-in")
  }

  // Fetch all data directly from database
  const [collective, members, movieStats, recentRatings] = await Promise.all([
    getCollectiveById(collectiveId, user.id).catch(() => null),
    getCollectiveMembers(collectiveId).catch(() => []),
    getCollectiveMovieStats(collectiveId).catch(() => []),
    getCollectiveRatings(collectiveId, 10).catch(() => []),
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

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Back button */}
          <Link
            href="/collectives"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All Collectives
          </Link>

          {/* Header */}
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

          {/* Members */}
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

          {/* Top Rated Movies */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Collective Top Movies</h2>
            {movieStats.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
                <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No movies rated yet. Start rating to see collective stats!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movieStats.slice(0, 10).map((movie: any) => (
                  <Link key={movie.tmdb_id} href={`/movies/${movie.tmdb_id}`} className="group">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-300">
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, "w342") || "/placeholder.svg"}
                          alt={movie.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Rating badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-xs font-bold">{(Number(movie.avg_score) / 20).toFixed(1)}</span>
                      </div>
                      {/* Rating count badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                        <span className="text-xs text-muted-foreground">
                          {movie.rating_count} {movie.rating_count === 1 ? "rating" : "ratings"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {movie.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            {recentRatings.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
                <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No recent activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRatings.map((rating: any, idx: number) => (
                  <div
                    key={`${rating.user_id}-${rating.tmdb_id}-${idx}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50"
                  >
                    {/* User avatar */}
                    {rating.user_avatar ? (
                      <img
                        src={rating.user_avatar || "/placeholder.svg"}
                        alt={rating.user_name || "User"}
                        className="h-10 w-10 rounded-full shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 shrink-0">
                        <span className="text-sm font-semibold text-accent">
                          {(rating.user_name || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Movie poster */}
                    <Link href={`/movies/${rating.tmdb_id}`} className="shrink-0">
                      <div className="w-12 h-18 rounded-lg overflow-hidden bg-muted">
                        {rating.poster_path ? (
                          <img
                            src={getImageUrl(rating.poster_path, "w92") || "/placeholder.svg"}
                            alt={rating.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Film className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                    </Link>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{rating.user_name || "Someone"}</span>
                        {" rated "}
                        <Link
                          href={`/movies/${rating.tmdb_id}`}
                          className="font-medium hover:text-accent transition-colors"
                        >
                          {rating.title}
                        </Link>
                      </p>
                      {rating.user_comment && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">"{rating.user_comment}"</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(rating.rated_at).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 shrink-0">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span className="text-sm font-bold text-accent">
                        {(Number(rating.overall_score) / 20).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
