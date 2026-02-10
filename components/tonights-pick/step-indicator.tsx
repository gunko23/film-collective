const SANS = "'DM Sans', sans-serif"

type StepConfig = { key: string; label: string }

export function StepIndicator({ steps, currentStep }: { steps: StepConfig[]; currentStep: string }) {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "4px 0 8px",
      }}
    >
      {steps.map((s, i) => {
        const isComplete = i < currentIndex
        const isActive = i === currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: isComplete
                    ? "#e8843a"
                    : isActive
                      ? "#e8843a22"
                      : "#1a1816",
                  border: isActive ? "1.5px solid #e8843a" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: isComplete ? "#fff" : isActive ? "#e8843a" : "#555",
                  fontFamily: SANS,
                }}
              >
                {isComplete ? (
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: isComplete || isActive ? "#ccc" : "#555",
                  fontFamily: SANS,
                  fontWeight: 500,
                }}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  width: 28,
                  height: 1.5,
                  background: isComplete
                    ? "linear-gradient(90deg, #e8843a, #e8843a88)"
                    : "#2a2420",
                  margin: "0 8px",
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
