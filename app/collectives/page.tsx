"use client"

import { useUser, useStackApp } from "@stackframe/stack"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ChevronRight, Users } from "lucide-react"
import Header from "@/components/header"
import { AuthErrorBoundary } from "@/components/auth-error-boundary"
import { LightLeaks } from "@/components/soulframe/light-leaks"
import { getCollectiveInitials } from "@/components/soulframe/collective-badge"

type Collective = {
  id: string
  name: string
  description: string | null
  role: string
  member_count: number
  created_at: string
}

const ACCENT_COLORS = ["#ff6b2d", "#3d5a96", "#4a9e8e", "#c4616a", "#d4a054"]

function getAccentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length]
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner"
    case "admin":
      return "Admin"
    default:
      return "Member"
  }
}

function MemberStack({ count, color }: { count: number; color: string }) {
  const dots = Array.from({ length: Math.min(count, 5) }, (_, i) => i)
  return (
    <div className="flex items-center">
      {dots.map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 20,
            height: 20,
            background: `linear-gradient(145deg, ${color}55, ${color}22)`,
            border: "1.5px solid #141210",
            marginLeft: i > 0 ? -7 : 0,
            zIndex: dots.length - i,
            position: "relative",
          }}
        />
      ))}
      <span
        className="ml-2.5 text-xs"
        style={{ color: "#807060", letterSpacing: "0.01em" }}
      >
        {count}
      </span>
    </div>
  )
}

