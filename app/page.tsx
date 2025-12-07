"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { MovieGrid } from "@/components/movie-grid"
import { MovieFilters } from "@/components/movie-filters"
import { Pagination } from "@/components/pagination"
import { FloatingElements } from "@/components/floating-elements"
import { Particles } from "@/components/particles"
import { Film, Users, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  return res.json()
}

type TMDBSearchResponse = {
  results: {
    tmdbId: number
    title: string
    originalTitle: string
    overview: string
    releaseDate: string
    posterPath: string | null
    backdropPath: string | null
    voteAverage: number
    voteCount: number
    popularity: number
  }[]
  page: number
  totalPages: number
  totalResults: number
}

type GenresResponse = {
  genres: { id: number; name: string }[]
}

export default function HomePage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState("popularity")
  const [genreId, setGenreId] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    if (debouncedSearch) params.set("q", debouncedSearch)
    return `/api/tmdb/search?${params.toString()}`
  }, [page, debouncedSearch])

  const { data: moviesData, isLoading: moviesLoading } = useSWR<TMDBSearchResponse>(queryUrl, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: genresData } = useSWR<GenresResponse>("/api/genres", fetcher)

  const handleGenreChange = (value: string) => {
    setGenreId(value)
    setPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setPage(1)
  }

  const movies = useMemo(() => {
    if (!moviesData?.results) return []
    return moviesData.results.map((movie) => ({
      id: movie.tmdbId,
      tmdbId: movie.tmdbId,
      title: movie.title,
      originalTitle: movie.originalTitle,
      overview: movie.overview,
      releaseDate: movie.releaseDate,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      voteAverage: movie.voteAverage,
      voteCount: movie.voteCount,
      popularity: movie.popularity,
      runtime: null,
      genres: [],
    }))
  }, [moviesData])

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />

      <main className="relative z-10 pt-20 sm:pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />

            <div className="absolute top-20 left-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] rounded-full bg-accent/10 blur-[60px] sm:blur-[100px] animate-pulse-glow" />
            <div className="absolute bottom-20 right-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full bg-accent/5 blur-[50px] sm:blur-[80px] animate-pulse-glow animation-delay-200" />

            <div className="hidden sm:block">
              <Particles />
            </div>

            <div className="hidden md:block">
              <FloatingElements />
            </div>

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">
            {/* Main Headline with animations */}
            <h1 className="animate-text-reveal text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              Where film lovers
              <br />
              <span className="relative inline-block mt-1 sm:mt-2">
                <span className="gradient-text text-glow">come together</span>
                {/* Animated underline */}
                <span className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-shimmer" />
              </span>
            </h1>

            {/* Subheadline */}
            <p className="animate-slide-up animation-delay-200 mt-5 sm:mt-8 max-w-2xl mx-auto text-base sm:text-xl text-muted-foreground leading-relaxed px-2 sm:px-0">
              Rate films, build your taste profile, and discover how your
              <span className="text-foreground font-medium"> collective </span>
              experiences cinema together.
            </p>

            {/* Stats Row */}
            <div className="animate-slide-up animation-delay-300 mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <Film className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-base sm:text-lg font-bold text-foreground">500K+</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Films</p>
                </div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-base sm:text-lg font-bold text-foreground">10K+</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Collectives</p>
                </div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-base sm:text-lg font-bold text-foreground">1M+</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ratings</p>
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="animate-slide-up animation-delay-400 mt-8 sm:mt-12 w-full max-w-2xl mx-auto">
              <div className="relative group">
                {/* Glow effect behind search */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-card/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-border/50 p-1.5 sm:p-2 shadow-2xl shadow-black/5 dark:shadow-black/20">
                  <MovieFilters
                    search={search}
                    onSearchChange={setSearch}
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    genreId={genreId}
                    onGenreChange={handleGenreChange}
                    genres={genresData?.genres || []}
                    hideAdvancedFilters
                  />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="animate-slide-up animation-delay-500 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 px-6 sm:px-8 text-sm sm:text-base"
              >
                Start Rating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-border/50 hover:bg-secondary/50 bg-transparent text-sm sm:text-base"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Results Section */}
        <section className="relative px-4 sm:px-6 py-10 sm:py-16 bg-background">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {debouncedSearch ? "Search Results" : "Popular Films"}
                </h2>
                {moviesData && moviesData.totalResults > 0 ? (
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{moviesData.totalResults.toLocaleString()}</span>{" "}
                    films found
                    {debouncedSearch && (
                      <>
                        {" "}
                        for "<span className="text-accent">{debouncedSearch}</span>"
                      </>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Discover trending movies</p>
                )}
              </div>
            </div>

            {/* Movie Grid */}
            <MovieGrid movies={movies} isLoading={moviesLoading} />

            {/* Pagination */}
            {moviesData && moviesData.totalPages > 1 && (
              <div className="mt-10 sm:mt-16 flex justify-center">
                <Pagination page={page} totalPages={Math.min(moviesData.totalPages, 500)} onPageChange={setPage} />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 px-4 sm:px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Film className="h-4 w-4 text-accent" />
            </div>
            <span className="font-semibold text-foreground">Film Collective</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Film data provided by TMDB</p>
        </div>
      </footer>
    </div>
  )
}
