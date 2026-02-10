import { C, FONT_STACK } from "./constants"
import {
  IconSparkle, IconCoffee, IconZap, IconHeart, IconFilm, IconAward,
  IconGhost, IconLaugh,
} from "./icons"
import { SectionLabel } from "./filter-primitives"
import { IconCheck } from "./icons"
import type { MoodValue } from "./types"

const MOOD_OPTIONS: { value: MoodValue | null; label: string; icon: (c: string) => React.ReactNode; description: string; color: string }[] = [
  {
    value: null,
    label: "Any Mood",
    icon: (c) => <IconSparkle size={20} color={c} />,
    description: "Show me everything",
    color: C.orange,
  },
  {
    value: "fun",
    label: "Fun",
    icon: (c) => <IconCoffee size={20} color={c} />,
    description: "Light & entertaining",
    color: C.teal,
  },
  {
    value: "intense",
    label: "Intense",
    icon: (c) => <IconZap size={20} color={c} />,
    description: "Edge of your seat",
    color: C.rose,
  },
  {
    value: "emotional",
    label: "Emotional",
    icon: (c) => <IconHeart size={20} color={c} />,
    description: "Feel all the feels",
    color: C.blue,
  },
  {
    value: "mindless",
    label: "Mindless",
    icon: (c) => <IconFilm size={20} color={c} />,
    description: "Turn brain off",
    color: C.purple,
  },
  {
    value: "acclaimed",
    label: "Acclaimed",
    icon: (c) => <IconAward size={20} color={c} />,
    description: "Critics' favorites",
    color: C.orange,
  },
  {
    value: "scary",
    label: "Scary",
    icon: (c) => <IconGhost size={20} color={c} />,
    description: "Thrills and chills",
    color: C.rose,
  },
  {
    value: "funny",
    label: "Funny",
    icon: (c) => <IconLaugh size={20} color={c} />,
    description: "Make me laugh",
    color: C.teal,
  },
]

export function MoodFiltersStep({
  selectedMoods, setSelectedMoods,
}: {
  selectedMoods: MoodValue[]
  setSelectedMoods: (m: MoodValue[]) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mood grid — multi-select */}
      <div>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 2 }}>
          <SectionLabel>What are you in the mood for?</SectionLabel>
          {selectedMoods.length > 1 && (
            <span style={{
              padding: "2px 8px",
              borderRadius: 12,
              background: `${C.orange}20`,
              color: C.orange,
              fontSize: 11,
              fontWeight: 500,
              fontFamily: FONT_STACK,
            }}>
              {selectedMoods.length} selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {MOOD_OPTIONS.map((option) => {
            // "Any Mood" (value=null) is selected when no moods are chosen
            const isSelected = option.value === null
              ? selectedMoods.length === 0
              : selectedMoods.includes(option.value)
            const moodColor = option.color

            const handleClick = () => {
              if (option.value === null) {
                // "Any Mood" clears all selections
                setSelectedMoods([])
              } else {
                // Toggle specific mood on/off
                if (selectedMoods.includes(option.value)) {
                  setSelectedMoods(selectedMoods.filter(m => m !== option.value))
                } else {
                  setSelectedMoods([...selectedMoods, option.value])
                }
              }
            }

            return (
              <button
                key={option.value || "any"}
                onClick={handleClick}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  padding: "18px 12px",
                  borderRadius: 14,
                  border: isSelected
                    ? `1px solid ${moodColor}55`
                    : `1px solid ${C.creamFaint}18`,
                  background: isSelected
                    ? `linear-gradient(135deg, ${moodColor}12, ${moodColor}06)`
                    : C.bgCard,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  fontFamily: FONT_STACK,
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, ${moodColor}, ${moodColor}88, transparent)`,
                    }}
                  />
                )}
                {/* Checkmark badge for multi-select */}
                {isSelected && option.value !== null && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: moodColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <IconCheck size={11} color={C.warmBlack} />
                  </div>
                )}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected ? `${moodColor}22` : `${C.creamFaint}18`,
                    transition: "all 0.2s ease",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {option.icon(isSelected ? moodColor : C.creamMuted)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: C.cream }}>
                  {option.label}
                </span>
                <span style={{ fontSize: 11, color: C.creamMuted, textAlign: "center", lineHeight: 1.3 }}>
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
        {selectedMoods.length > 1 && (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
            Movies matching any selected mood will be included
          </p>
        )}
      </div>
    </div>
  )
}
