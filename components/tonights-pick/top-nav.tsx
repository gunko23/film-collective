import { C, FONT_STACK } from "./constants"
import { IconChevronLeft } from "./icons"

export function TopNav({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="flex items-center" style={{ padding: "12px 20px 8px", gap: 12 }}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center"
        style={{
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 0",
          color: C.creamMuted,
          fontSize: 14,
          fontFamily: FONT_STACK,
          fontWeight: 500,
        }}
      >
        <IconChevronLeft size={18} color={C.creamMuted} />
        <span>{label}</span>
      </button>
    </div>
  )
}
