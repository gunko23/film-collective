"use client"

import { useState } from "react"

type InviteModalProps = {
  open: boolean
  onClose: () => void
  collectiveName: string
  collectiveId: string
}

export function InviteModal({ open, onClose, collectiveName, collectiveId }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)

  const handleCreateInvite = async () => {
    setCreatingInvite(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 7 }),
      })
      if (res.ok) {
        const invite = await res.json()
        setInviteCode(invite.invite_code)
      }
    } catch (err) {
      console.error("Error creating invite:", err)
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleCopyInviteLink = () => {
    if (!inviteCode) return
    const link = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(link)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const handleClose = () => {
    setInviteCode(null)
    setInviteCopied(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,9,8,0.82)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 360,
          borderRadius: 18,
          background: "#1a1714",
          border: "1px solid rgba(107,99,88,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 2, background: "linear-gradient(to right, #3d5a96, #ff6b2d44, transparent)" }} />

        <div style={{ padding: "24px 22px" }}>
          {/* Header */}
          <div style={{ marginBottom: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#e8e2d6", margin: 0 }}>
              Invite to {collectiveName}
            </h3>
            <p style={{ fontSize: 13, color: "#a69e90", margin: "6px 0 0" }}>
              Create an invite link to share with friends
            </p>
          </div>

          {/* Content */}
          <div style={{ marginTop: 20 }}>
            {!inviteCode ? (
              <button
                onClick={handleCreateInvite}
                disabled={creatingInvite}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  cursor: creatingInvite ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "linear-gradient(135deg, #ff6b2d, #ff8f5e)",
                  color: "#0a0908",
                  opacity: creatingInvite ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {creatingInvite ? "Creating..." : "Generate Invite Link"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      fontSize: 13,
                      borderRadius: 10,
                      border: "1px solid rgba(107,99,88,0.15)",
                      background: "#0f0d0b",
                      color: "#e8e2d6",
                      outline: "none",
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      border: `1px solid ${inviteCopied ? "rgba(74,158,142,0.4)" : "rgba(107,99,88,0.15)"}`,
                      background: inviteCopied ? "rgba(74,158,142,0.12)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {inviteCopied ? (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4a9e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a69e90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#6b6358", margin: 0 }}>
                  This link expires in 7 days
                </p>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "10px 0",
              borderRadius: 10,
              border: "1px solid rgba(107,99,88,0.12)",
              background: "transparent",
              color: "#a69e90",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {inviteCode ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
