"use client"

import useSWR from "swr"
import Image from "next/image"
import { SectionLabel } from "@/components/ui/section-label"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type PlannedWatchData = {
  id: string
  movieId: number
  movieTitle: string
  movieYear: number | null
  moviePoster: string | null
  status: string
  scheduledFor: string | null
  lockedInAt: string
  collectiveId: string | null
  myRsvpStatus: string
  createdByName: string | null
  participants: {
    userId: string
    name: string | null
    avatarUrl: string | null
    rsvpStatus: string
  }[]
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PlannedWatchesSection({ onAddClick }: { onAddClick?: () => void }) {
  const { data, mutate } = useSWR<{ watches: PlannedWatchData[] }>(
    "/api/planned-watches/upcoming",
    fetcher,
  )

  const watches = data?.watches ?? []
  const pendingInvites = watches.filter((w) => w.myRsvpStatus === "pending")
  const confirmedWatches = watches.filter((w) => w.myRsvpStatus !== "pending")

  const handleStatusUpdate = async (id: string, status: "watching" | "watched" | "cancelled") => {
    try {
      await fetch(`/api/planned-watches/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      mutate()
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleRsvp = async (id: string, rsvpStatus: "confirmed" | "declined") => {
    try {
      await fetch(`/api/planned-watches/${id}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpStatus }),
      })
      mutate()
    } catch (err) {
      console.error("Failed to update RSVP:", err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <SectionLabel>Planned Watches</SectionLabel>
          {confirmedWatches.length > 0 && (
            <span className="text-xs text-cream-faint">{confirmedWatches.length} upcoming</span>
          )}
          {pendingInvites.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: "#7c8bd4", background: "#7c8bd412", border: "1px solid #7c8bd425" }}
            >
              {pendingInvites.length} invite{pendingInvites.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onAddClick}
          className="w-7 h-7 rounded-lg border border-cream-faint/[0.12] flex items-center justify-center text-cream-faint hover:text-cream hover:border-cream-faint/[0.25] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {watches.length === 0 && (
        <div className="bg-card rounded-[14px] border border-cream-faint/[0.05] p-6 text-center">
          <p className="text-[13px] text-cream-faint mb-2">No planned watches yet</p>
          <button
            onClick={onAddClick}
            className="text-[13px] font-medium transition-colors"
            style={{ color: "#c97b3a" }}
          >
            Add your first one
          </button>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-2.5">
          {pendingInvites.map((watch) => (
            <div
              key={watch.id}
              className="bg-card rounded-[14px] border border-cream-faint/[0.05] relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]"
                style={{
                  background: "linear-gradient(to right, rgba(124,139,212,0.6), rgba(124,139,212,0.2), transparent)",
                }}
              />

              <div className="flex items-start gap-3.5 p-4">
                {/* Poster */}
                <div
                  className="shrink-0 rounded-md overflow-hidden border border-cream-faint/[0.08]"
                  style={{ width: 48, height: 68, background: "linear-gradient(145deg, #252119, #1a1714)" }}
                >
                  {watch.moviePoster && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${watch.moviePoster}`}
                      alt={watch.movieTitle}
                      width={48}
                      height={68}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-cream tracking-[-0.01em] leading-[1.3] truncate">
                    {watch.movieTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {watch.movieYear && (
                      <span className="text-xs text-cream-faint">{watch.movieYear}</span>
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                      style={{ color: "#7c8bd4", background: "#7c8bd412", border: "1px solid #7c8bd425" }}
                    >
                      Invite
                    </span>
                  </div>

                  {/* From */}
                  {watch.createdByName && (
                    <p className="text-[11px] mt-1 text-cream-faint">
                      From {watch.createdByName}
                    </p>
                  )}

                  {/* Timing label */}
                  {watch.scheduledFor && (
                    <p className="text-[11px] mt-1" style={{ color: "#7c8bd4" }}>
                      {watch.scheduledFor}
                    </p>
                  )}

                  {/* Participants */}
                  {watch.participants.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex">
                        {watch.participants.slice(0, 4).map((p, i) => (
                          <div
                            key={p.userId}
                            className="rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold"
                            style={{
                              width: 20,
                              height: 20,
                              background: p.avatarUrl
                                ? `url(${p.avatarUrl}) center/cover`
                                : "linear-gradient(135deg, #7c8bd488, #7c8bd444)",
                              color: "#0f0d0b",
                              marginLeft: i === 0 ? 0 : -6,
                              zIndex: watch.participants.length - i,
                              position: "relative",
                            }}
                          >
                            {!p.avatarUrl && (p.name?.[0] || "?")}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-cream-faint">
                        {watch.participants.length === 1
                          ? watch.participants[0].name || "1 person"
                          : `${watch.participants.length} watching`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept / Decline Actions */}
              <div className="flex border-t border-cream-faint/[0.06]">
                <button
                  onClick={() => handleRsvp(watch.id, "confirmed")}
                  className="flex-1 py-2.5 text-[12px] font-medium text-center transition-colors hover:bg-cream/[0.03]"
                  style={{ color: "#2ecc71" }}
                >
                  Accept
                </button>
                <div className="w-px bg-cream-faint/[0.06]" />
                <button
                  onClick={() => handleRsvp(watch.id, "declined")}
                  className="flex-1 py-2.5 text-[12px] font-medium text-cream-faint text-center transition-colors hover:bg-cream/[0.03]"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmed Watches */}
      {confirmedWatches.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {confirmedWatches.map((watch) => {
            return (
              <div
                key={watch.id}
                className="bg-card rounded-[14px] border border-cream-faint/[0.05] relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]"
                  style={{
                    background: watch.status === "watching"
                      ? "linear-gradient(to right, #2ecc71, #2ecc7140, transparent)"
                      : "linear-gradient(to right, rgba(201,123,58,0.45), transparent)",
                  }}
                />

                <div className="flex items-start gap-3.5 p-4">
                  {/* Poster */}
                  <div
                    className="shrink-0 rounded-md overflow-hidden border border-cream-faint/[0.08]"
                    style={{ width: 48, height: 68, background: "linear-gradient(145deg, #252119, #1a1714)" }}
                  >
                    {watch.moviePoster && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${watch.moviePoster}`}
                        alt={watch.movieTitle}
                        width={48}
                        height={68}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-cream tracking-[-0.01em] leading-[1.3] truncate">
                      {watch.movieTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {watch.movieYear && (
                        <span className="text-xs text-cream-faint">{watch.movieYear}</span>
                      )}
                      {watch.status === "watching" ? (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                          style={{ color: "#2ecc71", background: "#2ecc7112", border: "1px solid #2ecc7125" }}
                        >
                          Watching
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                          style={{ color: "#c97b3a", background: "#c97b3a12", border: "1px solid #c97b3a25" }}
                        >
                          Planned
                        </span>
                      )}
                    </div>

                    {/* Timing label */}
                    {watch.scheduledFor && (
                      <p className="text-[11px] mt-1" style={{ color: "#c97b3a" }}>
                        {watch.scheduledFor}
                      </p>
                    )}

                    {/* Participants */}
                    {watch.participants.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex">
                          {watch.participants.slice(0, 4).map((p, i) => (
                            <div
                              key={p.userId}
                              className="rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold"
                              style={{
                                width: 20,
                                height: 20,
                                background: p.avatarUrl
                                  ? `url(${p.avatarUrl}) center/cover`
                                  : "linear-gradient(135deg, #c97b3a88, #e8943a44)",
                                color: "#0f0d0b",
                                marginLeft: i === 0 ? 0 : -6,
                                zIndex: watch.participants.length - i,
                                position: "relative",
                              }}
                            >
                              {!p.avatarUrl && (p.name?.[0] || "?")}
                            </div>
                          ))}
                        </div>
                        <span className="text-[11px] text-cream-faint">
                          {watch.participants.length === 1
                            ? watch.participants[0].name || "1 person"
                            : `${watch.participants.length} watching`}
                        </span>
                      </div>
                    )}

                    {/* Locked in time */}
                    <p className="text-[11px] text-cream-faint/60 mt-1.5">
                      Locked in {getTimeAgo(watch.lockedInAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-cream-faint/[0.06]">
                  {watch.status === "planned" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(watch.id, "watching")}
                        className="flex-1 py-2.5 text-[12px] font-medium text-center transition-colors hover:bg-cream/[0.03]"
                        style={{ color: "#2ecc71" }}
                      >
                        Start Watching
                      </button>
                      <div className="w-px bg-cream-faint/[0.06]" />
                      <button
                        onClick={() => handleStatusUpdate(watch.id, "cancelled")}
                        className="flex-1 py-2.5 text-[12px] font-medium text-cream-faint text-center transition-colors hover:bg-cream/[0.03]"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {watch.status === "watching" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(watch.id, "watched")}
                        className="flex-1 py-2.5 text-[12px] font-medium text-center transition-colors hover:bg-cream/[0.03]"
                        style={{ color: "#c97b3a" }}
                      >
                        Mark as Watched
                      </button>
                      <div className="w-px bg-cream-faint/[0.06]" />
                      <button
                        onClick={() => handleStatusUpdate(watch.id, "cancelled")}
                        className="flex-1 py-2.5 text-[12px] font-medium text-cream-faint text-center transition-colors hover:bg-cream/[0.03]"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
