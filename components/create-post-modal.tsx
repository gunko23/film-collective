"use client"

import { useState } from "react"
import { Plus, Search, GripVertical, Trash2, Film, MessageSquare, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getImageUrl } from "@/lib/tmdb/image"

type MovieListItem = {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  note?: string
}

type Props = {
  collectiveId: string
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreatePostModal({ collectiveId, open, onClose, onCreated }: Props) {
  const [postType, setPostType] = useState<"discussion" | "movie_list">("discussion")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [movieListItems, setMovieListItems] = useState<MovieListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearching(false)
    }
  }

  const addMovie = (movie: any) => {
    if (movieListItems.some((item) => item.tmdbId === movie.tmdbId)) return

    setMovieListItems([
      ...movieListItems,
      {
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
      },
    ])
    setSearchResults([])
    setSearchQuery("")
  }

  const removeMovie = (tmdbId: number) => {
    setMovieListItems(movieListItems.filter((item) => item.tmdbId !== tmdbId))
  }

  const moveMovie = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === movieListItems.length - 1) return

    const newItems = [...movieListItems]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]
    setMovieListItems(newItems)
  }

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit called")
    console.log("[v0] title:", title, "postType:", postType, "movieListItems:", movieListItems.length)

    if (!title.trim()) {
      console.log("[v0] Title is empty, returning")
      return
    }
    if (postType === "movie_list" && movieListItems.length === 0) {
      console.log("[v0] Movie list is empty, returning")
      return
    }

    setSubmitting(true)
    try {
      console.log("[v0] Sending POST request to:", `/api/collectives/${collectiveId}/posts`)
      const res = await fetch(`/api/collectives/${collectiveId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: content || null,
          postType,
          movieListItems: postType === "movie_list" ? movieListItems : [],
        }),
      })

      console.log("[v0] Response status:", res.status)
      const responseText = await res.text()
      console.log("[v0] Response body:", responseText)

      if (res.ok) {
        // Reset form
        setTitle("")
        setContent("")
        setMovieListItems([])
        setPostType("discussion")
        onCreated()
      } else {
        alert(`Error creating post: ${responseText}`)
      }
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      alert(`Error creating post: ${error}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    setMovieListItems([])
    setPostType("discussion")
    setSearchQuery("")
    setSearchResults([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setPostType("discussion")}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                postType === "discussion"
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-card/50 border-border/50 text-muted-foreground hover:border-accent/30"
              }`}
            >
              <MessageSquare className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Discussion</span>
            </button>
            <button
              onClick={() => setPostType("movie_list")}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                postType === "movie_list"
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-card/50 border-border/50 text-muted-foreground hover:border-accent/30"
              }`}
            >
              <List className="h-5 w-5 mx-auto mb-1" />
              <span className="text-sm font-medium">Movie List</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              {postType === "movie_list" ? "List Title" : "Post Title"}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === "movie_list" ? "e.g., My Top 10 Action Movies" : "What's on your mind?"}
              className="bg-background/50 border-border/50"
            />
          </div>

          {/* Content / Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              {postType === "movie_list" ? "Description (optional)" : "Content"}
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === "movie_list" ? "Tell us about your list..." : "Share your thoughts with the collective..."
              }
              rows={3}
              className="bg-background/50 border-border/50 resize-none"
            />
          </div>

          {/* Movie List Builder */}
          {postType === "movie_list" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">Add Movies</label>

              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search TMDB for movies..."
                    className="bg-background/50 border-border/50 pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching} variant="outline">
                  {searching ? "..." : "Search"}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-background/50 border border-border/50 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.slice(0, 10).map((movie) => (
                    <button
                      key={movie.tmdbId}
                      onClick={() => addMovie(movie)}
                      disabled={movieListItems.some((item) => item.tmdbId === movie.tmdbId)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent/10 transition-colors text-left disabled:opacity-50"
                    >
                      {movie.posterPath ? (
                        <img
                          src={getImageUrl(movie.posterPath, "w92") || "/placeholder.svg"}
                          alt=""
                          className="w-8 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                          <Film className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "N/A"}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-accent flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Movie List */}
              {movieListItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{movieListItems.length} movies in list</p>
                  <div className="space-y-1">
                    {movieListItems.map((item, index) => (
                      <div
                        key={item.tmdbId}
                        className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg p-2"
                      >
                        <span className="text-sm font-bold text-accent w-6 text-center">{index + 1}</span>
                        {item.posterPath ? (
                          <img
                            src={getImageUrl(item.posterPath, "w92") || "/placeholder.svg"}
                            alt=""
                            className="w-8 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                            <Film className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.releaseDate ? new Date(item.releaseDate).getFullYear() : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveMovie(index, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-accent/20 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground rotate-180" />
                          </button>
                          <button
                            onClick={() => moveMovie(index, "down")}
                            disabled={index === movieListItems.length - 1}
                            className="p-1 hover:bg-accent/20 rounded disabled:opacity-30"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => removeMovie(item.tmdbId)}
                            className="p-1 hover:bg-destructive/20 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || (postType === "movie_list" && movieListItems.length === 0) || submitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {submitting ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
