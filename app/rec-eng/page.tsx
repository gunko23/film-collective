"use client"

import { useState } from "react"

const C = {
  bg: "#08080d",
  bgSoft: "#0e0e16",
  surface: "#14141e",
  surfaceHi: "#1c1c2a",
  border: "#252538",
  borderHi: "#35354d",
  text: "#e4e2f0",
  textSoft: "#9694ad",
  textDim: "#5e5c74",
  gold: "#d4a843",
  goldDim: "#d4a84322",
  blue: "#5e8ff7",
  blueDim: "#5e8ff714",
  green: "#50d190",
  greenDim: "#50d19014",
  red: "#e6607a",
  redDim: "#e6607a14",
  purple: "#a07ef7",
  purpleDim: "#a07ef714",
  orange: "#ec9750",
  orangeDim: "#ec975014",
  cyan: "#50d1cf",
  cyanDim: "#50d1cf14",
}

const moods = ["fun", "funny", "intense", "emotional", "mindless", "acclaimed", "scary"]

type PhaseItem = {
  label: string
  desc: string
  accent?: boolean
}

type Phase = {
  key: string
  num: string
  title: string
  color: string
  dim: string
  summary: string
  items: PhaseItem[]
}

const phases: Phase[] = [
  {
    key: "input",
    num: "00",
    title: "User Request",
    color: C.gold,
    dim: C.goldDim,
    summary: "The user configures who's watching, what mood they're in, and any hard constraints.",
    items: [
      { label: "Members", desc: "1\u2013N people from a collective. Determines genre preferences, seen history, and group vs. solo scoring mode." },
      { label: "Mood", desc: `Optional mood filter: ${moods.join(", ")}. Activates mood-aware candidate sourcing with OR genre semantics and mood-dominant scoring.` },
      { label: "Audience", desc: "anyone \u00b7 teens \u00b7 adults \u2014 controls content rating floors and genre exclusions (e.g., Family/Animation excluded for adults)." },
      { label: "Hard filters", desc: "Max runtime, content rating (G/PG/PG-13/R), era/decade, streaming providers. Applied at both TMDB query and candidate filtering levels." },
      { label: "Shuffle state", desc: "Page offset and previously-shown TMDB IDs for pagination. Shown movies get a -25 score penalty instead of hard exclusion." },
    ],
  },
  {
    key: "phase1",
    num: "01",
    title: "Parallel DB Queries",
    color: C.blue,
    dim: C.blueDim,
    summary: "9 queries fire simultaneously against Film Collective's database. Zero sequential latency.",
    items: [
      { label: "Genre preferences", desc: "Aggregated avg score per genre across all selected members. Sorted by score \u2014 top genres drive candidate discovery and scoring." },
      { label: "Seen movies", desc: "Map of TMDB ID \u2192 which members have seen it. Used for partial-overlap scoring (not hard exclusion) and endorsement signal." },
      { label: "Dismissed movies", desc: "\"Not Interested\" list from all members \u2014 hard exclusion, these never enter scoring." },
      { label: "Disliked genres", desc: "Genres with 2+ ratings below 40/100. Each match applies a -15 penalty." },
      { label: "Era preferences", desc: "Average scores by decade (requires 5+ ratings). Top decade gets a +5 scoring bonus." },
      { label: "Crew affinities", desc: "Cached director and actor preference scores based on historical ratings. Directors: max +12, actors: max +12." },
      { label: "Taste-similar peers", desc: "Users in shared collectives with \u22655 overlapping ratings and <20 avg score difference. Feeds collaborative filtering." },
      { label: "Recommendation history", desc: "Movies shown in the last 30 days across all sessions. Repeat picks receive a -15 penalty." },
      { label: "Internal candidates", desc: "Top 100 movies from Film Collective's own DB, ranked by user rating \u00d7 rater confidence. Requires \u22652 raters. Applies runtime, era, and audience filters.", accent: true },
    ],
  },
  {
    key: "phase2",
    num: "02",
    title: "TMDB Discovery",
    color: C.purple,
    dim: C.purpleDim,
    summary: "External catalog fetches to supplement the internal candidate pool with discovery-oriented movies.",
    items: [
      { label: "Primary discovers (3 pages)", desc: "When a mood is active, genres use OR semantics \u2014 \"funny\" fetches Comedy OR Animation, not Comedy AND Animation AND Drama. Without mood, genres use AND." },
      { label: "Mood-genre discovers (2 pages)", desc: "Dedicated popularity-sorted pages using only mood genres with OR semantics. Always fires when a mood is selected, regardless of filter pressure.", accent: true },
      { label: "User-preference discover", desc: "Separate page for the group's top preferred genres (OR semantics) so taste-relevant candidates aren't lost when primary discovers are mood-focused.", accent: true },
      { label: "Wildcard discover", desc: "No genre filter, high-quality floor (7.0+ rating, 500+ votes). Catches genre-defying gems." },
      { label: "Popular / top-rated pages", desc: "Broad popularity and top-rated endpoints for general discovery coverage." },
      { label: "Power user deep pages", desc: "2\u20133 extra pages if the group has seen 200+ movies, since shallow pages are mostly exhausted." },
      { label: "Pressure-based extra fetches", desc: "Activated when filter pressure is high (many constraints stacking). Includes broadened genre, mood-only (OR), and genre-free discovers." },
      { label: "Collab + influence injection", desc: "Up to 10 movies loved by taste-similar peers + 25 from collective friends, fetched from TMDB by ID if not already in the pool." },
      { label: "Emergency fallback", desc: "If viable pool <15 after all fetches, 5 extra pages with relaxed quality floors." },
    ],
  },
  {
    key: "phase3",
    num: "03",
    title: "Pool Assembly",
    color: C.cyan,
    dim: C.cyanDim,
    summary: "Internal DB candidates form the base. TMDB results merge on top. Then filter, deduplicate, and enrich.",
    items: [
      { label: "Internal-first seeding", desc: "Candidate array starts with internal DB movies. TMDB results are appended after, so internal movies always enter the pool.", accent: true },
      { label: "Deduplication", desc: "Map by TMDB ID \u2014 if a movie appears in both sources, the TMDB version wins (richer popularity/poster metadata)." },
      { label: "Quality gate", desc: "Remove movies with <50 votes (200 for acclaimed), <5.0 avg, no poster, no overview, or zero genres. Prevents broken UI and unreliable scoring." },
      { label: "OMDb batch load", desc: "Cached IMDb, Rotten Tomatoes, and Metacritic scores. Powers the composite quality signal (35/35/30 weighting)." },
      { label: "Mood scores batch", desc: "Cached LLM mood affinity scores (0.0\u20131.0 per mood). Falls back to rule-based genre heuristics for unscored movies." },
      { label: "Selected member ratings", desc: "Actual ratings from the selected members for partially-seen candidates. Powers the endorsement signal." },
      { label: "Internal signal batch", desc: "Avg rating + rater count for any candidate that exists in Film Collective's DB, including TMDB-sourced ones.", accent: true },
    ],
  },
  {
    key: "phase4",
    num: "04",
    title: "First-Pass Scoring",
    color: C.green,
    dim: C.greenDim,
    summary: "Every candidate is scored without crew credits. Sorted, mood-gated, and trimmed to the top 30.",
    items: [
      { label: "Hard exclusions", desc: "Skip dismissed movies, runtime violations, all-members-seen movies, and movies with avoided genres." },
      { label: "calculateGroupFitScore()", desc: "The full scoring function runs on each surviving candidate. See the Scoring tab for the complete breakdown." },
      { label: "Sort by score", desc: "Descending groupFitScore \u2014 best matches float to the top." },
      { label: "Mood gating", desc: "Progressive threshold: 0.4 \u2192 0.25 \u2192 0.15. Movies must pass a minimum mood affinity on every selected mood. Unscored movies are exempted." },
      { label: "Take top 30", desc: "Only the top 30 survive to the credit enrichment phase to keep latency manageable." },
    ],
  },
  {
    key: "phase5",
    num: "05",
    title: "Credit Enrichment",
    color: C.orange,
    dim: C.orangeDim,
    summary: "Fetch director and actor credits for the top 30, then re-score with crew affinity signals active.",
    items: [
      { label: "Credit lookup", desc: "Cached TMDB credits for each candidate \u2014 extracts director IDs and top 5 billed actors." },
      { label: "Full re-score", desc: "calculateGroupFitScore() runs again, now with crew affinity signals (director +12 max, actors +12 max) active." },
      { label: "Re-sort", desc: "Ordering may change significantly after crew bonuses are applied." },
      { label: "Popularity floor", desc: "Remove truly obscure films (popularity <2) unless they came from collaborative recommendations." },
      { label: "Franchise dedup", desc: "Keep only the highest-scored entry per franchise using title similarity matching." },
    ],
  },
  {
    key: "phase6",
    num: "06",
    title: "Final Selection",
    color: C.gold,
    dim: C.goldDim,
    summary: "Parental filtering, AI reasoning, concession pairings, and the final 5 recommendations.",
    items: [
      { label: "Parental guide filter", desc: "Batch IMDb content advisory data. Filter by user's max severity for violence, sex/nudity, profanity, substances, and frightening content." },
      { label: "Take top 5", desc: "First 5 movies passing parental filters from the re-scored, deduped pool." },
      { label: "LLM reasoning", desc: "Claude Haiku generates natural-language recommendation summaries personalized to the group's taste profile." },
      { label: "Concession pairings", desc: "AI-generated cocktail, zero-proof drink, and snack pairings themed to each movie." },
      { label: "History logging", desc: "Fire-and-forget insert into recommendation_history for cross-session deduplication. 5% chance of cleanup of 90+ day old rows." },
    ],
  },
]

