"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import Image from "next/image"
import { Heart, Plus, X, Search, Film, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type Favorite = {
  id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  position: number
}

type SearchResult = {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseDate: string | null
}

export function FavoriteMoviesPicker() {
  const { data, isLoading } = useSWR<{ favorites: Favorite[] }>("/api/user/favorites", fetcher)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const favorites = data?.favorites || []

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.results?.slice(0, 10) || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectMovie = async (movie: SearchResult) => {
    if (!selectedPosition) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
          position: selectedPosition,
        }),
      })
      if (res.ok) {
        mutate("/api/user/favorites")
        setDialogOpen(false)
        setSearchQuery("")
        setSearchResults([])
        setSelectedPosition(null)
      }
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (position: number) => {
    try {
      await fetch(`/api/user/favorites?position=${position}`, { method: "DELETE" })
      mutate("/api/user/favorites")
    } catch (error) {
      console.error("Remove error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 p-6 max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-semibold text-foreground">Your Top 3 Films</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 p-6 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-pink-500" />
        <h2 className="text-lg font-semibold text-foreground">Your Top 3 Films</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((position) => {
          const fav = favorites.find((f) => f.position === position)
          return (
            <div key={position} className="relative">
              {fav ? (
                <div className="group relative">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-zinc-700/50">
                    {fav.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${fav.poster_path}`}
                        alt={fav.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Film className="h-8 w-8 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(position)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <p className="mt-2 text-sm font-medium text-foreground truncate">{fav.title}</p>
                </div>
              ) : (
                <Dialog
                  open={dialogOpen && selectedPosition === position}
                  onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (open) setSelectedPosition(position)
                    else {
                      setSelectedPosition(null)
                      setSearchQuery("")
                      setSearchResults([])
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setSelectedPosition(position)}
                      className="w-full aspect-[2/3] rounded-xl bg-zinc-800/50 border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="h-6 w-6 text-zinc-500" />
                      <span className="text-xs text-zinc-500">Add #{position}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700">
                    <DialogHeader>
                      <DialogTitle>Choose Favorite #{position}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search for a movie..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <Button
                          onClick={handleSearch}
                          disabled={searching}
                          size="icon"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {searchResults.map((movie) => (
                          <button
                            key={movie.tmdbId}
                            onClick={() => handleSelectMovie(movie)}
                            disabled={saving}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                          >
                            <div className="relative h-16 w-11 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                              {movie.posterPath ? (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                  alt={movie.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <Film className="h-4 w-4 text-zinc-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{movie.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {movie.releaseDate?.split("-")[0] || "Unknown year"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                {position}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
