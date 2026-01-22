"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Check, ChevronDown, ChevronUp, Film, User, Users, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/tmdb/image"
import Image from "next/image"

const FILM_CATEGORIES = [
  "Best Picture",
  "Directing",
  "Actor in a Leading Role",
  "Actress in a Leading Role",
  "Actor in a Supporting Role",
  "Actress in a Supporting Role",
  "Animated Feature Film",
  "International Feature Film",
  "Documentary Feature Film",
  "Documentary Short Film",
  "Animated Short Film",
  "Live Action Short Film"
]

interface Nomination {
  id: string
  category: string
  film_title: string
  nominee_name: string | null
  tmdb_id: number | null
  film_nomination: boolean
}

interface UserPrediction {
  user_id: string
  user_name: string
  user_avatar: string | null
  prediction: {
    nomination_id: string
    film_title: string
    nominee_name: string | null
    tmdb_id: number | null
  }
}

interface OscarPredictionsProps {
  collectiveId: string
}

const CATEGORY_ORDER = [
  "Best Picture",
  "Directing",
  "Actor in a Leading Role",
  "Actress in a Leading Role",
  "Actor in a Supporting Role",
  "Actress in a Supporting Role",
  "Writing (Original Screenplay)",
  "Writing (Adapted Screenplay)",
  "Animated Feature Film",
  "International Feature Film",
  "Documentary Feature Film",
  "Documentary Short Film",
  "Animated Short Film",
  "Live Action Short Film",
  "Music (Original Score)",
  "Music (Original Song)",
  "Sound",
  "Production Design",
  "Cinematography",
  "Makeup and Hairstyling",
  "Costume Design",
  "Film Editing",
  "Visual Effects",
  "Casting"
]