type ScoringItem = {
  name: string
  pts: string
  desc: string
}

type ScoringSection = {
  section: string
  color: string
  items: ScoringItem[]
}

const scoringSignals: ScoringSection[] = [
  { section: "Foundation", color: C.textSoft, items: [
    { name: "Base score", pts: "55", desc: "Starting point for every candidate that survived hard filters" },
    { name: "Preferred genre base", pts: "+3", desc: "Matches at least one of the group's preferred genres" },
    { name: "Well-rounded bonus", pts: "+5", desc: "3+ distinct signal categories fired (genre, mood, quality, crew, social, etc.)" },
    { name: "Final clamp", pts: "0\u2013100", desc: "Score clamped to valid range" },
  ]},
  { section: "Genre & Taste", color: C.blue, items: [
    { name: "Genre match", pts: "up to ~40", desc: "Weighted by member avg scores. Top 3 genres: \u00d718 multiplier, genres 4\u20138: \u00d715. Confidence scales with rating count." },
    { name: "Disliked genre", pts: "-15 each", desc: "Per genre the group has rated below 40/100 at least twice" },
    { name: "Seen penalty", pts: "-10 to -15 / -30", desc: "Scaled by % of members who've seen it. Group mode: -15 base, solo: -30 base." },
  ]},
  { section: "Social Signals", color: C.green, items: [
    { name: "Member endorsement", pts: "+10 to +30", desc: "Selected members' actual ratings. \u226585 avg \u2192 +30, \u226570 \u2192 +20, \u226555 \u2192 +10, <40 \u2192 -10 penalty." },
    { name: "Collaborative filtering", pts: "up to +20", desc: "Loved by taste-similar peers (\u226575 avg, \u22652 peers agreeing)" },
    { name: "Collective influence", pts: "up to +30", desc: "Friends in your collectives rated it highly. Bonus scaling for 2+ and 3+ raters." },
    { name: "Internal DB signal", pts: "up to +15", desc: "Rated by Film Collective users platform-wide. Quality tier (80+ avg: +8, 65+: +4) + confidence tier (5+ raters: +7, 3+: +5, 2+: +3)." },
  ]},
  { section: "Mood System", color: C.purple, items: [
    { name: "Mood bonus", pts: "0 to +40", desc: "Mood fit (0.0\u20131.0) \u00d7 40. Multi-mood uses geometric mean for AND semantics \u2014 must score well on all moods." },
    { name: "Threshold fail penalty", pts: "-20", desc: "If any selected mood score falls below the 0.25 minimum threshold" },
    { name: "Mood dampening", pts: "\u00d70.5\u20131.0", desc: "When moodFit < 0.5, all bonuses above base are multiplicatively scaled down. Prevents quality from overriding poor mood fit." },
  ]},
  { section: "Quality & Critics", color: C.cyan, items: [
    { name: "Quality bonus", pts: "+5 to +15", desc: "Composite score: IMDb 35% + Rotten Tomatoes 35% + Metacritic 30%. Falls back to TMDB vote_average." },
    { name: "Acclaimed bonus", pts: "up to +19", desc: "Only when 'acclaimed' mood is selected. RT \u226585: +8, Metacritic \u226575: +6, IMDb \u22657.5: +5." },
  ]},
  { section: "Discovery & Availability", color: C.orange, items: [
    { name: "Availability", pts: "+2 to +13", desc: "Step bonuses for popularity (>20/50/100) and vote count (>1K/2K/5K)" },
    { name: "Vote confidence", pts: "+1 to +5", desc: "Continuous log\u2081\u2080(votes)/5 \u2014 complements the step-based availability signal" },
  ]},
  { section: "Crew & Era", color: C.orange, items: [
    { name: "Director affinity", pts: "up to +12", desc: "Directed by someone whose films the group rates highly (top match only)" },
    { name: "Actor affinity", pts: "up to +12", desc: "Stars up to 2 actors the group enjoys, +6 max each" },
    { name: "Era preference", pts: "+5", desc: "Released in the group's highest-rated decade" },
  ]},
  { section: "Penalties & Dedup", color: C.red, items: [
    { name: "Previously shown", pts: "-25", desc: "Movies shown earlier in the current shuffle session" },
    { name: "Recently recommended", pts: "-15", desc: "Movies recommended in the last 30 days across sessions" },
    { name: "Audience mismatch", pts: "-8 to -15", desc: "Family content for adults (-15), kid animation for teens (-8)" },
  ]},
]

