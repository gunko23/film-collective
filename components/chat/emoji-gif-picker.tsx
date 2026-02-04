"use client"

import { useState, useEffect, useRef } from "react"
import { Smile, ImageIcon, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUICK_EMOJIS, GIF_SEARCH_DEBOUNCE_MS } from "@/lib/chat/constants"

interface EmojiGifPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  onGifSelect: (url: string) => void
  variant?: "popover" | "inline"
}

export function EmojiGifPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  onGifSelect,
  variant = "popover",
}: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<"emoji" | "gif">("emoji")
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<Array<{ url: string; preview: string }>>([])
  const [searchingGifs, setSearchingGifs] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Click-outside close for popover variant
  useEffect(() => {
    if (!isOpen || variant !== "popover") return
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, variant, onClose])

  // GIF search with debounce
  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifs([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearchingGifs(true)
      try {
        const res = await fetch(`/api/gif/search?q=${encodeURIComponent(gifSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setGifs(data.results || [])
        }
      } catch {
        // silently fail
      } finally {
        setSearchingGifs(false)
      }
    }, GIF_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [gifSearch])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setGifSearch("")
      setGifs([])
    }
  }, [isOpen])

  if (!isOpen) return null

  if (variant === "popover") {
    return (
      <div
        ref={pickerRef}
        className="absolute bottom-full left-0 mb-2 bg-zinc-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-zinc-700/50 overflow-hidden w-[260px] z-50"
      >
        {/* Tabs */}
        <div className="flex border-b border-zinc-700/50">
          <button
            type="button"
            onClick={() => setActiveTab("emoji")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeTab === "emoji"
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Emoji
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gif")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              activeTab === "gif"
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            GIF
          </button>
        </div>

        {/* Content */}
        <div className="p-2 max-h-[200px] overflow-y-auto">
          {activeTab === "emoji" ? (
            <div className="grid grid-cols-8 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onEmojiSelect(emoji)}
                  className="p-1.5 rounded hover:bg-zinc-700/50 transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              {gifs.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 max-h-[150px] overflow-y-auto">
                  {gifs.map((gif, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onGifSelect(gif.url)}
                      className="rounded overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={gif.preview || "/placeholder.svg"}
                        alt="GIF"
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-500 text-xs">
                  <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  Search for GIFs
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="flex-shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-sm p-3">
      <div className="flex items-center gap-2 mb-3 border-b border-border/50 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("emoji")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "emoji"
              ? "bg-blue-500/20 text-blue-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Smile className="h-4 w-4" />
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gif")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "gif"
              ? "bg-blue-500/20 text-blue-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <ImageIcon className="h-4 w-4" />
          GIF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {activeTab === "emoji" ? (
        <div className="flex flex-wrap gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onEmojiSelect(emoji)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-muted hover:scale-110 transition-all duration-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            {searchingGifs && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {gifs.map((gif, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onGifSelect(gif.url)}
                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200"
              >
                <img
                  src={gif.preview || "/placeholder.svg"}
                  alt="GIF"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {gifs.length === 0 && !searchingGifs && (
              <p className="col-span-3 text-center text-sm text-muted-foreground py-4">Search for GIFs above</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
