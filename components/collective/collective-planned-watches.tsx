"use client"

import useSWR from "swr"
import Image from "next/image"
import { SectionLabel } from "@/components/ui/section-label"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type CollectivePlannedWatchData = {
  id: string
  movieId: number
  movieTitle: string
  movieYear: number | null
  moviePoster: string | null
  status: string
  scheduledFor: string | null
  createdBy: string
  createdByName: string | null
  createdByAvatar: string | null
  isParticipant: boolean
  myRsvpStatus: string | null
  participants: {
    userId: string
    name: string | null
    avatarUrl: string | null
    rsvpStatus: string
  }[]
}

type Props = {
  collectiveId: string
}

export function CollectivePlannedWatchesSection({ collectiveId }: Props) {
  const { data, mutate } = useSWR<{ watches: CollectivePlannedWatchData[] }>(
    `/api/collectives/${collectiveId}/planned-watches`,
    fetcher,
  )

  const watches = data?.watches ?? []

  const handleJoin = async (watchId: string) => {
    try {
      await fetch(`/api/planned-watches/${watchId}/join`, { method: "POST" })
      mutate()
    } catch (err) {
      console.error("Failed to join planned watch:", err)
    }
  }

  if (watches.length === 0) return null

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionLabel>Planned Watches</SectionLabel>
        <span style={{ fontSize: 12, color: "#a69e90" }}>{watches.length} active</span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 4,
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {watches.map((watch) => {
          const confirmedParticipants = watch.participants.filter((p) => p.rsvpStatus === "confirmed")
          return (
            <div
              key={watch.id}
              style={{
                minWidth: 180,
                maxWidth: 200,
                borderRadius: 14,
                background: "#1a1714",
                border: "1px solid rgba(107,99,88,0.06)",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top accent */}
              <div
                style={{
                  height: 2,
                  background: watch.status === "watching"
                    ? "linear-gradient(to right, #2ecc71, #2ecc7140, transparent)"
                    : "linear-gradient(to right, rgba(201,123,58,0.45), transparent)",
                }}
              />

              <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Poster + info row */}
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 48,
                      height: 72,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "linear-gradient(145deg, #252119, #1a1714)",
                      border: "1px solid rgba(107,99,88,0.08)",
                      flexShrink: 0,
                    }}
                  >
                    {watch.moviePoster && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${watch.moviePoster}`}
                        alt={watch.movieTitle}
                        width={48}
                        height={72}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e8e2d6",
                        lineHeight: 1.3,
                        letterSpacing: "-0.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {watch.movieTitle}
                    </p>
                    {watch.movieYear && (
                      <p style={{ fontSize: 11, color: "#6b6358", marginTop: 2 }}>{watch.movieYear}</p>
                    )}
                    {watch.status === "watching" ? (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: "#2ecc71",
                          background: "#2ecc7112",
                          border: "1px solid #2ecc7125",
                        }}
                      >
                        Watching
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          padding: "2px 6px",
                          borderRadius: 4,
                          color: "#c97b3a",
                          background: "#c97b3a12",
                          border: "1px solid #c97b3a25",
                        }}
                      >
                        Planned
                      </span>
                    )}
                  </div>
                </div>

                {/* Timing */}
                {watch.scheduledFor && (
                  <p style={{ fontSize: 11, color: "#c97b3a", marginBottom: 6 }}>
                    {watch.scheduledFor}
                  </p>
                )}

                {/* Creator */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: watch.createdByAvatar
                        ? `url(${watch.createdByAvatar}) center/cover`
                        : "linear-gradient(135deg, #c97b3a88, #e8943a44)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 7,
                      fontWeight: 700,
                      color: "#0f0d0b",
                      flexShrink: 0,
                    }}
                  >
                    {!watch.createdByAvatar && (watch.createdByName?.[0] || "?")}
                  </div>
                  <span style={{ fontSize: 11, color: "#6b6358" }}>
                    {watch.createdByName || "Someone"}
                  </span>
                </div>

                {/* Participants */}
                {confirmedParticipants.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ display: "flex" }}>
                      {confirmedParticipants.slice(0, 4).map((p, i) => (
                        <div
                          key={p.userId}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: p.avatarUrl
                              ? `url(${p.avatarUrl}) center/cover`
                              : "linear-gradient(135deg, #c97b3a88, #e8943a44)",
                            border: "1.5px solid #1a1714",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 7,
                            fontWeight: 700,
                            color: "#0f0d0b",
                            marginLeft: i === 0 ? 0 : -5,
                            zIndex: confirmedParticipants.length - i,
                            position: "relative",
                          }}
                        >
                          {!p.avatarUrl && (p.name?.[0] || "?")}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: "#6b6358" }}>
                      {confirmedParticipants.length} watching
                    </span>
                  </div>
                )}

                {/* Join / Joined */}
                <div style={{ marginTop: "auto" }}>
                  {watch.isParticipant ? (
                    <div
                      style={{
                        width: "100%",
                        padding: "6px 0",
                        borderRadius: 8,
                        border: "1px solid #2ecc7125",
                        background: "#2ecc7108",
                        color: "#2ecc71",
                        fontSize: 11,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      Joined
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(watch.id)}
                      style={{
                        width: "100%",
                        padding: "6px 0",
                        borderRadius: 8,
                        border: "1px solid #c97b3a40",
                        background: "#c97b3a14",
                        color: "#e8943a",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontFamily: "inherit",
                      }}
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
