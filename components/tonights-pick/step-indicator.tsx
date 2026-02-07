import { C, FONT_STACK } from "./constants"

export function StepIndicator({ currentStep }: { currentStep: "members" | "mood" | "results" }) {
  const steps = ["members", "mood", "results"] as const
  const labels = { members: "Who", mood: "Mood", results: "Results" }
  const currentIndex = steps.indexOf(currentStep)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "0 24px",
      }}
    >
      {steps.map((s, i) => {
        const isComplete = i < currentIndex
        const isActive = i === currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            {/* Node + label (inline) */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: isComplete
                    ? `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`
                    : isActive
                      ? `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`
                      : `${C.creamSoft}15`,
                  border: isActive
                    ? `1px solid ${C.blue}40`
                    : isComplete
                      ? "none"
                      : `1px solid ${C.creamSoft}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: FONT_STACK,
                  color: isComplete || isActive ? C.warmBlack : C.creamSoft,
                  transition: "all 0.35s ease",
                }}
              >
                {isComplete ? (
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.warmBlack}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.cream : isComplete ? C.creamMuted : C.creamSoft,
                  letterSpacing: "-0.01em",
                }}
              >
                {labels[s]}
              </span>
            </div>
            {/* Connector line after (except last) */}
            {!isLast && (
              <div
                style={{
                  width: 32,
                  height: 1,
                  margin: "0 10px",
                  background: isComplete
                    ? `linear-gradient(to right, ${C.orange}50, ${C.orange}20)`
                    : `${C.creamSoft}18`,
                  transition: "all 0.35s ease",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
