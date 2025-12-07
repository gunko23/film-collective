"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center gap-1 rounded-xl bg-card p-1.5 ring-1 ring-border/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center">
        {visiblePages.map((p, i) =>
          typeof p === "number" ? (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(p)}
              className={`h-9 w-9 p-0 text-sm transition-all duration-300 ${
                p === page
                  ? "bg-accent text-accent-foreground font-semibold hover:bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {p}
            </Button>
          ) : (
            <span key={i} className="px-2 text-muted-foreground/50">
              {p}
            </span>
          ),
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
