"use client"

import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, Film, Calendar, ArrowLeft, TrendingUp, Award, RefreshCw } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import Header from "@/components/header"
import AuthErrorBoundary from "@/components/auth-error-boundary"

type RatedMovie = {
  id: string
  overallScore: number
  userComment: string | null
  ratedAt: string
  updatedAt: string
  movie: {
    tmdbId: number
    title: string
    posterPath: string | null
    releaseDate: string | null
    genres: { id: number; name: string }[]
  }
}

function ProfileContent() {
  const user = useUser()
  const router = useRouter()
  const [ratings, setRatings] = useState<RatedMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/handler/sign-in")
      return
    }

    async function fetchRatings() {
      try {
        const res = await fetch("/api/user/ratings")
        const text = await res.text()

        if (text.startsWith("Too Many") || res.status === 429) {
          throw new Error("Rate limited. Please wait a moment and try again.")
        }

        let data
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error("Failed to load ratings. Please try again.")
        }
        if (!res.ok) throw new Error(data.error || "Failed to fetch ratings")
        setRatings(data.ratings)
      } catch (err) {
        console.error("Error fetching ratings:", err)
        setError(err instanceof Error ? err.message : "Failed to load your ratings")
      } finally {
        setLoading(false)
      }
    }

    fetchRatings()
  }, [user, router])

  const getRatingLabel = (score: number) => {
    if (score >= 90) return "Masterpiece"
    if (score >= 75) return "Excellent"
    if (score >= 60) return "Great"
    if (score >= 50) return "Good"
    if (score >= 40) return "Average"
    if (score >= 25) return "Below Average"
    return "Poor"
  }

  const averageScore =
    ratings.length > 0 ? Math.round(ratings.reduce((sum, r) => sum + r.overallScore, 0) / ratings.length) : 0

  if (!user) return null

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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Discover
          </Link>

          {/* Profile header */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              {/* Avatar */}
              <div className="relative">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl || "/placeholder.svg"}
                    alt={user.displayName || "User"}
                    className="h-24 w-24 rounded-2xl ring-4 ring-accent/20 shadow-xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 ring-4 ring-accent/20 shadow-xl shadow-accent/20">
                    <span className="text-3xl font-bold text-accent-foreground">
                      {user.displayName?.charAt(0).toUpperCase() || user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                {/* Badge */}
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                  <Award className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">{user.displayName || "Film Enthusiast"}</h1>
                <p className="text-muted-foreground">{user.primaryEmail}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Film className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Movies Rated</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{ratings.length}</p>
              </div>
              <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Star className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Average Rating</span>
                </div>
                <p className="text-3xl font-bold text-accent">
                  {(averageScore / 20).toFixed(1)}
                  <span className="text-lg text-muted-foreground">/5</span>
                </p>
              </div>
              <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Top Genre</span>
                </div>
                <p className="text-xl font-bold text-foreground">Drama</p>
              </div>
              <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Member Since</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {new Date(user.signedUpAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Rated movies */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Your Rated Movies</h2>
              {ratings.length > 0 && <span className="text-sm text-muted-foreground">{ratings.length} films</span>}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] rounded-xl bg-muted" />
                    <div className="mt-3 h-4 rounded bg-muted w-3/4" />
                    <div className="mt-1 h-3 rounded bg-muted w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 rounded-2xl bg-card/30 border border-border/50">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
                  <Film className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No ratings yet</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Start rating movies to build your collection and share your taste with your collective
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40"
                >
                  <Film className="h-4 w-4" />
                  Discover Movies
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {ratings.map((rating) => (
                  <Link key={rating.id} href={`/movies/${rating.movie.tmdbId}`} className="group">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-500 hover-lift group-hover:shadow-xl group-hover:shadow-accent/10">
                      {rating.movie.posterPath ? (
                        <img
                          src={getImageUrl(rating.movie.posterPath, "w342") || "/placeholder.svg"}
                          alt={rating.movie.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-card to-muted">
                          <Film className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Rating badge - updated to 5-star scale */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm shadow-lg">
                        <Star className="h-3 w-3 text-accent fill-accent" />
                        <span className="text-xs font-bold text-foreground">
                          {(rating.overallScore / 20).toFixed(1)}
                        </span>
                      </div>

                      {/* Hover overlay content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <p className="text-xs text-accent font-semibold mb-1">{getRatingLabel(rating.overallScore)}</p>
                        {rating.userComment && (
                          <p className="text-xs text-white/70 line-clamp-3">"{rating.userComment}"</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {rating.movie.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {rating.movie.releaseDate?.split("-")[0] || "Unknown"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthErrorBoundary>
      <ProfileContent />
    </AuthErrorBoundary>
  )
}
