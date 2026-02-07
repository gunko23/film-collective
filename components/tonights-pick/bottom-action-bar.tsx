import { C, FONT_STACK } from "./constants"
import { IconChevronRight, IconChevronLeft, IconSparkle, IconLoader, IconRefreshCw } from "./icons"

export function BottomActionBar({
  step,
  selectedMemberCount,
  loading,
  onContinue,
  onGetRecommendations,
  onBack,
  onShuffle,
  hasResults,
}: {
  step: "members" | "mood" | "results"
  selectedMemberCount: number
  loading: boolean
  onContinue: () => void
  onGetRecommendations: () => void
  onBack: () => void
  onShuffle: () => void
  hasResults: boolean
}) {
  if (step === "members") {
    return (
      <div
        style={{
          flexShrink: 0,
          zIndex: 20,
          padding: "12px 20px 20px",
          background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
        }}
      >
        <button
          onClick={onContinue}
          disabled={selectedMemberCount === 0}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 14,
            border: "none",
            cursor: selectedMemberCount === 0 ? "not-allowed" : "pointer",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: FONT_STACK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background:
              selectedMemberCount > 0
                ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                : `${C.creamFaint}22`,
            color: selectedMemberCount > 0 ? C.warmBlack : `${C.creamFaint}66`,
            opacity: selectedMemberCount === 0 ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
        >
          Continue
          <IconChevronRight size={18} color={selectedMemberCount > 0 ? C.warmBlack : `${C.creamFaint}66`} />
        </button>
      </div>
    )
  }

  if (step === "mood") {
    return (
      <div
        style={{
          flexShrink: 0,
          zIndex: 20,
          padding: "12px 20px 20px",
          background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <button
            onClick={onGetRecommendations}
            disabled={loading}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: FONT_STACK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
              color: C.warmBlack,
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <>
                <IconLoader size={18} color={C.warmBlack} />
                Finding films...
              </>
            ) : (
              <>
                <IconSparkle size={18} color={C.warmBlack} />
                Get Recommendations
              </>
            )}
          </button>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: FONT_STACK,
              color: C.creamMuted,
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "color 0.15s",
            }}
          >
            <IconChevronLeft size={16} color={C.creamMuted} />
            Back
          </button>
        </div>
      </div>
    )
  }

  if (step === "results" && hasResults) {
    return (
      <div
        style={{
          flexShrink: 0,
          zIndex: 20,
          padding: "12px 20px 20px",
          background: `linear-gradient(to top, ${C.bg} 60%, transparent)`,
        }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              border: `1px solid ${C.creamFaint}22`,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: FONT_STACK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: C.bgCard,
              color: C.cream,
              transition: "all 0.15s ease",
            }}
          >
            <IconChevronLeft size={16} color={C.cream} />
            Back
          </button>

          <button
            onClick={onShuffle}
            disabled={loading}
            style={{
              flex: 1.4,
              height: 46,
              borderRadius: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: FONT_STACK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
              color: C.warmBlack,
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <IconLoader size={16} color={C.warmBlack} />
            ) : (
              <IconRefreshCw size={16} color={C.warmBlack} />
            )}
            Shuffle
          </button>
        </div>
      </div>
    )
  }

  return null
}
