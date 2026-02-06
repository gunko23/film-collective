"use client"

type FABProps = {
  onClick: () => void
}

export function LogFilmFAB({ onClick }: FABProps) {
  return (
    <>
      {/* Mobile FAB — above bottom nav */}
      <button
        onClick={onClick}
        className="lg:hidden fixed z-[200]"
        style={{
          bottom: 90,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6b2d, #ff8f5e)",
          boxShadow: "0 4px 20px rgba(255,107,45,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        aria-label="Log a film"
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0908"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Desktop FAB — bottom-right corner */}
      <button
        onClick={onClick}
        className="hidden lg:flex fixed z-[1001] hover:scale-[1.08]"
        style={{
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6b2d, #ff8f5e)",
          boxShadow: "0 4px 20px rgba(255,107,45,0.4)",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 6px 28px rgba(255,107,45,0.5), 0 0 0 8px rgba(255,107,45,0.06)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,107,45,0.4)"
        }}
        aria-label="Log a film"
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0908"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </>
  )
}
