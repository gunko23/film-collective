export const QUICK_EMOJIS = [
  "😀", "😂", "🥹", "😍", "🤩", "😎", "🥳", "😅",
  "🤔", "😤", "😭", "🙄", "😱", "🤯", "🥴", "😈",
  "👍", "👎", "❤️", "🔥", "💯", "✨", "👀", "🎬",
  "🍿", "⭐", "💀", "😴", "🤝", "👏", "🎉", "💔",
]

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"]

export const EMOJI_REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "funny", emoji: "😂", label: "Funny" },
  { type: "hot", emoji: "🔥", label: "Hot" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "party", emoji: "🎉", label: "Party" },
  { type: "heart_eyes", emoji: "😍", label: "Heart Eyes" },
  { type: "amazed", emoji: "🤯", label: "Amazed" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "hundred", emoji: "💯", label: "100" },
] as const

export const GIF_SEARCH_DEBOUNCE_MS = 400
export const SCROLL_BOTTOM_THRESHOLD = 100
export const OPTIMISTIC_ID_PREFIX = "optimistic-"

/**
 * Resolves a reaction_type to its display emoji.
 * If the type is already an emoji (raw string like "❤️"), returns it as-is.
 * If it's a named type (like "love"), looks it up in EMOJI_REACTIONS.
 */
export function getReactionEmoji(reactionType: string): string {
  const mapped = EMOJI_REACTIONS.find((r) => r.type === reactionType)
  if (mapped) return mapped.emoji
  // Already an emoji (raw reaction from discussion API)
  return reactionType
}
