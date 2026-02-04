"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  Film,
  Popcorn,
  Heart,
  Zap,
  Brain,
  Trophy,
  RefreshCw,
  ExternalLink,
  Info,
  ChevronLeft,
  Volume2,
  Swords,
  Wine,
  Ghost,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import { Button } from "@/components/ui/button"

type GenrePreference = {
  genreId: number
  genreName: string
  avgScore: number
  ratingCount: number
}

type ParentalGuideInfo = {
  sexNudity: "None" | "Mild" | "Moderate" | "Severe" | null
  violence: "None" | "Mild" | "Moderate" | "Severe" | null
  profanity: "None" | "Mild" | "Moderate" | "Severe" | null
  alcoholDrugsSmoking: "None" | "Mild" | "Moderate" | "Severe" | null
  frighteningIntense: "None" | "Mild" | "Moderate" | "Severe" | null
}

type MovieRecommendation = {
  tmdbId: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  runtime: number | null
  genres: { id: number; name: string }[]
  voteAverage: number
  certification?: string | null
  imdbId?: string | null
  groupFitScore: number
  genreMatchScore: number
  reasoning: string[]
  seenBy: string[]
  parentalGuide?: ParentalGuideInfo | null
}

type SoloPickResponse = {
  recommendations: MovieRecommendation[]
  userProfile: {
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

type Mood = "fun" | "intense" | "emotional" | "mindless" | "acclaimed" | null

const MOOD_OPTIONS: { value: Mood; label: string; icon: React.ReactNode; description: string }[] = [
  { value: null, label: "Any Mood", icon: <Sparkles className="h-5 w-5" />, description: "Show me everything" },
  { value: "fun", label: "Fun", icon: <Popcorn className="h-5 w-5" />, description: "Light & entertaining" },
  { value: "intense", label: "Intense", icon: <Zap className="h-5 w-5" />, description: "Edge of your seat" },
  { value: "emotional", label: "Emotional", icon: <Heart className="h-5 w-5" />, description: "Feel all the feels" },
  { value: "mindless", label: "Mindless", icon: <Brain className="h-5 w-5" />, description: "Turn brain off" },
  { value: "acclaimed", label: "Acclaimed", icon: <Trophy className="h-5 w-5" />, description: "Critics' favorites" },
]

export function SoloTonightsPick() {
  const [step, setStep] = useState<"mood" | "results">("mood")
  const [selectedMood, setSelectedMood] = useState<Mood>(null)
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null)
  const [contentRating, setContentRating] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SoloPickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1)

  type ContentLevel = "None" | "Mild" | "Moderate" | "Severe" | null
  const [maxViolence, setMaxViolence] = useState<ContentLevel>(null)
  const [maxSexNudity, setMaxSexNudity] = useState<ContentLevel>(null)
  const [maxProfanity, setMaxProfanity] = useState<ContentLevel>(null)
  const [maxSubstances, setMaxSubstances] = useState<ContentLevel>(null)
  const [maxFrightening, setMaxFrightening] = useState<ContentLevel>(null)
  const [showContentFilters, setShowContentFilters] = useState(true)

  const getRecommendations = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tonights-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          maxRuntime,
          contentRating,
          page,
          parentalFilters: {
            maxViolence,
            maxSexNudity,
            maxProfanity,
            maxSubstances,
            maxFrightening,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get recommendations")
      }

      const data = await res.json()
      setResults(data)
      setResultsPage(page)
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const shuffleResults = () => {
    getRecommendations(resultsPage + 1)
  }

  const reset = () => {
    setStep("mood")
    setResults(null)
    setSelectedMood(null)
    setContentRating(null)
    setResultsPage(1)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/30">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Tonight&apos;s Pick</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Find something to watch</p>
          </div>
        </div>
        {step === "results" && (
          <Button variant="outline" onClick={reset} size="sm" className="gap-2 self-start sm:self-auto">
            <RefreshCw className="h-4 w-4" />
            Start Over
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 sm:p-3 sm:justify-start sm:gap-4">
        {["mood", "results"].map((s, i) => {
          const stepIndex = ["mood", "results"].indexOf(step)
          const isActive = step === s
          const isCompleted = stepIndex > i

          return (
            <div key={s} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : isCompleted
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm whitespace-nowrap ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s === "mood" ? "Mood & Filters" : "Results"}
                </span>
              </div>
              {i < 1 && (
                <div className={`hidden sm:block w-8 h-0.5 rounded-full ${isCompleted ? "bg-accent/40" : "bg-muted"}`} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 sm:p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Step 1: Mood & Filters */}
      {step === "mood" && (
        <div className="space-y-5 sm:space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              What are you in the mood for?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {MOOD_OPTIONS.map((option) => {
                const isSelected = selectedMood === option.value
                return (
                  <button
                    key={option.value || "any"}
                    onClick={() => setSelectedMood(option.value)}
                    className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                        : "border-border/50 bg-card/50 hover:border-accent/50 active:bg-accent/5"
                    }`}
                  >
                    <div
                      className={`p-2.5 sm:p-3 rounded-xl ${
                        isSelected ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Runtime Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Maximum runtime (optional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[null, 90, 120, 150].map((time) => (
                <button
                  key={time || "any"}
                  onClick={() => setMaxRuntime(time)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    maxRuntime === time
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {time ? `${time}m` : "Any"}
                </button>
              ))}
            </div>
          </div>

          {/* Content Rating Filter */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Content rating (optional)
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: null, label: "Any" },
                { value: "G", label: "G" },
                { value: "PG", label: "PG" },
                { value: "PG-13", label: "PG-13" },
                { value: "R", label: "R" },
              ].map((rating) => (
                <button
                  key={rating.value || "any"}
                  onClick={() => setContentRating(rating.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    contentRating === rating.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-accent/50 active:bg-accent/5"
                  }`}
                >
                  {rating.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
            </p>
          </div>

          {/* Parental Content Filters */}
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowContentFilters(!showContentFilters)}
              className="w-full flex items-center justify-between p-3 sm:p-4 bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-foreground">Content Filters</span>
                {(maxViolence || maxSexNudity || maxProfanity || maxSubstances || maxFrightening) && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                    Active
                  </span>
                )}
              </div>
              {showContentFilters ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showContentFilters && (
              <div className="p-3 sm:p-4 space-y-4 border-t border-border/50 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Set maximum levels for each category. Movies exceeding these levels will be filtered out.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setMaxViolence(null)
                      setMaxSexNudity(null)
                      setMaxProfanity(null)
                      setMaxSubstances(null)
                      setMaxFrightening(null)
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium hover:bg-card/50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      setMaxViolence("Mild")
                      setMaxSexNudity("Mild")
                      setMaxProfanity("Mild")
                      setMaxSubstances("Mild")
                      setMaxFrightening("Mild")
                    }}
                    className="px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
                  >
                    Kid-Friendly
                  </button>
                  <button
                    onClick={() => {
                      setMaxViolence("Moderate")
                      setMaxSexNudity("Moderate")
                      setMaxProfanity("Moderate")
                      setMaxSubstances("Moderate")
                      setMaxFrightening("Moderate")
                    }}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    Family Night
                  </button>
                </div>

                {/* Individual Category Filters */}
                <div className="space-y-3">
                  {([
                    { label: "Violence", icon: <Swords className="h-3.5 w-3.5 text-muted-foreground" />, state: maxViolence, setter: setMaxViolence },
                    { label: "Sex/Nudity", icon: <Heart className="h-3.5 w-3.5 text-muted-foreground" />, state: maxSexNudity, setter: setMaxSexNudity },
                    { label: "Language", icon: <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />, state: maxProfanity, setter: setMaxProfanity },
                    { label: "Substances", icon: <Wine className="h-3.5 w-3.5 text-muted-foreground" />, state: maxSubstances, setter: setMaxSubstances },
                    { label: "Frightening Scenes", icon: <Ghost className="h-3.5 w-3.5 text-muted-foreground" />, state: maxFrightening, setter: setMaxFrightening },
                  ] as const).map((category) => (
                    <div key={category.label}>
                      <div className="flex items-center gap-2 mb-2">
                        {category.icon}
                        <span className="text-xs font-medium text-foreground">{category.label}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { value: null, label: "Any" },
                          { value: "None", label: "None" },
                          { value: "Mild", label: "Mild" },
                          { value: "Moderate", label: "Mod" },
                          { value: "Severe", label: "Severe" },
                        ].map((level) => (
                          <button
                            key={level.value || "any"}
                            onClick={() => category.setter(level.value as ContentLevel)}
                            className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                              category.state === level.value
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border/50 text-muted-foreground hover:border-accent/50"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Note: Movies without parental guide data in our database will still be shown.
                </p>
              </div>
            )}
          </div>

          {/* Get Recommendations Button */}
          <div className="pt-2">
            <button
              onClick={() => getRecommendations(1)}
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#e07850',
                color: '#08080a',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Finding films...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Get Recommendations
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step === "results" && results && (
        <div className="space-y-4 sm:space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setStep("mood")}
              className="gap-2 h-9 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={shuffleResults}
              disabled={loading}
              className="gap-2 h-9 text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Shuffle
            </Button>
          </div>

          {/* User Profile Summary */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <User className="h-4 w-4" />
              <span>Based on your ratings</span>
            </div>
            {results.userProfile.sharedGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Your favorites:</span>
                {results.userProfile.sharedGenres.map((genre) => (
                  <span
                    key={genre.genreId}
                    className="px-2 py-0.5 sm:py-1 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs"
                  >
                    {genre.genreName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations List */}
          {results.recommendations.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Film className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">No recommendations found</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Try adjusting your mood or runtime preferences
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {results.recommendations.map((movie) => (
                <div
                  key={movie.tmdbId}
                  className="group relative rounded-xl border border-border/50 bg-card/50 overflow-hidden hover:border-accent/30 transition-all"
                >
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Poster */}
                    <div className="flex-shrink-0">
                      {movie.posterPath ? (
                        <Image
                          src={getImageUrl(movie.posterPath, "w185") || ""}
                          alt={movie.title}
                          width={80}
                          height={120}
                          className="rounded-lg object-cover w-[70px] h-[105px] sm:w-[100px] sm:h-[150px]"
                        />
                      ) : (
                        <div className="w-[70px] h-[105px] sm:w-[100px] sm:h-[150px] bg-muted rounded-lg flex items-center justify-center">
                          <Film className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-lg leading-tight line-clamp-2">
                          {movie.title}
                        </h3>
                        {/* Personal Fit Score Badge */}
                        <div
                          className={`flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            movie.groupFitScore >= 70
                              ? "bg-emerald-500/20 text-emerald-400"
                              : movie.groupFitScore >= 50
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {movie.groupFitScore}%
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                        {movie.releaseDate && (
                          <span>{new Date(movie.releaseDate).getFullYear()}</span>
                        )}
                        {movie.runtime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {movie.runtime}m
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          {movie.voteAverage.toFixed(1)}
                        </span>
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                        {movie.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre.id}
                            className="px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-[10px] sm:text-xs text-muted-foreground"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>

                      {/* Overview */}
                      <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 mb-3">
                        {movie.overview}
                      </p>

                      {/* Reasoning */}
                      {movie.reasoning.length > 0 && (
                        <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                          <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <p className="text-muted-foreground line-clamp-2">
                            {movie.reasoning.slice(0, 2).join(" • ")}
                          </p>
                        </div>
                      )}

                      {/* Parental Guide Warnings */}
                      {movie.parentalGuide && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {movie.parentalGuide.violence && movie.parentalGuide.violence !== "None" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                              movie.parentalGuide.violence === "Severe"
                                ? "bg-red-500/20 text-red-400"
                                : movie.parentalGuide.violence === "Moderate"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              <Swords className="h-2.5 w-2.5" />
                              Violence: {movie.parentalGuide.violence}
                            </span>
                          )}
                          {movie.parentalGuide.sexNudity && movie.parentalGuide.sexNudity !== "None" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                              movie.parentalGuide.sexNudity === "Severe"
                                ? "bg-red-500/20 text-red-400"
                                : movie.parentalGuide.sexNudity === "Moderate"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              <Heart className="h-2.5 w-2.5" />
                              Sex/Nudity: {movie.parentalGuide.sexNudity}
                            </span>
                          )}
                          {movie.parentalGuide.profanity && movie.parentalGuide.profanity !== "None" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                              movie.parentalGuide.profanity === "Severe"
                                ? "bg-red-500/20 text-red-400"
                                : movie.parentalGuide.profanity === "Moderate"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              <Volume2 className="h-2.5 w-2.5" />
                              Language: {movie.parentalGuide.profanity}
                            </span>
                          )}
                          {movie.parentalGuide.alcoholDrugsSmoking && movie.parentalGuide.alcoholDrugsSmoking !== "None" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                              movie.parentalGuide.alcoholDrugsSmoking === "Severe"
                                ? "bg-red-500/20 text-red-400"
                                : movie.parentalGuide.alcoholDrugsSmoking === "Moderate"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              <Wine className="h-2.5 w-2.5" />
                              Substances: {movie.parentalGuide.alcoholDrugsSmoking}
                            </span>
                          )}
                          {movie.parentalGuide.frighteningIntense && movie.parentalGuide.frighteningIntense !== "None" && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${
                              movie.parentalGuide.frighteningIntense === "Severe"
                                ? "bg-red-500/20 text-red-400"
                                : movie.parentalGuide.frighteningIntense === "Moderate"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              <Ghost className="h-2.5 w-2.5" />
                              Intense: {movie.parentalGuide.frighteningIntense}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Seen By Warning */}
                      {movie.seenBy.length > 0 && (
                        <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-amber-500/80">
                          You may have already seen this
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-border/30 bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 h-8 text-xs sm:text-sm"
                      onClick={() =>
                        window.open(
                          `https://www.themoviedb.org/movie/${movie.tmdbId}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">TMDB</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 h-8 text-xs sm:text-sm"
                      onClick={() => {
                        window.location.href = `/movies/${movie.tmdbId}`
                      }}
                    >
                      <Film className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