export function OscarPredictions({ collectiveId }: OscarPredictionsProps) {
  const user = useUser()
  const [nominations, setNominations] = useState<Record<string, Nomination[]>>({})
  const [myPredictions, setMyPredictions] = useState<Record<string, { nomination_id: string; film_title: string; nominee_name: string | null }>>({})
  const [allPredictions, setAllPredictions] = useState<Record<string, Record<string, UserPrediction>>>({})
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"my-picks" | "collective">("my-picks")

  useEffect(() => {
    fetchData()
  }, [collectiveId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [nominationsRes, myPredictionsRes, allPredictionsRes] = await Promise.all([
        fetch("/api/oscar-nominations"),
        fetch(`/api/collectives/${collectiveId}/predictions/me`),
        fetch(`/api/collectives/${collectiveId}/predictions`)
      ])

      if (nominationsRes.ok) {
        const data = await nominationsRes.json()
        setNominations(data.nominations)
      }

      if (myPredictionsRes.ok) {
        const data = await myPredictionsRes.json()
        setMyPredictions(data.predictions)
      }

      if (allPredictionsRes.ok) {
        const data = await allPredictionsRes.json()
        setAllPredictions(data.predictions)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrediction = async (category: string, nominationId: string) => {
    if (!user) return

    // Optimistically update UI
    const nomination = nominations[category]?.find(n => n.id === nominationId)
    if (nomination) {
      setMyPredictions(prev => ({
        ...prev,
        [category]: {
          nomination_id: nominationId,
          film_title: nomination.film_title,
          nominee_name: nomination.nominee_name
        }
      }))
    }

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, nominationId })
      })

      if (res.ok) {
        // Refresh all predictions in background
        const allRes = await fetch(`/api/collectives/${collectiveId}/predictions`)
        if (allRes.ok) {
          const data = await allRes.json()
          setAllPredictions(data.predictions)
        }
      }
    } catch (error) {
      console.error("Error saving prediction:", error)
      // Revert on error
      fetchData()
    }
  }

  const handleRemovePrediction = async (category: string) => {
    if (!user) return

    // Optimistically remove
    setMyPredictions(prev => {
      const next = { ...prev }
      delete next[category]
      return next
    })

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/predictions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      })

      if (res.ok) {
        const allRes = await fetch(`/api/collectives/${collectiveId}/predictions`)
        if (allRes.ok) {
          const data = await allRes.json()
          setAllPredictions(data.predictions)
        }
      }
    } catch (error) {
      console.error("Error removing prediction:", error)
      fetchData()
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const sortedCategories = useMemo(() => {
    return Object.keys(nominations).sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a)
      const bIndex = CATEGORY_ORDER.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [nominations])

  const getCompletionStats = () => {
    const total = sortedCategories.length
    const completed = sortedCategories.filter(cat => myPredictions[cat]).length
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  // Check if category is a film nomination using the first nomination's film_nomination field
  const isFilmCategory = (category: string) => {
    const firstNomination = nominations[category]?.[0]
    return firstNomination?.film_nomination ?? false
  }

  // Get vote tallies for collective view
  const getVoteTallies = (category: string) => {
    const categoryPredictions = allPredictions[category] || {}
    const tallies: Record<string, { count: number; nomination: Nomination; voters: { name: string; avatar: string | null }[] }> = {}

    for (const userPred of Object.values(categoryPredictions)) {
      const nomId = userPred.prediction.nomination_id
      if (!tallies[nomId]) {
        const nomination = nominations[category]?.find(n => n.id === nomId)
        if (nomination) {
          tallies[nomId] = { count: 0, nomination, voters: [] }
        }
      }
      if (tallies[nomId]) {
        tallies[nomId].count++
        tallies[nomId].voters.push({ name: userPred.user_name, avatar: userPred.user_avatar })
      }
    }

    return Object.values(tallies).sort((a, b) => b.count - a.count)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const stats = getCompletionStats()

  return (
    <div className="space-y-4">
      {/* Header - Mobile optimized */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">98th Academy Awards</h2>
            <p className="text-xs text-muted-foreground">2026 Oscar Predictions</p>
          </div>
        </div>

        {/* Progress bar - Compact */}
        {user && (
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Your Progress</span>
              <span className="text-xs text-muted-foreground">{stats.completed}/{stats.total}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* View toggle - Full width on mobile */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={viewMode === "my-picks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("my-picks")}
            className={cn(
              "w-full",
              viewMode === "my-picks" && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            <User className="h-4 w-4 mr-1.5" />
            My Picks
          </Button>
          <Button
            variant={viewMode === "collective" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("collective")}
            className={cn(
              "w-full",
              viewMode === "collective" && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            <Users className="h-4 w-4 mr-1.5" />
            Collective
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {sortedCategories.map(category => {
          const categoryNominations = nominations[category] || []
          const myPick = myPredictions[category]
          const isExpanded = expandedCategories.has(category)
          const categoryPredictions = allPredictions[category] || {}
          const predictionCount = Object.keys(categoryPredictions).length
          const isFilm = isFilmCategory(category)
          const voteTallies = getVoteTallies(category)

          return (
            <div 
              key={category}
              className="bg-card/50 rounded-lg border border-border/50 overflow-hidden"
            >
              {/* Category header - Compact */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    myPick ? "bg-green-500" : "bg-muted-foreground/30"
                  )} />
                  <span className="font-medium text-foreground text-sm text-left truncate">{category}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {viewMode === "collective" && predictionCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {predictionCount}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border/50 p-3">
                  {viewMode === "my-picks" ? (
                    <div className="space-y-2">
                      {/* Current selection with remove option */}
                      {myPick && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Check className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {isFilm ? myPick.film_title : (myPick.nominee_name || myPick.film_title)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemovePrediction(category)
                            }}
                            className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Nominees list */}
                      {categoryNominations.map(nomination => {
                        const isSelected = myPick?.nomination_id === nomination.id
                        const primaryText = isFilm ? nomination.film_title : (nomination.nominee_name || nomination.film_title)
                        const secondaryText = isFilm ? nomination.nominee_name : (nomination.nominee_name ? nomination.film_title : null)

                        return (
                          <button
                            key={nomination.id}
                            onClick={() => handlePrediction(category, nomination.id)}
                            disabled={!user}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                              isSelected 
                                ? "bg-amber-500/20 border border-amber-500" 
                                : "bg-muted/30 border border-transparent hover:border-muted-foreground/30",
                              !user && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {/* Poster/Avatar */}
                            {nomination.tmdb_id ? (
                              <div className="relative w-8 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={getImageUrl(nomination.tmdb_id?.toString() || null, "w92") || "/placeholder.png"}
                                  alt={nomination.film_title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                {isFilm ? (
                                  <Film className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            
                            {/* Text content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {primaryText}
                              </p>
                              {secondaryText && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {secondaryText}
                                </p>
                              )}
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="p-1 rounded-full bg-amber-500 flex-shrink-0">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Vote tallies leaderboard */}
                      {voteTallies.length > 0 ? (
                        <>
                          <div className="space-y-1.5">
                            {voteTallies.map((tally, index) => {
                              const primaryText = isFilm ? tally.nomination.film_title : (tally.nomination.nominee_name || tally.nomination.film_title)
                              const totalVotes = Object.keys(categoryPredictions).length
                              const percentage = Math.round((tally.count / totalVotes) * 100)

                              return (
                                <div key={tally.nomination.id} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {index === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                                      <span className={cn(
                                        "truncate",
                                        index === 0 ? "font-medium text-foreground" : "text-muted-foreground"
                                      )}>
                                        {primaryText}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                      {tally.count} vote{tally.count !== 1 ? "s" : ""} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-300",
                                        index === 0 ? "bg-amber-500" : "bg-muted-foreground/40"
                                      )}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Individual voters */}
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2">Individual Picks</p>
                            <div className="space-y-1.5">
                              {Object.values(categoryPredictions).map(userPred => {
                                const primaryText = isFilm 
                                  ? userPred.prediction.film_title 
                                  : (userPred.prediction.nominee_name || userPred.prediction.film_title)

                                return (
                                  <div 
                                    key={userPred.user_id}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={userPred.user_avatar || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {userPred.user_name?.charAt(0).toUpperCase() || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground truncate">
                                        {userPred.user_name}
                                      </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                      {primaryText}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No predictions yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!user && (
        <div className="text-center py-6 bg-card/50 rounded-lg border border-border/50">
          <p className="text-sm text-muted-foreground">Sign in to make your Oscar predictions</p>
        </div>
      )}
    </div>
  )
}