function CollectiveCard({
  collective,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  collective: Collective
  index: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const accentColor = getAccentColor(index)
  const initials = getCollectiveInitials(collective.name)

  return (
    <Link
      href={`/collectives/${collective.id}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="block"
    >
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          background: isHovered ? "#15120f" : "#12100d",
          border: `1px solid ${isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`,
          padding: 18,
        }}
      >
        {/* Accent top line */}
        <div
          className="absolute top-0 left-6 right-6"
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}18, transparent)`,
          }}
        />

        {/* Row 1: Avatar + Name + Role + Arrow */}
        <div className="flex items-center gap-3.5 mb-2.5">
          {/* Initials avatar */}
          <div
            className="flex items-center justify-center shrink-0 rounded-xl"
            style={{
              width: 44,
              height: 44,
              background: `linear-gradient(145deg, ${accentColor}18, ${accentColor}08)`,
              border: `1px solid ${accentColor}20`,
            }}
          >
            <span
              className="text-sm font-bold font-serif"
              style={{
                color: accentColor,
                opacity: 0.85,
                letterSpacing: "0.04em",
              }}
            >
              {initials}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="text-base font-semibold text-foreground truncate"
                style={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                {collective.name}
              </h3>
              <span
                className="text-[9px] font-semibold uppercase shrink-0"
                style={{
                  padding: "2.5px 8px",
                  borderRadius: 6,
                  background: `${accentColor}12`,
                  color: accentColor,
                  letterSpacing: "0.08em",
                  border: `1px solid ${accentColor}18`,
                }}
              >
                {getRoleLabel(collective.role)}
              </span>
            </div>
            {collective.description && (
              <p
                className="text-xs mt-1 truncate italic"
                style={{ color: "#5a4a3a", lineHeight: 1.35 }}
              >
                {collective.description}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight
            className="h-4 w-4 shrink-0 transition-all duration-300"
            style={{
              color: "#504030",
              opacity: isHovered ? 0.7 : 0.3,
              transform: `translateX(${isHovered ? 2 : 0}px)`,
            }}
          />
        </div>

        {/* Members */}
        <MemberStack count={collective.member_count} color={accentColor} />
      </div>
    </Link>
  )
}

function CollectivesContent() {
  const user = useUser()
  const app = useStackApp()
  const [collectives, setCollectives] = useState<Collective[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchCollectives() {
      try {
        const res = await fetch("/api/collectives")
        if (res.ok) {
          const data = await res.json()
          setCollectives(data)
        }
      } catch (err) {
        console.error("Error fetching collectives:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectives()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LightLeaks />
        <main className="relative z-10 pt-6 lg:pt-28 pb-32 lg:pb-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl mx-auto mb-6"
              style={{ background: "rgba(255,107,45,0.08)" }}
            >
              <Users className="h-10 w-10 text-accent" />
            </div>
            <h1
              className="text-3xl font-bold text-foreground mb-4 font-serif"
              style={{ letterSpacing: "-0.025em" }}
            >
              Join a Collective
            </h1>
            <p
              className="text-sm mb-8 max-w-md mx-auto"
              style={{ color: "#605040" }}
            >
              Sign in to create or join collectives and share your movie taste
              with friends
            </p>
            <button
              onClick={() => app.redirectToSignIn()}
              className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #ff6b2d, #cc5624)",
                color: "#0d0a08",
                boxShadow:
                  "0 4px 24px rgba(255,107,45,0.16), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Sign In to Continue
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LightLeaks />

      <main className="relative z-10 pt-6 lg:pt-28 pb-32 lg:pb-16">
        <div className="mx-auto max-w-2xl px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5 sf-reveal">
            <h1
              className="text-[28px] font-bold text-foreground font-serif"
              style={{ letterSpacing: "-0.025em" }}
            >
              Collectives
            </h1>
            {!loading && collectives.length > 0 && (
              <div
                className="flex items-center gap-1 rounded-[10px] px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <span className="text-[15px] font-bold text-accent font-serif">
                  {collectives.length}
                </span>
                <span
                  className="text-[10px] uppercase"
                  style={{ color: "#605040", letterSpacing: "0.08em" }}
                >
                  {collectives.length === 1 ? "group" : "groups"}
                </span>
              </div>
            )}
          </div>

          <p
            className="text-[13px] mb-5 sf-reveal sf-delay-1"
            style={{ color: "#605040", letterSpacing: "0.01em" }}
          >
            Share your taste in movies with your groups
          </p>

          {/* Create button */}
          <div className="mb-5 sf-reveal sf-delay-2">
            <Link href="/collectives/new" className="block">
              <button
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-[14px] text-sm font-semibold border-none"
                style={{
                  background: "linear-gradient(135deg, #ff6b2d, #cc5624)",
                  color: "#0d0a08",
                  letterSpacing: "0.02em",
                  boxShadow:
                    "0 4px 24px rgba(255,107,45,0.16), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create Collective
              </button>
            </Link>
          </div>

          {/* Divider */}
          <div className="mb-4 sf-reveal sf-delay-2">
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
              }}
            />
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl"
                  style={{
                    background: "#12100d",
                    border: "1px solid rgba(255,255,255,0.03)",
                    padding: 18,
                  }}
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div
                      className="rounded-xl"
                      style={{
                        width: 44,
                        height: 44,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    />
                    <div className="flex-1">
                      <div
                        className="rounded mb-2"
                        style={{
                          height: 14,
                          width: "40%",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      />
                      <div
                        className="rounded"
                        style={{
                          height: 10,
                          width: "65%",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-0">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className="rounded-full"
                        style={{
                          width: 20,
                          height: 20,
                          background: "rgba(255,255,255,0.03)",
                          marginLeft: j > 0 ? -7 : 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : collectives.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl sf-reveal sf-delay-3"
              style={{
                background: "#12100d",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-5"
                style={{ background: "rgba(255,107,45,0.06)" }}
              >
                <Users
                  className="h-8 w-8 text-accent"
                  style={{ opacity: 0.7 }}
                />
              </div>
              <h3
                className="text-lg font-semibold text-foreground mb-2"
                style={{ letterSpacing: "-0.01em" }}
              >
                No collectives yet
              </h3>
              <p
                className="text-sm mb-6 max-w-xs mx-auto"
                style={{ color: "#605040" }}
              >
                Create a collective to start sharing your movie ratings with
                friends
              </p>
              <Link href="/collectives/new">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #ff6b2d, #cc5624)",
                    color: "#0d0a08",
                    boxShadow:
                      "0 4px 24px rgba(255,107,45,0.16), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Create Your First Collective
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {collectives.map((c, index) => (
                <div
                  key={c.id}
                  className={`sf-reveal sf-delay-${Math.min(index + 3, 8)}`}
                >
                  <CollectiveCard
                    collective={c}
                    index={index}
                    isHovered={hoveredId === c.id}
                    onHover={() => setHoveredId(c.id)}
                    onLeave={() => setHoveredId(null)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Join via invite hint */}
          {!loading && (
            <div
              className="mt-6 py-3 px-4 rounded-xl text-center sf-reveal sf-delay-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <p className="text-xs" style={{ color: "#605040" }}>
                Have an invite link? Visit the URL shared with you to join a
                collective.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function CollectivesPage() {
  return (
    <AuthErrorBoundary>
      <CollectivesContent />
    </AuthErrorBoundary>
  )
}
