"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

type Collective = {
  id: string
  name: string
  emoji?: string
  member_count?: number
}

type CollectiveDropdownProps = {
  collectives: Collective[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

export function CollectiveDropdown({
  collectives,
  selectedId,
  onSelect,
  className,
}: CollectiveDropdownProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const current = collectives.find((c) => c.id === selectedId) ?? collectives[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Reset focus index when opening
  useEffect(() => {
    if (open) {
      const idx = collectives.findIndex((c) => c.id === selectedId)
      setFocusedIndex(idx >= 0 ? idx : 0)
    }
  }, [open, collectives, selectedId])

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const list = listRef.current
    if (!list) return
    const item = list.children[focusedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  }, [open, focusedIndex])

  const selectAndClose = useCallback(
    (id: string) => {
      onSelect(id)
      setOpen(false)
    },
    [onSelect],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault()
          setOpen(true)
        }
        return
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault()
          setOpen(false)
          break
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex((i) => (i + 1) % collectives.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((i) => (i - 1 + collectives.length) % collectives.length)
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < collectives.length) {
            selectAndClose(collectives[focusedIndex].id)
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedIndex(collectives.length - 1)
          break
      }
    },
    [open, focusedIndex, collectives, selectAndClose],
  )

  if (!current) return null

  return (
    <div className={cn("relative", className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-md bg-surface-light border border-foreground/10 hover:border-accent/30 transition-colors"
      >
        {current.emoji && <span className="text-base leading-none">{current.emoji}</span>}
        <span className="text-sm font-medium text-foreground truncate">{current.name}</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground shrink-0 ml-auto transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          ref={listRef}
          aria-activedescendant={focusedIndex >= 0 ? `collective-${collectives[focusedIndex].id}` : undefined}
          className="absolute left-0 right-0 mt-3 rounded-xl bg-surface-light border border-foreground/[0.08] p-2 shadow-card z-50 max-h-64 overflow-y-auto"
        >
          {collectives.map((c, i) => {
            const isSelected = c.id === selectedId
            const isFocused = i === focusedIndex
            return (
              <button
                key={c.id}
                id={`collective-${c.id}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectAndClose(c.id)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-3 rounded-lg text-sm transition-colors",
                  isSelected
                    ? "bg-accent/15 text-accent"
                    : isFocused
                      ? "bg-surface-hover text-foreground"
                      : "text-foreground hover:bg-surface-hover",
                )}
              >
                {c.emoji && <span className="text-base leading-none shrink-0">{c.emoji}</span>}
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">{c.name}</div>
                  {c.member_count != null && (
                    <div className={cn("text-xs", isSelected ? "text-accent/70" : "text-muted-foreground")}>
                      {c.member_count} member{c.member_count !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
