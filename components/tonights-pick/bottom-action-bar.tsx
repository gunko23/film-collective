import { C, FONT_STACK } from "./constants"
import { IconChevronRight, IconChevronLeft, IconSparkle, IconLoader } from "./icons"

const SANS = "'DM Sans', sans-serif"

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
  step: "members" | "mood" | "filters" | "results"
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
            onClick={onContinue}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: FONT_STACK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
              color: C.warmBlack,
              transition: "all 0.2s ease",
            }}
          >
            Continue
            <IconChevronRight size={18} color={C.warmBlack} />
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

  if (step === "filters") {
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
          padding: "12px 14px 20px",
          background: "linear-gradient(180deg, transparent 0%, #0e0c0a 30%)",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 10,
              border: "1px solid #2a2420",
              background: "#141210",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "all 0.2s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7e70"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span
              style={{
                fontSize: 14,
                color: "#8a7e70",
                fontFamily: SANS,
                fontWeight: 600,
              }}
            >
              Back
            </span>
          </button>
          <button
            onClick={onShuffle}
            disabled={loading}
            style={{
              flex: 1.5,
              padding: 14,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #e8843a, #d46a28)",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: "0 4px 20px #e8843a33",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <IconLoader size={16} color="#fff" />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M23 4l-6 6" />
                <path d="M17 4h6v6" />
                <path d="M1 20l6-6" />
                <path d="M7 20H1v-6" />
              </svg>
            )}
            <span
              style={{
                fontSize: 14,
                color: "#fff",
                fontFamily: SANS,
                fontWeight: 700,
              }}
            >
              Shuffle
            </span>
          </button>
        </div>
      </div>
    )
  }

  return null
}
