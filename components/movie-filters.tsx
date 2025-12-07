"use client"

import type React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Genre = { id: number; name: string }

type MovieFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  genreId: string
  onGenreChange: (value: string) => void
  genres: Genre[]
  hideAdvancedFilters?: boolean
}

export function MovieFilters({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  genreId,
  onGenreChange,
  genres,
  hideAdvancedFilters = false,
}: MovieFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  return (
    <div className="relative w-full max-w-xl">
      {/* Glowing search container */}
      <div className="relative">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent/20 via-accent/5 to-accent/20 opacity-0 blur transition-opacity duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search for films..."
            value={search}
            onChange={handleSearchChange}
            className="h-14 w-full rounded-xl border-0 bg-card pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground ring-1 ring-border/50 focus-visible:ring-2 focus-visible:ring-accent/50 transition-all duration-300"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 h-10 w-10 rounded-lg p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => onSearchChange("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
