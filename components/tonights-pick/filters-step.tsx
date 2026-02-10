import Image from "next/image"
import { getImageUrl } from "@/lib/tmdb/image"
import { US_SUBSCRIPTION_PROVIDERS } from "@/lib/streaming/providers"
import { C, FONT_STACK, CONTENT_FILTER_COLORS } from "./constants"
import {
  IconShield, IconChevronDown, IconChevronUp,
} from "./icons"
import { FilterPill, FilterCard, SectionLabel } from "./filter-primitives"
import type { Audience, ContentLevel } from "./types"

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: "anyone", label: "Anyone" },
  { value: "teens", label: "Teens & Up" },
  { value: "adults", label: "Adults" },
]

export function FiltersStep({
  audience, setAudience,
  maxRuntime, setMaxRuntime,
  contentRating, setContentRating,
  era, setEra,
  startYear, setStartYear,
  streamingProviders, setStreamingProviders,
  toggleStreamingProvider,
  maxViolence, setMaxViolence,
  maxSexNudity, setMaxSexNudity,
  maxProfanity, setMaxProfanity,
  maxSubstances, setMaxSubstances,
  maxFrightening, setMaxFrightening,
  showContentFilters, setShowContentFilters,
}: {
  audience: Audience
  setAudience: (v: Audience) => void
  maxRuntime: number | null
  setMaxRuntime: (v: number | null) => void
  contentRating: string | null
  setContentRating: (v: string | null) => void
  era: string | null
  setEra: (v: string | null) => void
  startYear: number | null
  setStartYear: (v: number | null) => void
  streamingProviders: number[]
  setStreamingProviders: (v: number[]) => void
  toggleStreamingProvider: (id: number) => void
  maxViolence: ContentLevel
  setMaxViolence: (v: ContentLevel) => void
  maxSexNudity: ContentLevel
  setMaxSexNudity: (v: ContentLevel) => void
  maxProfanity: ContentLevel
  setMaxProfanity: (v: ContentLevel) => void
  maxSubstances: ContentLevel
  setMaxSubstances: (v: ContentLevel) => void
  maxFrightening: ContentLevel
  setMaxFrightening: (v: ContentLevel) => void
  showContentFilters: boolean
  setShowContentFilters: (v: boolean) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Runtime Filter Card */}
      <FilterCard accentGradient={`linear-gradient(90deg, ${C.blue}, ${C.blueLight}88, transparent)`}>
        <SectionLabel>Maximum runtime (optional)</SectionLabel>
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {[null, 90, 120, 150].map((time) => (
            <FilterPill
              key={time || "any"}
              label={time ? `${time}m` : "Any"}
              selected={maxRuntime === time}
              onClick={() => setMaxRuntime(time)}
              accentColor={C.blue}
            />
          ))}
        </div>
      </FilterCard>

      {/* Audience Filter Card */}
      <FilterCard accentGradient={`linear-gradient(90deg, ${C.purple}, ${C.purple}88, transparent)`}>
        <SectionLabel>Audience (optional)</SectionLabel>
        <div className="grid grid-cols-3" style={{ gap: 8 }}>
          {AUDIENCE_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={audience === option.value}
              onClick={() => setAudience(option.value)}
              accentColor={C.purple}
            />
          ))}
        </div>
      </FilterCard>

      {/* Content Rating Filter Card */}
      <FilterCard accentGradient={`linear-gradient(90deg, ${C.blue}, ${C.teal}88, transparent)`}>
        <SectionLabel>Content rating (optional)</SectionLabel>
        <div className="grid grid-cols-5" style={{ gap: 6 }}>
          {[
            { value: null, label: "Any" },
            { value: "G", label: "G" },
            { value: "PG", label: "PG" },
            { value: "PG-13", label: "PG-13" },
            { value: "R", label: "R" },
          ].map((rating) => (
            <FilterPill
              key={rating.value || "any"}
              label={rating.label}
              selected={contentRating === rating.value}
              onClick={() => setContentRating(rating.value)}
              accentColor={C.blue}
            />
          ))}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
          Selecting a rating will include that rating and below (e.g., PG-13 includes G, PG, and PG-13)
        </p>
      </FilterCard>

      {/* Era + Released After Combined Card */}
      <FilterCard accentGradient={`linear-gradient(90deg, ${C.teal}, ${C.teal}88, transparent)`}>
        <SectionLabel>Era (optional)</SectionLabel>
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {[
            { value: null, label: "Any" },
            { value: "Pre-40s", label: "Pre-40s" },
            { value: "1940s", label: "40s" },
            { value: "1950s", label: "50s" },
            { value: "1960s", label: "60s" },
            { value: "1970s", label: "70s" },
            { value: "1980s", label: "80s" },
            { value: "1990s", label: "90s" },
            { value: "2000s", label: "00s" },
            { value: "2010s", label: "10s" },
            { value: "2020s", label: "20s" },
          ].map((option) => (
            <FilterPill
              key={option.value || "any"}
              label={option.label}
              selected={era === option.value}
              onClick={() => setEra(option.value)}
              accentColor={C.teal}
            />
          ))}
        </div>
        <div
          style={{
            height: 1,
            margin: "14px 0",
            background: `linear-gradient(90deg, transparent, ${C.creamFaint}22, transparent)`,
          }}
        />
        <SectionLabel>Released after (optional)</SectionLabel>
        <div className="grid grid-cols-4" style={{ gap: 8 }}>
          {[
            { value: null, label: "Any" },
            { value: 1970, label: "1970+" },
            { value: 1980, label: "1980+" },
            { value: 1990, label: "1990+" },
            { value: 2000, label: "2000+" },
            { value: 2010, label: "2010+" },
            { value: 2020, label: "2020+" },
            { value: 2024, label: "2024+" },
          ].map((option) => (
            <FilterPill
              key={option.value || "any"}
              label={option.label}
              selected={startYear === option.value}
              onClick={() => setStartYear(option.value)}
              accentColor={C.teal}
            />
          ))}
        </div>
        {era && startYear ? (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: C.creamFaint, fontFamily: FONT_STACK }}>
            Era filter takes priority over released after
          </p>
        ) : null}
      </FilterCard>

      {/* Streaming Services Filter Card */}
      <FilterCard accentGradient={`linear-gradient(90deg, ${C.blueMuted}, ${C.blue}88, transparent)`}>
        <SectionLabel>Streaming services (optional)</SectionLabel>
        <div className="grid grid-cols-3" style={{ gap: 8 }}>
          {US_SUBSCRIPTION_PROVIDERS.map((provider) => {
            const isSelected = streamingProviders.includes(provider.id)
            return (
              <button
                key={provider.id}
                onClick={() => toggleStreamingProvider(provider.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  cursor: "pointer",
                  border: `1px solid ${isSelected ? `${C.blue}66` : `${C.creamFaint}33`}`,
                  background: isSelected ? `${C.blue}18` : "transparent",
                  color: isSelected ? C.blueLight : C.creamMuted,
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={getImageUrl(provider.logoPath, "w92") || ""}
                  alt={provider.shortName}
                  width={18}
                  height={18}
                  className="flex-shrink-0"
                  style={{ borderRadius: 4, width: 18, height: 18 }}
                />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {provider.shortName}
                </span>
              </button>
            )
          })}
        </div>
        {streamingProviders.length > 0 && (
          <button
            onClick={() => setStreamingProviders([])}
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              color: C.creamFaint,
              fontFamily: FONT_STACK,
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.creamFaint)}
          >
            Clear streaming filter
          </button>
        )}
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 10,
            color: `${C.creamFaint}88`,
            fontFamily: FONT_STACK,
          }}
        >
          Streaming data by JustWatch
        </p>
      </FilterCard>

      {/* Content Filters Accordion Card */}
      <div
        style={{
          background: C.bgCard,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${C.creamFaint}12`,
        }}
      >
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${C.blue}, ${C.rose}88, transparent)`,
          }}
        />

        <button
          onClick={() => setShowContentFilters(!showContentFilters)}
          className="flex items-center justify-between"
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT_STACK,
            transition: "background 0.15s",
          }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <IconShield size={16} color={C.blueLight} />
            <span style={{ fontSize: 14, fontWeight: 500, color: C.cream }}>Content Filters</span>
            {(maxViolence || maxSexNudity || maxProfanity || maxSubstances || maxFrightening) && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: `${C.blueLight}20`,
                  color: C.blueLight,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Active
              </span>
            )}
          </div>
          {showContentFilters ? (
            <IconChevronUp size={16} color={C.creamMuted} />
          ) : (
            <IconChevronDown size={16} color={C.creamMuted} />
          )}
        </button>

        {showContentFilters && (
          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderTop: `1px solid ${C.creamFaint}12`,
              paddingTop: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: C.creamFaint, fontFamily: FONT_STACK }}>
              Set maximum levels for each category. Movies exceeding these levels will be filtered out.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap" style={{ gap: 8 }}>
              <button
                onClick={() => {
                  setMaxViolence(null)
                  setMaxSexNudity(null)
                  setMaxProfanity(null)
                  setMaxSubstances(null)
                  setMaxFrightening(null)
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.creamFaint}33`,
                  background: "transparent",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  color: C.creamMuted,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
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
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.green}44`,
                  background: `${C.green}12`,
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  color: C.green,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
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
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.yellow}44`,
                  background: `${C.yellow}12`,
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  color: C.yellow,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                Family Night
              </button>
            </div>

            {/* Individual Category Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { label: "Violence", state: maxViolence, setter: setMaxViolence },
                { label: "Sex/Nudity", state: maxSexNudity, setter: setMaxSexNudity },
                { label: "Language", state: maxProfanity, setter: setMaxProfanity },
                { label: "Substances", state: maxSubstances, setter: setMaxSubstances },
                { label: "Frightening Scenes", state: maxFrightening, setter: setMaxFrightening },
              ] as const).map((category) => {
                const catColor = CONTENT_FILTER_COLORS[category.label] || C.creamMuted
                return (
                  <div key={category.label}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: FONT_STACK,
                          color: C.cream,
                        }}
                      >
                        {category.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-5" style={{ gap: 6 }}>
                      {[
                        { value: null, label: "Any" },
                        { value: "None", label: "None" },
                        { value: "Mild", label: "Mild" },
                        { value: "Moderate", label: "Mod" },
                        { value: "Severe", label: "Severe" },
                      ].map((level) => {
                        const isLevelSelected = category.state === level.value
                        return (
                          <button
                            key={level.value || "any"}
                            onClick={() =>
                              category.setter(level.value as ContentLevel)
                            }
                            style={{
                              padding: "7px 4px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 500,
                              fontFamily: FONT_STACK,
                              cursor: "pointer",
                              border: `1px solid ${isLevelSelected ? `${catColor}55` : `${C.creamFaint}28`}`,
                              background: isLevelSelected ? `${catColor}18` : "transparent",
                              color: isLevelSelected ? catColor : C.creamMuted,
                              transition: "all 0.15s ease",
                              textAlign: "center",
                            }}
                          >
                            {level.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: C.creamFaint,
                fontFamily: FONT_STACK,
              }}
            >
              Note: Movies without parental guide data in our database will still be shown.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
