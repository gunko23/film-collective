"use client"

import { useState, useEffect } from "react"
import { TonightsPickLoading } from "@/components/tonights-pick-loading"
import { C, FONT_STACK } from "./constants"
import { IconLoader } from "./icons"
import { GrainOverlay, LightLeaks } from "./decorative"
import { StepIndicator } from "./step-indicator"
import { TopNav } from "./top-nav"
import { MembersStep } from "./members-step"
import { MoodFiltersStep } from "./mood-filters-step"
import { FiltersStep } from "./filters-step"
import { ResultsStep } from "./results-step"
import { BottomActionBar } from "./bottom-action-bar"
import type { GroupMember, TonightPickResponse, MoodValue, Audience, ContentLevel } from "./types"

type Props = {
  collectiveId: string
  currentUserId: string
  onBack?: () => void
}

export function TonightsPick({ collectiveId, currentUserId, onBack }: Props) {
  const [step, setStep] = useState<"members" | "mood" | "filters" | "results">("members")
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedMoods, setSelectedMoods] = useState<MoodValue[]>([])
  const [audience, setAudience] = useState<Audience>("anyone")
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null)
  const [contentRating, setContentRating] = useState<string | null>(null)
  const [era, setEra] = useState<string | null>(null)
  const [startYear, setStartYear] = useState<number | null>(null)
  const [streamingProviders, setStreamingProviders] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [results, setResults] = useState<TonightPickResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPage, setResultsPage] = useState(1)
  const [shownTmdbIds, setShownTmdbIds] = useState<number[]>([])

  const [maxViolence, setMaxViolence] = useState<ContentLevel>(null)
  const [maxSexNudity, setMaxSexNudity] = useState<ContentLevel>(null)
  const [maxProfanity, setMaxProfanity] = useState<ContentLevel>(null)
  const [maxSubstances, setMaxSubstances] = useState<ContentLevel>(null)
  const [maxFrightening, setMaxFrightening] = useState<ContentLevel>(null)
  const [showContentFilters, setShowContentFilters] = useState(true)

  // Fetch members on mount
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/collectives/${collectiveId}/tonight`)
        if (!res.ok) throw new Error("Failed to fetch members")
        const data = await res.json()
        setMembers(data.members)
        setSelectedMembers([currentUserId])
      } catch (err) {
        setError("Failed to load members")
      } finally {
        setInitialLoading(false)
      }
    }
    fetchMembers()
  }, [collectiveId, currentUserId])

  // Load user's saved streaming providers on mount
  useEffect(() => {
    fetch("/api/streaming-providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.providers?.length > 0) {
          setStreamingProviders(data.providers.map((p: any) => p.providerId))
        }
      })
      .catch(() => {})
  }, [])

  const toggleStreamingProvider = (providerId: number) => {
    setStreamingProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId],
    )
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const selectAllMembers = () => {
    setSelectedMembers(members.map((m) => m.userId))
  }

  const getRecommendations = async (page: number = 1, excludeIds: number[] = []) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/collectives/${collectiveId}/tonight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedMembers,
          moods: selectedMoods,
          audience,
          maxRuntime,
          contentRating,
          era,
          startYear,
          streamingProviders: streamingProviders.length > 0 ? streamingProviders : null,
          page,
          parentalFilters: {
            maxViolence,
            maxSexNudity,
            maxProfanity,
            maxSubstances,
            maxFrightening,
          },
          excludeTmdbIds: excludeIds.length > 0 ? excludeIds : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get recommendations")
      }

      const data = await res.json()
      // Track all shown movie IDs for future shuffles
      const newIds = (data.recommendations || []).map((r: any) => r.tmdbId)
      if (excludeIds.length > 0) {
        setShownTmdbIds([...excludeIds, ...newIds])
      } else {
        setShownTmdbIds(newIds)
      }
      setResults(data)
      setResultsPage(page)
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const shuffleResults = () => {
    getRecommendations(resultsPage + 1, shownTmdbIds)
  }

  const isFullscreenMobile = !!onBack

  // ── Loading states ──
  if (initialLoading) {
    return (
      <div
        style={{
          ...(isFullscreenMobile
            ? { height: "100%", display: "flex", flexDirection: "column" as const, background: C.bg, alignItems: "center" as const, justifyContent: "center" as const }
            : {}),
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{ padding: "80px 0", fontFamily: FONT_STACK }}
        >
          <div className="flex items-center" style={{ gap: 12, color: C.creamMuted }}>
            <IconLoader size={20} color={C.creamMuted} />
            <span style={{ fontSize: 14 }}>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <TonightsPickLoading />
  }

  // ── Determine top nav labels ──
  const topNavConfig = {
    members: { label: "Back to Feed", action: onBack || (() => {}) },
    mood: { label: "Back to Who", action: () => setStep("members") },
    filters: { label: "Back to Mood", action: () => setStep("mood") },
    results: { label: "Back to Filters", action: () => setStep("filters") },
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        fontFamily: FONT_STACK,
        ...(isFullscreenMobile
          ? {
              height: "100%",
              background: "#0e0c0a",
              overflow: "hidden",
            }
          : {
              position: "relative" as const,
              minHeight: "100vh",
            }),
      }}
    >
      {/* Grain overlay */}
      {isFullscreenMobile && <GrainOverlay />}

      {/* Light leaks */}
      {isFullscreenMobile && <LightLeaks />}

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Global animation keyframes */}
      <style>{`
        @keyframes sfFadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Close (X) button — exits Tonight's Pick entirely */}
      {onBack && step === "results" && (
        <button
          onClick={onBack}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 60,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid #2a2622",
            background: "rgba(15,13,11,0.85)",
            color: "#666",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#555"
            e.currentTarget.style.color = "#aaa"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2a2622"
            e.currentTarget.style.color = "#666"
          }}
        >
          &#x2715;
        </button>
      )}

      {/* Top Nav */}
      {onBack && (
        <div style={{ position: "relative", zIndex: 10, flexShrink: 0 }}>
          <TopNav label={topNavConfig[step].label} onBack={topNavConfig[step].action} />
        </div>
      )}

      {/* Step Indicator */}
      <div style={{ position: "relative", zIndex: 10, paddingBottom: 16, flexShrink: 0 }}>
        <StepIndicator
          steps={[
            { key: "members", label: "Who" },
            { key: "mood", label: "Mood" },
            { key: "filters", label: "Filters" },
            { key: "results", label: "Results" },
          ]}
          currentStep={step}
        />
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1"
        style={{
          overflowY: "auto",
          position: "relative",
          zIndex: 5,
          paddingBottom: 16,
        }}
      >
        <div style={{ padding: "0 20px" }}>
          {/* Error */}
          {error && (
            <div
              style={{
                borderRadius: 10,
                border: `1px solid ${C.red}44`,
                background: `${C.red}12`,
                padding: "12px 16px",
                fontSize: 14,
                color: C.red,
                marginBottom: 16,
                fontFamily: FONT_STACK,
              }}
            >
              {error}
            </div>
          )}

          {/* STEP 1: WHO */}
          {step === "members" && (
            <MembersStep
              members={members}
              selectedMembers={selectedMembers}
              onToggleMember={toggleMember}
              onSelectAll={selectAllMembers}
            />
          )}

          {/* STEP 2: MOOD */}
          {step === "mood" && (
            <MoodFiltersStep
              selectedMoods={selectedMoods}
              setSelectedMoods={setSelectedMoods}
            />
          )}

          {/* STEP 3: FILTERS */}
          {step === "filters" && (
            <FiltersStep
              audience={audience}
              setAudience={setAudience}
              maxRuntime={maxRuntime}
              setMaxRuntime={setMaxRuntime}
              contentRating={contentRating}
              setContentRating={setContentRating}
              era={era}
              setEra={setEra}
              startYear={startYear}
              setStartYear={setStartYear}
              streamingProviders={streamingProviders}
              setStreamingProviders={setStreamingProviders}
              toggleStreamingProvider={toggleStreamingProvider}
              maxViolence={maxViolence}
              setMaxViolence={setMaxViolence}
              maxSexNudity={maxSexNudity}
              setMaxSexNudity={setMaxSexNudity}
              maxProfanity={maxProfanity}
              setMaxProfanity={setMaxProfanity}
              maxSubstances={maxSubstances}
              setMaxSubstances={setMaxSubstances}
              maxFrightening={maxFrightening}
              setMaxFrightening={setMaxFrightening}
              showContentFilters={showContentFilters}
              setShowContentFilters={setShowContentFilters}
            />
          )}

          {/* STEP 3: RESULTS */}
          {step === "results" && results && (
            <ResultsStep
              results={results}
              members={members.filter(m => selectedMembers.includes(m.userId))}
              collectiveId={collectiveId}
              onLockInComplete={() => {
                if (onBack) {
                  onBack()
                } else {
                  window.location.href = `/collectives/${collectiveId}`
                }
              }}
            />
          )}
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BARS */}
      <BottomActionBar
        step={step}
        selectedMemberCount={selectedMembers.length}
        loading={loading}
        onContinue={() => setStep(step === "members" ? "mood" : "filters")}
        onGetRecommendations={() => getRecommendations(1)}
        onBack={() => {
          if (step === "mood") setStep("members")
          else if (step === "filters") setStep("mood")
          else if (step === "results") setStep("filters")
        }}
        onShuffle={shuffleResults}
        hasResults={!!results}
      />
    </div>
  )
}
