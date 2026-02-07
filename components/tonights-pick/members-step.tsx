import { C, FONT_STACK, getAvatarGradient } from "./constants"
import { MemberAvatar } from "./member-avatar"
import type { GroupMember } from "./types"

export function MembersStep({
  members,
  selectedMembers,
  onToggleMember,
  onSelectAll,
}: {
  members: GroupMember[]
  selectedMembers: string[]
  onToggleMember: (userId: string) => void
  onSelectAll: () => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex items-center justify-between">
        <p style={{ margin: 0, fontSize: 14, color: C.creamMuted, fontFamily: FONT_STACK }}>
          Who&apos;s watching tonight?
        </p>
        <button
          onClick={onSelectAll}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: FONT_STACK,
            color: C.blueLight,
            padding: "4px 8px",
          }}
        >
          Select All
        </button>
      </div>

      {/* Member grid */}
      <div className="grid grid-cols-1" style={{ gap: 10 }}>
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.userId)
          const [c1] = getAvatarGradient(member.name || "User")
          const memberColor = c1

          return (
            <button
              key={member.userId}
              onClick={() => onToggleMember(member.userId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 14,
                border: isSelected
                  ? `1px solid ${memberColor}55`
                  : `1px solid ${C.creamFaint}18`,
                background: isSelected
                  ? `linear-gradient(135deg, ${memberColor}10, ${memberColor}06)`
                  : C.bgCard,
                cursor: "pointer",
                textAlign: "left" as const,
                position: "relative" as const,
                overflow: "hidden",
                transition: "all 0.2s ease",
                fontFamily: FONT_STACK,
              }}
            >
              {/* Top accent bar when selected */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${memberColor}, ${memberColor}88, transparent)`,
                  }}
                />
              )}

              <MemberAvatar member={member} size={44} showCheckBadge={isSelected} />

              <div className="flex-1" style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 15,
                    fontWeight: 500,
                    color: C.cream,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.name}
                </span>
                {isSelected && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: memberColor,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Selected
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection count */}
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          color: C.creamMuted,
          padding: "4px 0",
          fontFamily: FONT_STACK,
        }}
      >
        {selectedMembers.length} of {members.length} selected
      </div>
    </div>
  )
}
