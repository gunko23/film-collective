import { FeedIcon, ChatIcon, FilmIcon, InsightsIcon } from "@/components/collective/collective-icons"

export type CollectiveTab = "feed" | "chat" | "films" | "insights" | "tonights-pick"

export const EASING = "cubic-bezier(0.16, 1, 0.3, 1)"

export function PillTabBar({
  activeTab,
  onTabChange,
  iconSize = 13,
  fontSize = "13px",
  padding = "9px 16px",
}: {
  activeTab: CollectiveTab
  onTabChange: (tab: CollectiveTab) => void
  iconSize?: number
  fontSize?: string
  padding?: string
}) {
  const tabs: { id: CollectiveTab; label: string; Icon: typeof FeedIcon }[] = [
    { id: "feed", label: "Feed", Icon: FeedIcon },
    { id: "chat", label: "Chat", Icon: ChatIcon },
    { id: "films", label: "Films", Icon: FilmIcon },
    { id: "insights", label: "Insights", Icon: InsightsIcon },
  ]

  return (
    <>
      <div style={{ display: "flex", gap: 6, padding: "20px 24px 0" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                padding,
                borderRadius: 22,
                fontSize,
                fontWeight: isActive ? 500 : 400,
                background: isActive
                  ? "linear-gradient(135deg, rgba(61,90,150,0.13), rgba(255,107,45,0.06))"
                  : "transparent",
                color: isActive ? "#e8e2d6" : "#6b6358",
                border: `1px solid ${isActive ? "rgba(61,90,150,0.16)" : "transparent"}`,
                transition: `all 0.35s ${EASING}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
              }}
            >
              <tab.Icon color={isActive ? "#e8e2d6" : "rgba(107,99,88,0.7)"} size={iconSize} />
              {tab.label}
            </button>
          )
        })}
      </div>
      {/* Gradient divider */}
      <div style={{ padding: "14px 24px 0" }}>
        <div style={{ height: 1, background: "linear-gradient(to right, rgba(61,90,150,0.07), rgba(255,107,45,0.05), transparent)" }} />
      </div>
    </>
  )
}
