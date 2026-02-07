"use client"

import { useState } from "react"
import Image from "next/image"
import { C, FONT_STACK, getAvatarGradient, getInitials } from "./constants"
import { IconCheck } from "./icons"

export function MemberAvatar({
  member,
  size = 44,
  showCheckBadge = false,
}: {
  member: { name: string; avatarUrl: string | null }
  size?: number
  showCheckBadge?: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const [c1, c2] = getAvatarGradient(member.name || "User")

  const avatarContent =
    !member.avatarUrl || imgError ? (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.cream,
          fontSize: size * 0.34,
          fontWeight: 600,
          fontFamily: FONT_STACK,
        }}
      >
        {getInitials(member.name || "User")}
      </div>
    ) : (
      <Image
        src={member.avatarUrl}
        alt={member.name || "User"}
        width={size}
        height={size}
        className="object-cover"
        style={{ width: size, height: size, borderRadius: "50%" }}
        onError={() => setImgError(true)}
      />
    )

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Gradient border ring */}
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          padding: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: C.bgCard,
            padding: 1,
            overflow: "hidden",
          }}
        >
          {avatarContent}
        </div>
      </div>
      {/* Orange check badge */}
      {showCheckBadge && (
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.bgCard}`,
          }}
        >
          <IconCheck size={10} color={C.warmBlack} />
        </div>
      )}
    </div>
  )
}