function PhaseCard({ phase, expanded, onToggle }: { phase: Phase; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? phase.dim : C.surface,
        border: `1px solid ${expanded ? phase.color + "44" : C.border}`,
        borderRadius: 14,
        padding: "18px 22px",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: phase.color,
          opacity: 0.6,
          letterSpacing: "0.05em",
          minWidth: 22,
        }}>{phase.num}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{phase.title}</div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 3, lineHeight: 1.45 }}>{phase.summary}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <path d="M6 3L11 8L6 13" stroke={C.textDim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {phase.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, padding: "10px 14px",
              background: item.accent ? phase.color + "0c" : C.bg + "aa",
              borderRadius: 10,
              border: item.accent ? `1px solid ${phase.color}25` : "1px solid transparent",
              alignItems: "baseline",
            }}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: item.accent ? phase.color : C.text,
                minWidth: 0, whiteSpace: "nowrap", flexShrink: 0,
              }}>{item.label}</span>
              <span style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Connector({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
      <div style={{ width: 1.5, height: 14, background: `linear-gradient(${from}33, ${to}33)` }} />
    </div>
  )
}

export default function RecEngPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pipeline")
  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  const tabs = [
    { id: "pipeline", label: "Pipeline" },
    { id: "scoring", label: "Scoring" },
    { id: "architecture", label: "Architecture" },
  ]

  return (
    <div style={{
      background: C.bg,
      color: C.text,
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      padding: "28px 20px 40px",
      maxWidth: 880,
      margin: "0 auto",
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: C.gold,
          textTransform: "uppercase", marginBottom: 8,
        }}>Film Collective</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
          Recommendation Engine
        </h1>
        <p style={{ fontSize: 13, color: C.textSoft, marginTop: 6 }}>
          How Tonight&apos;s Pick finds the perfect movie
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 24, background: C.surface,
        borderRadius: 12, padding: 3, border: `1px solid ${C.border}`,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
              background: activeTab === tab.id ? C.surfaceHi : "transparent",
              color: activeTab === tab.id ? C.text : C.textDim,
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* PIPELINE TAB */}
      {activeTab === "pipeline" && (
        <div>
          <p style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginBottom: 14, marginTop: 0 }}>
            Tap any phase to expand &middot; Highlighted items are internal-DB-powered signals
          </p>
          {phases.map((phase, i) => (
            <div key={phase.key}>
              <PhaseCard
                phase={phase}
                expanded={expandedPhase === phase.key}
                onToggle={() => setExpandedPhase(expandedPhase === phase.key ? null : phase.key)}
              />
              {i < phases.length - 1 && <Connector from={phase.color} to={phases[i + 1].color} />}
            </div>
          ))}
        </div>
      )}

      {/* SCORING TAB */}
      {activeTab === "scoring" && (
        <div>
          <p style={{ fontSize: 12, color: C.textDim, textAlign: "center", marginBottom: 16, marginTop: 0 }}>
            Every signal in <span style={{ fontFamily: "'Space Mono', monospace", color: C.textSoft }}>calculateGroupFitScore()</span> &mdash; applied top to bottom
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scoringSignals.map((section, si) => {
              const isOpen = expandedSection === si
              return (
                <div key={si} style={{
                  background: C.surface,
                  border: `1px solid ${isOpen ? section.color + "33" : C.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  <div
                    onClick={() => setExpandedSection(isOpen ? null : si)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: section.color, opacity: 0.7 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{section.section}</span>
                      <span style={{ fontSize: 11, color: C.textDim }}>
                        {section.items.length} signal{section.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M6 3L11 8L6 13" stroke={C.textDim} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                      {section.items.map((item, ii) => (
                        <div key={ii} style={{
                          display: "grid",
                          gridTemplateColumns: "100px 1fr",
                          gap: 12,
                          padding: "10px 14px",
                          background: C.bgSoft,
                          borderRadius: 8,
                          alignItems: "baseline",
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: section.color, fontFamily: "'Space Mono', monospace" }}>
                              {item.pts}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginTop: 2 }}>{item.name}</div>
                          </div>
                          <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Score range visualization */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Realistic Score Ranges</div>
            {[
              { label: "Weak match", detail: "Genre miss, no social signals", range: "55\u201365", pct: 15, color: C.red },
              { label: "Decent match", detail: "Good genre + quality + availability", range: "65\u201378", pct: 38, color: C.orange },
              { label: "Strong match", detail: "Genre + mood fit + social signal", range: "78\u201388", pct: 65, color: C.gold },
              { label: "Exceptional", detail: "Endorsed by group + multi-signal convergence", range: "88\u2013100", pct: 92, color: C.green },
            ].map((tier, i) => (
              <div key={i} style={{ marginBottom: i < 3 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{tier.label}</span>
                    <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>{tier.detail}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tier.color, fontFamily: "'Space Mono', monospace" }}>{tier.range}</span>
                </div>
                <div style={{ height: 5, background: C.bgSoft, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${tier.pct}%`, height: "100%", background: tier.color, borderRadius: 3, opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Scoring order */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginTop: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Signal Evaluation Order</div>
            <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7 }}>
              Base (55) &rarr; Genre preference (+3 base, then weighted match) &rarr; Disliked genre penalty &rarr;
              Seen penalty &rarr; Member endorsement &rarr; Shuffle / history penalties &rarr; <span style={{ color: C.purple }}>Mood bonus + threshold penalty</span> &rarr;
              Quality bonus &rarr; Acclaimed bonus &rarr; Audience penalty &rarr; Availability + vote confidence &rarr;
              Director affinity &rarr; Actor affinity &rarr; Era preference &rarr; Collaborative filtering &rarr;
              Collective influence &rarr; Internal DB signal &rarr; <span style={{ color: C.purple }}>Mood dampening (multiplicative)</span> &rarr; Well-rounded bonus &rarr; Clamp 0&ndash;100
            </div>
          </div>
        </div>
      )}

      {/* ARCHITECTURE TAB */}
      {activeTab === "architecture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Candidate sourcing */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Candidate Sourcing Strategy</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Internal DB", count: "~100", desc: "Platform-rated movies, ranked by score \u00d7 confidence", color: C.green },
                { label: "TMDB Primary", count: "~60", desc: "Mood-genre OR discovers + user preference OR discovers", color: C.purple },
                { label: "TMDB Wildcard", count: "~20", desc: "No genre filter, high quality floor", color: C.blue },
                { label: "TMDB Popular", count: "~40", desc: "Popular + top-rated endpoints", color: C.blue },
                { label: "Collab Recs", count: "\u226410", desc: "Movies loved by taste-similar peers", color: C.orange },
                { label: "Collective", count: "\u226425", desc: "Movies loved by friends in collectives", color: C.orange },
              ].map((src, i) => (
                <div key={i} style={{
                  flex: "1 1 220px", minWidth: 200, background: C.bgSoft, borderRadius: 10,
                  padding: 14, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: src.color }}>{src.label}</span>
                    <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: C.textDim }}>{src.count}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.4 }}>{src.desc}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 12, padding: "10px 14px", background: C.bgSoft, borderRadius: 8,
              fontSize: 12, color: C.textSoft, lineHeight: 1.5, border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontWeight: 600, color: C.text }}>Pool assembly:</span> Internal DB seeds the array first &rarr; TMDB results appended &rarr;
              Deduplication by TMDB ID (TMDB metadata wins on overlap) &rarr; Quality gate removes thin entries &rarr;
              Typical viable pool after dedup + filtering: 150&ndash;300 unique movies.
            </div>
          </div>

          {/* Mood system deep dive */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: C.purple }}>Mood System</div>
            <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, marginBottom: 14 }}>
              The mood system operates at three levels &mdash; it shapes which movies enter the pool, how they&apos;re scored, and which survive the final gate.
            </div>
            {[
              {
                level: "Sourcing",
                desc: "TMDB genre queries switch to OR semantics. \"Funny\" \u2192 withGenres=\"35|16\" (Comedy OR Animation). Dedicated mood-genre pages always fire.",
                color: C.purple,
              },
              {
                level: "Scoring",
                desc: "Mood bonus: fit \u00d7 40 points. Geometric mean for multi-mood AND semantics. Threshold fail: -20. Dampening for moodFit < 0.5 scales down all non-mood bonuses.",
                color: C.purple,
              },
              {
                level: "Gating",
                desc: "Progressive threshold after first-pass scoring: 0.4 \u2192 0.25 \u2192 0.15. Each selected mood must independently pass. Unscored movies exempted.",
                color: C.purple,
              },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, padding: "10px 14px", background: C.bgSoft,
                borderRadius: 8, marginBottom: i < 2 ? 6 : 0, alignItems: "baseline",
                border: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.color, minWidth: 65 }}>{row.level}</span>
                <span style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{row.desc}</span>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: 14, background: C.purpleDim, borderRadius: 8,
              border: `1px solid ${C.purple}22`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, marginBottom: 6 }}>Available moods</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {moods.map(m => (
                  <span key={m} style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                    background: C.surface, color: C.textSoft, border: `1px solid ${C.border}`,
                  }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Quality score breakdown */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: C.cyan }}>Quality Score Composite</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { label: "IMDb", weight: "35%", color: C.gold },
                { label: "Rotten Tomatoes", weight: "35%", color: C.red },
                { label: "Metacritic", weight: "30%", color: C.cyan },
              ].map((src, i) => (
                <div key={i} style={{
                  flex: "1 1 140px", padding: "10px 14px", background: C.bgSoft, borderRadius: 8,
                  textAlign: "center", border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: src.color, fontFamily: "'Space Mono', monospace" }}>{src.weight}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>{src.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
              Sourced from cached OMDb data. Falls back to TMDB <span style={{ fontFamily: "'Space Mono', monospace" }}>vote_average</span> when OMDb
              data is unavailable. Composite score maps to bonus tiers: 85+ &rarr; +15, 75+ &rarr; +12, 65+ &rarr; +8, 50+ &rarr; +5.
            </div>
          </div>

          {/* Dedup & freshness */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Deduplication &amp; Freshness</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "In-session shuffle", pts: "-25", desc: "Previously shown movies in the current session get a score penalty rather than hard exclusion" },
                { label: "Cross-session history", pts: "-15", desc: "Movies shown in the last 30 days are deprioritized. History auto-cleans rows older than 90 days." },
                { label: "Franchise dedup", pts: "\u2014", desc: "Title similarity matching keeps only the top-scoring entry per franchise (Godfather \u2192 best one only)" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "10px 14px", background: C.bgSoft,
                  borderRadius: 8, alignItems: "baseline", border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.red, fontFamily: "'Space Mono', monospace", minWidth: 36 }}>{row.pts}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{row.label}: </span>
                    <span style={{ fontSize: 12, color: C.textSoft }}>{row.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External services */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>External Services</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { name: "TMDB", role: "Candidate sourcing, metadata, credits, streaming providers", color: C.purple },
                { name: "OMDb / IMDb", role: "Quality scores (IMDb, RT, Metacritic), parental content guides", color: C.gold },
                { name: "Claude Haiku", role: "Recommendation reasoning, concession pairings, mood score generation", color: C.cyan },
                { name: "Neon Postgres", role: "All user data, ratings, mood cache, crew affinity cache, rec history", color: C.green },
              ].map((svc, i) => (
                <div key={i} style={{
                  flex: "1 1 200px", minWidth: 180, padding: "12px 14px", background: C.bgSoft,
                  borderRadius: 8, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: svc.color, marginBottom: 3 }}>{svc.name}</div>
                  <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.4 }}>{svc.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
