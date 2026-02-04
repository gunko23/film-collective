"use client"

import { useUser, useStackApp } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Star, Film, Calendar, ArrowLeft, TrendingUp, Award, RefreshCw, Heart, Compass, Users, Info, Settings, LayoutDashboard, User, LogOut } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import Header from "@/components/header"
import AuthErrorBoundary from "@/components/auth-error-boundary"
import { StarRatingDisplay } from "@/components/star-rating-display"
import { PushNotificationToggle } from "@/components/push-notification-toggle"
import { LetterboxdImport } from "@/components/letterboxd-import"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

type FavoriteMovie = {
  tmdb_id: number
  title: string
  poster_path: string | null
  position: number
}

function ProfileContent() {
  const user = useUser()
  const app = useStackApp()
  const router = useRouter()
  const [ratings, setRatings] = useState<RatedMovie[]>([])
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryCount * 2000))
      }

      const [ratingsRes, favoritesRes] = await Promise.all([
        fetch("/api/user/ratings"),
        fetch(`/api/user/${user.id}/profile`),
      ])

      const ratingsText = await ratingsRes.text()

      if (!ratingsRes.ok) {
        if (ratingsRes.status === 429 || ratingsText.includes("Too Many") || ratingsText.includes("Rate limit")) {
          throw new Error("Rate limited. Please wait a moment and try again.")
        }
        throw new Error("Failed to load ratings. Please try again.")
      }

      let ratingsData
      try {
        ratingsData = JSON.parse(ratingsText)
      } catch {
        throw new Error("Failed to load ratings. Please try again.")
      }
      setRatings(ratingsData.ratings || [])
      setRetryCount(0)

      const favoritesText = await favoritesRes.text()

      if (favoritesRes.ok) {
        try {
          const favoritesData = JSON.parse(favoritesText)
          setFavorites(favoritesData.favorites || [])
        } catch {
          console.warn("Failed to parse favorites data")
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load your data")
    } finally {
      setLoading(false)
    }
  }, [user, retryCount])

  useEffect(() => {
    if (!user) {
      router.push("/handler/sign-in")
      return
    }

    fetchData()
  }, [user, router, fetchData])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    fetchData()
  }

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

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]" />
      </div>

      <main className="relative z-10 pt-6 lg:pt-28 pb-24 lg:pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Discover
          </Link>

          <div className="mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background rounded-2xl">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl || "/placeholder.svg"}
                        alt={user.displayName || "User"}
                        className="h-28 w-28 rounded-2xl ring-4 ring-accent/20 shadow-xl"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/80 ring-4 ring-accent/20 shadow-xl shadow-accent/20">
                        <span className="text-4xl font-bold text-accent-foreground">
                          {user.displayName?.charAt(0).toUpperCase() || user.primaryEmail?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                      <Award className="h-4 w-4" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{user.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/discover" className="flex items-center gap-2 cursor-pointer">
                      <Compass className="h-4 w-4" />
                      Discover
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/collectives" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Collectives
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about" className="flex items-center gap-2 cursor-pointer">
                      <Info className="h-4 w-4" />
                      About
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/handler/account-settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <ThemeToggle />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => app.signOut()} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-1">{user.displayName || "Film Enthusiast"}</h1>
                <p className="text-muted-foreground mb-3">{user.primaryEmail}</p>
                <div className="flex items-center gap-3">
                  <PushNotificationToggle />
                </div>
              </div>
            </div>

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

          {/* Letterboxd Import */}
          <div className="mb-12 max-w-2xl">
            <LetterboxdImport />
          </div>

          {favorites.length > 0 && (
            <div className="mb-12 rounded-2xl bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm border border-border/50 p-6 max-w-xs">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-5 w-5 text-pink-500" />
                <h2 className="text-xl font-bold text-foreground">Your Top 3 Films</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((position) => {
                  const fav = favorites.find((f) => f.position === position)
                  return (
                    <div key={position} className="relative">
                      {fav ? (
                        <Link href={`/movies/${fav.tmdb_id}`} className="group">
                          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted ring-1 ring-border/50 group-hover:ring-accent/50 transition-all duration-500 hover-lift group-hover:shadow-xl group-hover:shadow-accent/10">
                            {fav.poster_path ? (
                              <img
                                src={getImageUrl(fav.poster_path, "w342") || "/placeholder.svg"}
                                alt={fav.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <Film className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                            {fav.title}
                          </p>
                        </Link>
                      ) : (
                        <div className="aspect-[2/3] rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">#{position}</span>
                        </div>
                      )}
                      <div className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground shadow-lg">
                        {position}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again {retryCount > 0 && `(attempt ${retryCount + 1})`}
                </button>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-20 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
                  <Film className="h-12 w-12 text-muted-foreground/30" />
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm shadow-lg">
                        <StarRatingDisplay rating={rating.overallScore / 20} size="sm" showValue />
                      </div>

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